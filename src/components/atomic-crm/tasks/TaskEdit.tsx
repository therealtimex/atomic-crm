import { EditBase, Form, required, useNotify, useRecordContext, type Identifier } from "ra-core";
import { DeleteButton } from "@/components/admin/delete-button";
import { TextInput } from "@/components/admin/text-input";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SaveButton } from "@/components/admin/form";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWatch, useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { useConfigurationContext } from "../root/ConfigurationContext";
import { contactOptionText } from "../misc/ContactOption";
import type { Task } from "../types";

const ENTITY_TYPES = [
  { value: "none", label: "None" },
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
] as const;

const getEntityType = (record: Task | undefined) => {
  if (!record) return "none";
  if (record.contact_id) return "contact";
  if (record.company_id) return "company";
  if (record.deal_id) return "deal";
  return "none";
};

const EntityTypePillSelector = () => {
  const record = useRecordContext<Task>();
  const entityType = useWatch({ name: "entity_type" });
  const { setValue } = useFormContext();

  // Initialize entity_type based on existing record
  useEffect(() => {
    if (record) {
      const initialEntityType = getEntityType(record);
      setValue("entity_type", initialEntityType);
    }
  }, [record, setValue]);

  return (
    <div className="col-span-2 flex items-center gap-3">
      <Label className="text-sm font-medium shrink-0">Related To</Label>
      <div className="flex gap-2 flex-wrap">
        {ENTITY_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setValue("entity_type", type.value)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-full border transition-colors",
              entityType === type.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-accent border-input"
            )}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
};

const EntityAutocomplete = () => {
  const entityType = useWatch({ name: "entity_type" });

  if (entityType === "contact") {
    return (
      <ReferenceInput source="contact_id" reference="contacts_summary">
        <AutocompleteInput
          label="Contact"
          optionText={contactOptionText}
          helperText={false}
        />
      </ReferenceInput>
    );
  }

  if (entityType === "company") {
    return (
      <ReferenceInput source="company_id" reference="companies">
        <AutocompleteInput label="Company" optionText="name" helperText={false} />
      </ReferenceInput>
    );
  }

  if (entityType === "deal") {
    return (
      <ReferenceInput source="deal_id" reference="deals">
        <AutocompleteInput label="Deal" optionText="name" helperText={false} />
      </ReferenceInput>
    );
  }

  return null;
};

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
          transform={(data) => {
            const { entity_type, contact_id, company_id, deal_id, ...rest } = data;

            // Only include the selected entity ID based on entity_type
            const entityData: any = {};
            if (entity_type === "contact" && contact_id) {
              entityData.contact_id = contact_id;
              entityData.company_id = null;
              entityData.deal_id = null;
            } else if (entity_type === "company" && company_id) {
              entityData.contact_id = null;
              entityData.company_id = company_id;
              entityData.deal_id = null;
            } else if (entity_type === "deal" && deal_id) {
              entityData.contact_id = null;
              entityData.company_id = null;
              entityData.deal_id = deal_id;
            } else {
              // entity_type === "none"
              entityData.contact_id = null;
              entityData.company_id = null;
              entityData.deal_id = null;
            }

            return {
              ...rest,
              ...entityData,
              updated_at: new Date().toISOString(),
            };
          }}
        >
          <DialogContent className="lg:max-w-xl overflow-y-auto max-h-9/10 top-1/20 translate-y-0">
            <Form className="flex flex-col gap-4">
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
                <EntityAutocomplete />
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
                      close();
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
        </EditBase>
      )}
    </Dialog>
  );
};
