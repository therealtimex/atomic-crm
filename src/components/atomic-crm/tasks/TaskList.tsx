import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { FilterButton } from "@/components/admin/filter-form";
import { List, ListView } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";

import { useEffect, useMemo, useState } from "react";
import { InfiniteListBase, useGetIdentity } from "ra-core";
import { LayoutList, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { MyTasksInput } from "./MyTasksInput";
import { TaskListTable } from "./TaskListTable";
import { ActiveFilterBar } from "./ActiveFilterBar";
import { TaskKanbanView } from "./TaskKanbanView";

const TASKS_TABLE_PAGE_SIZE = 25;
const TASKS_KANBAN_PAGE_SIZE = 100;
const DEFAULT_VIEW = "table";

const TaskList = () => {
  const { taskStatuses, taskPriorities } = useConfigurationContext();
  const { identity } = useGetIdentity();
  const [view, setView] = useState<"table" | "kanban">(DEFAULT_VIEW);
  const [isViewHydrated, setIsViewHydrated] = useState(false);

  const viewStorageKey = useMemo(
    () => `realtimex_crm_tasks_view_${identity?.id ?? "anonymous"}`,
    [identity?.id],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsViewHydrated(false);
    const stored = window.localStorage.getItem(viewStorageKey);
    if (stored === "table" || stored === "kanban") {
      setView(stored);
    } else {
      setView(DEFAULT_VIEW);
    }
    setIsViewHydrated(true);
  }, [viewStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isViewHydrated) return;

    window.localStorage.setItem(viewStorageKey, view);
  }, [viewStorageKey, view, isViewHydrated]);

  const taskFilters = [
    <SearchInput source="q" alwaysOn />,
    <SelectInput source="status" choices={taskStatuses} alwaysOn />,
    <ReferenceInput source="contact_id" reference="contacts">
      <AutocompleteInput label={false} placeholder="Contact" />
    </ReferenceInput>,
    <ReferenceInput source="company_id" reference="companies">
      <AutocompleteInput label={false} placeholder="Company" optionText="name" />
    </ReferenceInput>,
    <ReferenceInput source="deal_id" reference="deals">
      <AutocompleteInput label={false} placeholder="Deal" optionText="name" />
    </ReferenceInput>,
    <SelectInput source="priority" choices={taskPriorities} />,
    <MyTasksInput source="assigned_to" label="My Tasks" alwaysOn />,
    <BooleanInput source="archived" label="Archived" />,
  ];

  if (view === "table") {
    return (
      <List
        perPage={TASKS_TABLE_PAGE_SIZE}
        sort={{ field: "due_date", order: "ASC" }}
        filters={taskFilters}
        filterDefaultValues={{ archived: false }}
        actions={<TaskActions view={view} setView={setView} />}
        title="Tasks"
      >
        <ActiveFilterBar />
        <TaskListTable />
      </List>
    );
  }

  return (
    <InfiniteListBase
      perPage={TASKS_KANBAN_PAGE_SIZE}
      sort={{ field: "index", order: "ASC" }}
      filterDefaultValues={{ archived: false }}
    >
      <ListView
        filters={taskFilters}
        actions={<TaskActions view={view} setView={setView} />}
        title="Tasks"
        pagination={null}
      >
        <ActiveFilterBar />
        <TaskKanbanView />
      </ListView>
    </InfiniteListBase>
  );
};

const TaskActions = ({
  view,
  setView
}: {
  view: "table" | "kanban";
  setView: (view: "table" | "kanban") => void;
}) => (
  <TopToolbar className="items-center">
    <div className="flex items-center bg-muted rounded-md p-1 mr-2">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-2 text-muted-foreground",
          view === "table" &&
            "bg-background text-foreground shadow-sm border border-border",
        )}
        aria-pressed={view === "table"}
        onClick={() => setView("table")}
      >
        <LayoutList className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 px-2 text-muted-foreground",
          view === "kanban" &&
            "bg-background text-foreground shadow-sm border border-border",
        )}
        aria-pressed={view === "kanban"}
        onClick={() => setView("kanban")}
      >
        <Kanban className="h-4 w-4 mr-2" />
        Kanban
      </Button>
    </div>
    <FilterButton />
    <ExportButton />
    <CreateButton label="New Task" />
  </TopToolbar>
);

export default TaskList;
