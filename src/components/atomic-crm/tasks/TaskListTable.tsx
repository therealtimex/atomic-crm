import { useState } from "react";
import { useUpdate, useNotify, useCreate, useGetIdentity } from "ra-core";
import { Check, Pencil, Clock } from "lucide-react";
import { DataTable } from "@/components/admin/data-table";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRelativeDueDate } from "@/lib/date-utils";

import type { Task, TaskSummary } from "../types";
import { TaskPriorityBadge } from "./TaskPriorityBadge";
import { TaskStatusBadge } from "./TaskStatusBadge";
import { TaskEdit } from "./TaskEdit";
import { TaskTypeIcon } from "./TaskTypeIcon";

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

const TaskActions = ({ record }: { record: Task }) => {
  const [update] = useUpdate();
  const [create] = useCreate();
  const notify = useNotify();
  const { identity } = useGetIdentity();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Create a task note for audit trail
  const createTaskNote = (text: string) => {
    if (!identity?.id) return;

    create(
      "taskNotes",
      {
        data: {
          task_id: record.id,
          text,
          date: new Date().toISOString(),
          sales_id: identity.id,
          status: "cold",
        },
      },
      {
        onError: (error) => {
          console.error("Failed to create task note:", error);
        },
      }
    );
  };

  const handleMarkComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    update(
      "tasks",
      {
        id: record.id,
        data: {
          status: "done",
          done_date: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        previousData: record,
      },
      {
        onSuccess: () => {
          notify("Task marked as complete", { type: "success" });
          createTaskNote("Task marked as complete via quick action");
        },
      }
    );
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditDialogOpen(true);
  };

  const handleSnooze = (e: React.MouseEvent) => {
    e.stopPropagation();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dueDate = record.due_date ? new Date(record.due_date) : null;
    if (dueDate) {
      dueDate.setHours(0, 0, 0, 0);
    }

    const isOverdueOrDueToday = !dueDate || dueDate <= today;

    let newDueDate: Date;
    let noteText: string;
    let notificationText: string;

    if (isOverdueOrDueToday) {
      newDueDate = tomorrow;
      noteText = `Due date snoozed to ${tomorrow.toLocaleDateString()}`;
      notificationText = "Task snoozed to tomorrow";
    } else {
      newDueDate = new Date(dueDate);
      newDueDate.setDate(newDueDate.getDate() + 1);
      noteText = `Due date postponed by 1 day to ${newDueDate.toLocaleDateString()}`;
      notificationText = "Task postponed by 1 day";
    }

    update(
      "tasks",
      {
        id: record.id,
        data: {
          due_date: newDueDate.toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        },
        previousData: record,
      },
      {
        onSuccess: () => {
          notify(notificationText, { type: "success" });
          createTaskNote(noteText);
        },
      }
    );
  };

  const isCompleted = record.status === "done" || record.status === "cancelled";

  // Determine smart button label
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = record.due_date ? new Date(record.due_date) : null;
  if (dueDate) {
    dueDate.setHours(0, 0, 0, 0);
  }
  const isOverdueOrDueToday = !dueDate || dueDate <= today;
  const snoozeLabel = isOverdueOrDueToday ? "Snooze to tomorrow" : "Postpone by 1 day";

  return (
    <>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <TooltipProvider>
          {!isCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleMarkComplete}
                >
                  <Check className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Mark complete</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleEdit}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
          </Tooltip>
          {!isCompleted && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSnooze}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{snoozeLabel}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>
      </div>
      {editDialogOpen && (
        <TaskEdit
          taskId={record.id}
          open={editDialogOpen}
          close={() => setEditDialogOpen(false)}
        />
      )}
    </>
  );
};

export const TaskListTable = () => {
  const getRowClassName = (record: Task) => {
    const isCompleted = record.status === "done" || record.status === "cancelled";
    const { isOverdue } = getRelativeDueDate(record.due_date, isCompleted);

    // Add 'group' class for hover actions, plus overdue styling
    const baseClass = "group";
    if (isCompleted) return baseClass;
    return isOverdue ? `${baseClass} bg-destructive/10 hover:bg-destructive/20` : baseClass;
  };

  return (
    <DataTable rowClick="show" rowClassName={getRowClassName}>
      <DataTable.Col
        source="text"
        label="Task"
        className="w-[35%]"
        cellClassName="max-w-md overflow-hidden"
        render={(record: Task) => (
          <div className="flex items-start gap-2">
            <TaskTypeIcon taskType={record.type} />
            <div className="line-clamp-2 flex-1" title={record.text}>
              {record.text}
            </div>
          </div>
        )}
      />
      <DataTable.Col
        label="Related To"
        className="w-[16%]"
        cellClassName="overflow-hidden"
        sortable={false}
        render={(record: Task) => <RelatedEntityField record={record} />}
      />
      <DataTable.Col
        source="due_date"
        label="Due Date"
        className="w-[14%]"
        cellClassName="overflow-hidden"
        render={(record: Task) => <DueDateField record={record} />}
      />
      <DataTable.Col
        label="Priority"
        className="w-[8%]"
        render={(record: Task) => (
          <TaskPriorityBadge priority={record.priority} />
        )}
      />
      <DataTable.Col
        label="Status"
        className="w-[8%]"
        render={(record: Task) => <TaskStatusBadge status={record.status} />}
      />
      <DataTable.Col label="Assigned To" className="w-[8%]" cellClassName="truncate">
        <ReferenceField source="assigned_to" reference="sales" link={false} />
      </DataTable.Col>
      <DataTable.Col
        label="Actions"
        className="w-[11%]"
        sortable={false}
        cellClassName="text-right pr-2"
        render={(record: Task) => <TaskActions record={record} />}
      />
    </DataTable>
  );
};