import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { getRelativeDueDate } from "@/lib/date-utils";

import type { Task, TaskSummary } from "../types";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";

const RelatedEntityField = ({ record }: { record: Task | TaskSummary }) => {
  const getEntityName = () => {
    if (record.contact_id) {
      // For contacts, the ReferenceField will show first_name + last_name
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

  return <div className="truncate max-w-[200px]" title={record.contact_id ? "Contact" : record.company_id ? "Company" : record.deal_id ? "Deal" : ""}>{getEntityName()}</div>;
};

const DueDateField = ({ record }: { record: Task | TaskSummary }) => {
  const isCompleted = record.status === "done" || record.status === "cancelled";
  const { text, isOverdue } = getRelativeDueDate(record.due_date, isCompleted);

  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={
          isOverdue
            ? "text-destructive font-medium"
            : isCompleted
              ? "text-muted-foreground"
              : ""
        }
      >
        {text}
      </span>
      {record.due_date && !isCompleted && (
        <span className="text-xs text-muted-foreground">
          <DateField source="due_date" record={record} />
        </span>
      )}
    </div>
  );
};

export const TaskListTable = () => {
  const getRowClassName = (record: Task) => {
    const isCompleted = record.status === "done" || record.status === "cancelled";
    if (isCompleted) return undefined;

    const { isOverdue } = getRelativeDueDate(record.due_date, isCompleted);
    return isOverdue ? "bg-destructive/10 hover:bg-destructive/20" : undefined;
  };

  return (
    <DataTable rowClick="show" rowClassName={getRowClassName}>
      <DataTable.Col
        source="text"
        label="Task"
        className="w-[40%]"
        cellClassName="max-w-md overflow-hidden"
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
        className="w-[18%]"
        cellClassName="overflow-hidden"
        sortable={false}
        render={(record: Task) => <RelatedEntityField record={record} />}
      />
      <DataTable.Col
        source="due_date"
        label="Due Date"
        className="w-[15%]"
        cellClassName="overflow-hidden"
        render={(record: Task) => <DueDateField record={record} />}
      />
      <DataTable.Col
        label="Priority"
        className="w-[9%]"
        render={(record: Task) => (
          <TaskPriorityBadge priority={record.priority} />
        )}
      />
      <DataTable.Col
        label="Status"
        className="w-[9%]"
        render={(record: Task) => <TaskStatusBadge status={record.status} />}
      />
      <DataTable.Col label="Assigned To" className="w-[9%]" cellClassName="truncate">
        <ReferenceField source="assigned_to" reference="sales" link={false} />
      </DataTable.Col>
    </DataTable>
  );
};