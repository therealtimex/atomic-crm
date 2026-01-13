import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import {
  useDataProvider,
  useInfinitePaginationContext,
  useGetIdentity,
  useListContext,
  useNotify,
  useTranslate,
  type DataProvider,
} from "ra-core";
import { useEffect, useMemo, useRef, useState } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Task } from "../types";
import { TaskColumn } from "./TaskColumn";
import type { TasksByStatus } from "./tasks";
import {
  getTasksByStatus,
  OTHER_TASK_STATUS_ID,
  OTHER_TASK_STATUS_LABEL,
} from "./tasks";

const TASKS_UPDATE_PAGE_SIZE = 1000;

export const TaskKanbanView = () => {
  const { taskStatuses } = useConfigurationContext();
  const { data: unorderedTasks, isPending, refetch } = useListContext<Task>();
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const translate = useTranslate();
  const { identity } = useGetIdentity();
  const { fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfinitePaginationContext();

  const containerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const collapseStorageKey = useMemo(
    () => `realtimex_crm_tasks_kanban_collapsed_${identity?.id ?? "anonymous"}`,
    [identity?.id],
  );

  const [collapsedStatuses, setCollapsedStatuses] = useState<
    Record<string, boolean>
  >({});
  const [isCollapsedHydrated, setIsCollapsedHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsCollapsedHydrated(false);
    try {
      const stored = window.localStorage.getItem(collapseStorageKey);
      setCollapsedStatuses(stored ? JSON.parse(stored) : {});
    } catch {
      setCollapsedStatuses({});
    }
    setIsCollapsedHydrated(true);
  }, [collapseStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isCollapsedHydrated) return;

    try {
      window.localStorage.setItem(
        collapseStorageKey,
        JSON.stringify(collapsedStatuses),
      );
    } catch {
      // ignore write failures (private mode, storage quota, etc.)
    }
  }, [collapseStorageKey, collapsedStatuses, isCollapsedHydrated]);

  const hasOtherStatus =
    taskStatuses?.some((status) => status.id === OTHER_TASK_STATUS_ID) ?? false;
  const isOtherBucketReadOnly = !hasOtherStatus;
  const kanbanStatuses = useMemo(() => {
    if (!taskStatuses) return [];
    if (hasOtherStatus) return taskStatuses;
    return [
      ...taskStatuses,
      { id: OTHER_TASK_STATUS_ID, name: OTHER_TASK_STATUS_LABEL },
    ];
  }, [hasOtherStatus, taskStatuses]);

  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>(() =>
    getTasksByStatus([], taskStatuses, { includeOther: true }),
  );

  useEffect(() => {
    if (unorderedTasks) {
      const newTasksByStatus = getTasksByStatus(unorderedTasks, taskStatuses, {
        includeOther: true,
      });
      if (!isEqual(newTasksByStatus, tasksByStatus)) {
        setTasksByStatus(newTasksByStatus);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unorderedTasks, taskStatuses]);

  useEffect(() => {
    if (!hasNextPage || !sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage && hasNextPage) {
          fetchNextPage();
        }
      },
      {
        root: containerRef.current,
        rootMargin: "200px",
      },
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isPending) return null;

  const onDragEnd: OnDragEndResponder = (result) => {
    const { destination, source } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    if (
      isOtherBucketReadOnly &&
      destination.droppableId === OTHER_TASK_STATUS_ID
    ) {
      return;
    }

    const sourceStatus = source.droppableId;
    const destinationStatus = destination.droppableId;
    const sourceTask = tasksByStatus[sourceStatus]?.[source.index];
    if (!sourceTask) {
      return;
    }

    const destinationTask = tasksByStatus[destinationStatus]?.[
      destination.index
    ] ?? {
      status: destinationStatus,
      index: undefined,
    };

    const previousTasksByStatus = tasksByStatus;

    // Optimistic update
    setTasksByStatus(
      updateTaskStatusLocal(
        sourceTask,
        { status: sourceStatus, index: source.index },
        { status: destinationStatus, index: destination.index },
        tasksByStatus,
      ),
    );

    const actualSourceStatus = sourceTask.status || sourceStatus;

    updateTaskStatus(
      { ...sourceTask, status: actualSourceStatus },
      { status: destinationStatus, index: destinationTask.index },
      dataProvider,
      source.index,
    )
      .then(() => {
        refetch();
      })
      .catch(() => {
        setTasksByStatus(previousTasksByStatus);
        notify(translate("crm.task.notification.move_failed"), {
          type: "error",
        });
      });
  };

  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
  import { useIsMobile } from "@/hooks/use-mobile";
  import { translateChoice } from "@/i18n/utils";

  // ... imports

  const handleToggleCollapse = (statusId: string) => {
    setCollapsedStatuses((prev) => ({
      ...prev,
      [statusId]: !prev[statusId],
    }));
  };

  const isMobile = useIsMobile();
  const [selectedMobileStatus, setSelectedMobileStatus] = useState<string>(
    kanbanStatuses?.[0]?.id || "todo"
  );

  useEffect(() => {
    if (kanbanStatuses?.length > 0 && !selectedMobileStatus) {
      setSelectedMobileStatus(kanbanStatuses[0].id);
    }
  }, [kanbanStatuses, selectedMobileStatus]);

  if (isMobile) {
    return (
      <div className="flex flex-col gap-4 h-[calc(100vh-200px)]">
        <Select value={selectedMobileStatus} onValueChange={setSelectedMobileStatus}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={translate("crm.task.field.status")} />
          </SelectTrigger>
          <SelectContent>
            {kanbanStatuses.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {translateChoice(translate, "crm.task.status", status.id, status.name)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 overflow-y-auto">
            {selectedMobileStatus && (
              <TaskColumn
                status={selectedMobileStatus}
                tasks={tasksByStatus[selectedMobileStatus] || []}
                isDropDisabled={
                  isOtherBucketReadOnly && selectedMobileStatus === OTHER_TASK_STATUS_ID
                }
                isCollapsed={false}
                onToggleCollapse={() => { }}
              />
            )}
          </div>
        </DragDropContext>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div
        ref={containerRef}
        className="flex flex-col gap-4 h-[calc(100vh-250px)] overflow-y-auto"
      >
        <div className="flex gap-3 flex-nowrap pb-4 w-full min-w-0">
          {kanbanStatuses.map((status) => (
            <TaskColumn
              status={status.id}
              tasks={tasksByStatus[status.id] || []}
              key={status.id}
              isDropDisabled={
                isOtherBucketReadOnly && status.id === OTHER_TASK_STATUS_ID
              }
              isCollapsed={collapsedStatuses[status.id]}
              onToggleCollapse={handleToggleCollapse}
            />
          ))}
        </div>
        <div ref={sentinelRef} className="h-px" aria-hidden="true" />
      </div>
    </DragDropContext>
  );
};

const updateTaskStatusLocal = (
  sourceTask: Task,
  source: { status: string; index: number },
  destination: {
    status: string;
    index?: number; // undefined if dropped after the last item
  },
  tasksByStatus: TasksByStatus,
) => {
  const sourceColumn = [...(tasksByStatus[source.status] ?? [])];
  const destinationColumn =
    source.status === destination.status
      ? sourceColumn
      : [...(tasksByStatus[destination.status] ?? [])];

  sourceColumn.splice(source.index, 1);
  destinationColumn.splice(
    destination.index ?? destinationColumn.length + 1,
    0,
    sourceTask,
  );

  if (source.status === destination.status) {
    return {
      ...tasksByStatus,
      [destination.status]: destinationColumn,
    };
  }

  return {
    ...tasksByStatus,
    [source.status]: sourceColumn,
    [destination.status]: destinationColumn,
  };
};

const updateTaskStatus = async (
  source: Task,
  destination: {
    status: string;
    index?: number; // undefined if dropped after the last item
  },
  dataProvider: DataProvider,
  sourcePosition: number,
) => {
  const sourceStatus = source.status || "todo";
  const sourceIndex =
    typeof source.index === "number" ? source.index : sourcePosition;

  const updateData: any = { status: destination.status };
  if (destination.status === "done" && sourceStatus !== "done") {
    updateData.done_date = new Date().toISOString();
  } else if (destination.status !== "done" && sourceStatus === "done") {
    updateData.done_date = null;
  }

  if (sourceStatus === destination.status) {
    // moving task inside the same column
    const { data: columnTasks } = await dataProvider.getList("tasks", {
      sort: { field: "index", order: "ASC" },
      pagination: { page: 1, perPage: TASKS_UPDATE_PAGE_SIZE },
      filter: { status: sourceStatus },
    });
    const destinationIndex = destination.index ?? columnTasks.length + 1;

    if (sourceIndex > destinationIndex) {
      // task moved up
      await Promise.all([
        ...columnTasks
          .filter(
            (task) =>
              task.index >= destinationIndex && task.index < sourceIndex,
          )
          .map((task) =>
            dataProvider.update("tasks", {
              id: task.id,
              data: { index: task.index + 1 },
              previousData: task,
            }),
          ),
        dataProvider.update("tasks", {
          id: source.id,
          data: { ...updateData, index: destinationIndex },
          previousData: source,
        }),
      ]);
    } else {
      // task moved down
      await Promise.all([
        ...columnTasks
          .filter(
            (task) =>
              task.index <= destinationIndex && task.index > sourceIndex,
          )
          .map((task) =>
            dataProvider.update("tasks", {
              id: task.id,
              data: { index: task.index - 1 },
              previousData: task,
            }),
          ),
        dataProvider.update("tasks", {
          id: source.id,
          data: { ...updateData, index: destinationIndex },
          previousData: source,
        }),
      ]);
    }
    return;
  }

  // moving task across columns
  const [{ data: sourceTasks }, { data: destinationTasks }] = await Promise.all(
    [
      dataProvider.getList("tasks", {
        sort: { field: "index", order: "ASC" },
        pagination: { page: 1, perPage: TASKS_UPDATE_PAGE_SIZE },
        filter: { status: sourceStatus },
      }),
      dataProvider.getList("tasks", {
        sort: { field: "index", order: "ASC" },
        pagination: { page: 1, perPage: TASKS_UPDATE_PAGE_SIZE },
        filter: { status: destination.status },
      }),
    ],
  );
  const destinationIndex = destination.index ?? destinationTasks.length + 1;

  await Promise.all([
    ...sourceTasks
      .filter((task) => task.index > sourceIndex)
      .map((task) =>
        dataProvider.update("tasks", {
          id: task.id,
          data: { index: task.index - 1 },
          previousData: task,
        }),
      ),
    ...destinationTasks
      .filter((task) => task.index >= destinationIndex)
      .map((task) =>
        dataProvider.update("tasks", {
          id: task.id,
          data: { index: task.index + 1 },
          previousData: task,
        }),
      ),
    dataProvider.update("tasks", {
      id: source.id,
      data: {
        ...updateData,
        index: destinationIndex,
      },
      previousData: source,
    }),
  ]);
};
