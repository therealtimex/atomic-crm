import { Calendar, Building2, UserCircle, UserCheck, Pencil, Briefcase, Check, Clock } from "lucide-react";
import { useRecordContext, useUpdate, useCreate, useNotify, useGetIdentity } from "ra-core";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";

import { AsideSection } from "../misc/AsideSection";
import type { Task } from "../types";
import { TaskEdit } from "./TaskEdit";

export const TaskAside = () => {
  const record = useRecordContext<Task>();
  const [editOpen, setEditOpen] = useState(false);
  const [update] = useUpdate();
  const [create] = useCreate();
  const notify = useNotify();
  const { identity } = useGetIdentity();

  if (!record) return null;

  const isCompleted = record.status === "done" || record.status === "cancelled";

  // Create audit trail note
  const createTaskNote = (text: string) => {
    if (!identity?.id) return;

    create(
      "taskNotes",
      {
        data: {
          task_id: record.id,
          text,
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

  const handleMarkComplete = () => {
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
          createTaskNote("Task marked as complete");
        },
      }
    );
  };

  const handleSnooze = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let newDueDateString: string;
    let noteText: string;
    let notificationText: string;

    if (!record.due_date) {
      // No due date, set to tomorrow
      newDueDateString = tomorrow.toISOString().slice(0, 10);
      noteText = `Due date snoozed to ${tomorrow.toLocaleDateString()}`;
      notificationText = "Task snoozed to tomorrow";
    } else {
      // Parse the date safely (handles both YYYY-MM-DD and full ISO 8601)
      // We extract only the date part to avoid timezone shifts when parsing
      const datePart = record.due_date.split("T")[0];
      const [year, month, day] = datePart.split("-").map(Number);
      const dueDate = new Date(year, month - 1, day);

      const isOverdueOrDueToday = dueDate <= today;

      if (isOverdueOrDueToday) {
        newDueDateString = tomorrow.toISOString().slice(0, 10);
        noteText = `Due date snoozed to ${tomorrow.toLocaleDateString()}`;
        notificationText = "Task snoozed to tomorrow";
      } else {
        // Add 1 day to the due date
        const newDueDate = new Date(dueDate);
        newDueDate.setDate(newDueDate.getDate() + 1);
        newDueDateString = newDueDate.toISOString().slice(0, 10);
        noteText = `Due date postponed by 1 day to ${newDueDate.toLocaleDateString()}`;
        notificationText = "Task postponed by 1 day";
      }
    }

    update(
      "tasks",
      {
        id: record.id,
        data: {
          due_date: newDueDateString,
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

  // Determine smart button label
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let isOverdueOrDueToday = true;
  if (record.due_date) {
    const datePart = record.due_date.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    const labelDueDate = new Date(year, month - 1, day);
    isOverdueOrDueToday = labelDueDate <= today;
  }
  const snoozeLabel = isOverdueOrDueToday ? "Snooze to Tomorrow" : "Postpone by 1 Day";

  return (
    <div className="hidden sm:block w-64 min-w-64 text-sm">
      <div className="mb-4 -ml-1 flex flex-col gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEditOpen(true)}
          className="flex items-center gap-2"
        >
          <Pencil className="h-4 w-4" />
          Edit Task
        </Button>

        {!isCompleted && (
          <>
            <Button
              variant="default"
              size="sm"
              onClick={handleMarkComplete}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark Complete
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSnooze}
              className="flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              {snoozeLabel}
            </Button>
          </>
        )}
      </div>

      <TaskEdit
        open={editOpen}
        close={() => setEditOpen(false)}
        taskId={record.id}
      />

      <AsideSection title="Task Info">
        <InfoRow
          icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
          label="Due Date"
          value={<DateField source="due_date" />}
        />
        {record.done_date && (
          <InfoRow
            icon={<Calendar className="w-4 h-4 text-muted-foreground" />}
            label="Completed"
            value={<DateField source="done_date" />}
          />
        )}
      </AsideSection>

      <AsideSection title="Related">
        {record.contact_id && (
          <InfoRow
            icon={<UserCircle className="w-4 h-4 text-muted-foreground" />}
            label="Contact"
            value={
              <ReferenceField
                source="contact_id"
                reference="contacts"
                link="show"
              />
            }
          />
        )}
        {record.company_id && (
          <InfoRow
            icon={<Building2 className="w-4 h-4 text-muted-foreground" />}
            label="Company"
            value={
              <ReferenceField source="company_id" reference="companies" link="show">
                <TextField source="name" />
              </ReferenceField>
            }
          />
        )}
        {record.deal_id && (
          <InfoRow
            icon={<Briefcase className="w-4 h-4 text-muted-foreground" />}
            label="Deal"
            value={
              <ReferenceField source="deal_id" reference="deals" link="show">
                <TextField source="name" />
              </ReferenceField>
            }
          />
        )}
        {!record.contact_id && !record.company_id && !record.deal_id && (
          <p className="text-sm text-muted-foreground">No related entity</p>
        )}
      </AsideSection>

      <AsideSection title="Assignment">
        <InfoRow
          icon={<UserCheck className="w-4 h-4 text-muted-foreground" />}
          label="Assigned To"
          value={
            <ReferenceField source="assigned_to" reference="sales" link={false} />
          }
        />
        <InfoRow
          icon={<UserCircle className="w-4 h-4 text-muted-foreground" />}
          label="Created By"
          value={
            <ReferenceField source="sales_id" reference="sales" link={false} />
          }
        />
      </AsideSection>

      <div className="mt-6 pt-6 border-t hidden sm:flex flex-col gap-2 items-start">
        <DeleteButton
          className="h-6 cursor-pointer hover:bg-destructive/10! text-destructive! border-destructive! focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40"
          size="sm"
        />
      </div>
    </div>
  );
};

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
}) => (
  <div className="flex flex-col gap-1 mb-3">
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <div className="pl-6 text-sm">{value}</div>
  </div>
);
