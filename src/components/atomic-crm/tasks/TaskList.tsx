import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { BooleanInput } from "@/components/admin/boolean-input";
import { CreateButton } from "@/components/admin/create-button";
import { ExportButton } from "@/components/admin/export-button";
import { FilterButton } from "@/components/admin/filter-form";
import { List } from "@/components/admin/list";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";

import { useState } from "react";
import { LayoutList, Kanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { TopToolbar } from "../layout/TopToolbar";
import { MyTasksInput } from "./MyTasksInput";
import { TaskListTable } from "./TaskListTable";
import { ActiveFilterBar } from "./ActiveFilterBar";
import { TaskKanbanView } from "./TaskKanbanView";

const TaskList = () => {
  const { taskStatuses, taskPriorities } = useConfigurationContext();
  const [view, setView] = useState<"table" | "kanban">("table");

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

  return (
    <List
      perPage={view === "table" ? 25 : 100}
      sort={{ field: "due_date", order: "ASC" }}
      filters={taskFilters}
      filterDefaultValues={{ archived: false }}
      actions={<TaskActions view={view} setView={setView} />}
      title="Tasks"
    >
      <ActiveFilterBar />
      {view === "table" ? <TaskListTable /> : <TaskKanbanView />}
    </List>
  );
};

const TaskActions = ({
  view,
  setView
}: {
  view: "table" | "kanban";
  setView: (view: "table" | "kanban") => void;
}) => (
  <TopToolbar>
    <div className="flex items-center bg-muted rounded-md p-1 mr-2">
      <Button
        variant={view === "table" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
        onClick={() => setView("table")}
      >
        <LayoutList className="h-4 w-4 mr-2" />
        Table
      </Button>
      <Button
        variant={view === "kanban" ? "secondary" : "ghost"}
        size="sm"
        className="h-8 px-2"
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
