import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";

import type { Task, TaskSummary } from "../types";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";

const RelatedEntityField = ({ record }: { record: Task | TaskSummary }) => {
  if (record.contact_id) {
    return (
      <ReferenceField
        record={record}
        source="contact_id"
        reference="contacts"
        link="show"
      />
    );
  }

  if (record.company_id) {
    return (
      <ReferenceField
        record={record}
        source="company_id"
        reference="companies"
        link="show"
      >
        <TextField source="name" />
      </ReferenceField>
    );
  }

  if (record.deal_id) {
    return (
      <ReferenceField
        record={record}
        source="deal_id"
        reference="deals"
        link="show"
      >
        <TextField source="name" />
      </ReferenceField>
    );
  }

  return <span className="text-muted-foreground">—</span>;
};

export const TaskListTable = () => {
  return (
    <DataTable rowClick="show">
      <DataTable.Col
        source="text"
        label="Task"
        className="w-[35%]"
        cellClassName="max-w-md"
        render={(record: Task) => (
          <div className="line-clamp-2" title={record.text}>
            {record.type && record.type !== "None" && (
              <span className="font-semibold">{record.type}: </span>
            )}
            {record.text}
          </div>
        )}
      />
      <DataTable.Col
        label="Related To"
        className="w-[20%]"
        sortable={false}
        render={(record: Task) => <RelatedEntityField record={record} />}
      />
      <DataTable.Col label="Due Date" className="w-[12%]">
        <DateField source="due_date" />
      </DataTable.Col>
      <DataTable.Col
        label="Priority"
        className="w-[10%]"
        render={(record: Task) => (
          <TaskPriorityBadge priority={record.priority} />
        )}
      />
      <DataTable.Col
        label="Status"
        className="w-[10%]"
        render={(record: Task) => <TaskStatusBadge status={record.status} />}
      />
      <DataTable.Col label="Assigned To" className="w-[13%]">
        <ReferenceField source="assigned_to" reference="sales" link={false} />
      </DataTable.Col>
    </DataTable>
  );
};