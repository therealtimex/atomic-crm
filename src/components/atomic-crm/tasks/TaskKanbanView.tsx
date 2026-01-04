import { DragDropContext, type OnDragEndResponder } from "@hello-pangea/dnd";
import isEqual from "lodash/isEqual";
import { useDataProvider, useListContext } from "ra-core";
import { useEffect, useState } from "react";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Task } from "../types";
import { TaskColumn } from "./TaskColumn";
import type { TasksByStatus } from "./tasks";
import { getTasksByStatus } from "./tasks";

export const TaskKanbanView = () => {
    const { taskStatuses } = useConfigurationContext();
    const { data: unorderedTasks, isPending, refetch } = useListContext<Task>();
    const dataProvider = useDataProvider();

    const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus>(
        getTasksByStatus([], taskStatuses),
    );

    useEffect(() => {
        if (unorderedTasks) {
            const newTasksByStatus = getTasksByStatus(unorderedTasks, taskStatuses);
            if (!isEqual(newTasksByStatus, tasksByStatus)) {
                setTasksByStatus(newTasksByStatus);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unorderedTasks]);

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

        const sourceStatus = source.droppableId;
        const destinationStatus = destination.droppableId;
        const sourceTask = tasksByStatus[sourceStatus][source.index]!;

        // Optimistic update
        setTasksByStatus(prev => {
            const newTasksByStatus = { ...prev };
            const sourceColumn = [...newTasksByStatus[sourceStatus]];
            const destinationColumn = sourceStatus === destinationStatus
                ? sourceColumn
                : [...newTasksByStatus[destinationStatus]];

            sourceColumn.splice(source.index, 1);
            destinationColumn.splice(destination.index, 0, {
                ...sourceTask,
                status: destinationStatus as any
            });

            newTasksByStatus[sourceStatus] = sourceColumn;
            if (sourceStatus !== destinationStatus) {
                newTasksByStatus[destinationStatus] = destinationColumn;
            }

            return newTasksByStatus;
        });

        // persist the changes
        const updateData: any = { status: destinationStatus };
        if (destinationStatus === "done" && sourceStatus !== "done") {
            updateData.done_date = new Date().toISOString();
        } else if (destinationStatus !== "done" && sourceStatus === "done") {
            updateData.done_date = null;
        }
        updateData.updated_at = new Date().toISOString();

        dataProvider.update("tasks", {
            id: sourceTask.id,
            data: updateData,
            previousData: sourceTask,
        }).then(() => {
            refetch();
        });
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-250px)]">
                {taskStatuses.map((status) => (
                    <TaskColumn
                        status={status.id}
                        tasks={tasksByStatus[status.id] || []}
                        key={status.id}
                    />
                ))}
            </div>
        </DragDropContext>
    );
};
