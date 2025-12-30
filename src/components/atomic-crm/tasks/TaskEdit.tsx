import { EditBase, Form, required, useNotify, useRecordContext, type Identifier } from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { TextInput } from "@/components/admin/text-input";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SaveButton } from "@/components/admin/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useConfigurationContext } from "../root/ConfigurationContext";
import type { Task } from "../types";
import { EntityTypePillSelector } from "./EntityTypePillSelector";
import { EntityAutocomplete } from "./EntityAutocomplete";
import { getEntityType, transformTaskEntityData } from "./taskEntityUtils";

export const TaskEdit = ({
  open,
  close,
  taskId,
}: {
  taskId: Identifier;
  open: boolean;
  close: () => void;
}) => {
  const { taskTypes, taskPriorities, taskStatuses } = useConfigurationContext();
  const notify = useNotify();
  return (
    <Dialog open={open} onOpenChange={close}>
      {taskId && (
        <EditBase
          id={taskId}
          resource="tasks"
          className="mt-0"
          mutationOptions={{
            onSuccess: () => {
              close();
              notify("Task updated", {
                type: "info",
                undoable: true,
              });
            },
          }}
          redirect={false}
          transform={(data) => ({
            ...transformTaskEntityData(data),
            updated_at: new Date().toISOString(),
          })}
        >
          <TaskEditForm
            taskTypes={taskTypes}
            taskPriorities={taskPriorities}
            taskStatuses={taskStatuses}
            onClose={close}
          />
        </EditBase>
      )}
    </Dialog>
  );
};

const TaskEditForm = ({
  taskTypes,
  taskPriorities,
  taskStatuses,
  onClose,
}: {
  taskTypes: string[];
  taskPriorities: { id: string; name: string }[];
  taskStatuses: { id: string; name: string }[];
  onClose: () => void;
}) => {
  const record = useRecordContext<Task>();
  const notify = useNotify();

  return (
    <DialogContent className="lg:max-w-xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
      <Form
        className="flex flex-col gap-4"
        defaultValues={{
          entity_type: record ? getEntityType(record) : "none",
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>
        <TextInput
          autoFocus
          source="text"
          label="Description"
          validate={required()}
          multiline
          helperText={false}
        />

        {/* Pill selector in grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <EntityTypePillSelector />
        </div>

        {/* Entity autocomplete on separate full-width row */}
        <div className="mt-4">
          <EntityAutocomplete helperText={false} />
        </div>

        {/* Rest of form fields in grid */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <DateInput
            source="due_date"
            helperText={false}
            validate={required()}
          />
          <SelectInput
            source="type"
            choices={taskTypes.map((type) => ({
              id: type,
              name: type,
            }))}
            helperText={false}
            validate={required()}
          />
          <SelectInput
            source="priority"
            choices={taskPriorities}
            helperText={false}
          />
          <SelectInput
            source="status"
            choices={taskStatuses}
            helperText={false}
          />
          <ReferenceInput source="assigned_to" reference="sales">
            <SelectInput
              optionText={(record) =>
                `${record.first_name} ${record.last_name}`
              }
              label="Assigned To"
              helperText={false}
            />
          </ReferenceInput>
        </div>
        <DialogFooter className="w-full sm:justify-between gap-4">
          <DeleteButton
            mutationOptions={{
              onSuccess: () => {
                onClose();
                notify("Task deleted", {
                  type: "info",
                  undoable: true,
                });
              },
            }}
            redirect={false}
          />
          <SaveButton label="Save" />
        </DialogFooter>
      </Form>
    </DialogContent>
  );
};
