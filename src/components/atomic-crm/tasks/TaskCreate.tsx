import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { SelectInput } from "@/components/admin/select-input";
import { TextInput } from "@/components/admin/text-input";
import { Card, CardContent } from "@/components/ui/card";
import { Create } from "@/components/admin/create";
import {
  Form,
  required,
  useGetIdentity,
  useNotify,
  useRedirect,
} from "ra-core";
import { useWatch, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import { FormToolbar } from "../layout/FormToolbar";
import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";

const ENTITY_TYPES = [
  { value: "none", label: "None" },
  { value: "contact", label: "Contact" },
  { value: "company", label: "Company" },
  { value: "deal", label: "Deal" },
] as const;

const EntityTypePillSelector = () => {
  const entityType = useWatch({ name: "entity_type" });
  const { setValue } = useFormContext();

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
        <AutocompleteInput label="Contact" optionText={contactOptionText} />
      </ReferenceInput>
    );
  }

  if (entityType === "company") {
    return (
      <ReferenceInput source="company_id" reference="companies">
        <AutocompleteInput label="Company" optionText="name" />
      </ReferenceInput>
    );
  }

  if (entityType === "deal") {
    return (
      <ReferenceInput source="deal_id" reference="deals">
        <AutocompleteInput label="Deal" optionText="name" />
      </ReferenceInput>
    );
  }

  return null;
};

export const TaskCreate = () => {
  const { identity } = useGetIdentity();
  const { taskTypes, taskPriorities, taskStatuses } = useConfigurationContext();
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSuccess = () => {
    notify("Task created");
    redirect("list", "tasks");
  };

  return (
    <div className="mt-4 max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <Create
            resource="tasks"
            redirect="list"
            mutationOptions={{ onSuccess: handleSuccess }}
            transform={(data) => {
              const { entity_type, contact_id, company_id, deal_id, ...rest } = data;

              // Only include the selected entity ID based on entity_type
              const entityData: any = {};
              if (entity_type === "contact" && contact_id) {
                entityData.contact_id = contact_id;
              } else if (entity_type === "company" && company_id) {
                entityData.company_id = company_id;
              } else if (entity_type === "deal" && deal_id) {
                entityData.deal_id = deal_id;
              }

              return {
                ...rest,
                ...entityData,
                sales_id: identity?.id,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              };
            }}
          >
            <Form
              defaultValues={{
                due_date: new Date().toISOString().slice(0, 10),
                priority: "medium",
                status: "todo",
                assigned_to: identity?.id,
                entity_type: "none",
              }}
            >
              <TextInput
                autoFocus
                source="text"
                label="Description"
                validate={required()}
                multiline
                className="w-full"
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
                  validate={required()}
                />
                <SelectInput
                  source="type"
                  validate={required()}
                  choices={taskTypes.map((type) => ({
                    id: type,
                    name: type,
                  }))}
                />
                <SelectInput
                  source="priority"
                  choices={taskPriorities}
                />
                <SelectInput
                  source="status"
                  choices={taskStatuses}
                />
                <ReferenceInput source="assigned_to" reference="sales">
                  <SelectInput
                    optionText={(record) =>
                      `${record.first_name} ${record.last_name}`
                    }
                    label="Assigned To"
                  />
                </ReferenceInput>
              </div>
              <FormToolbar />
            </Form>
          </Create>
        </CardContent>
      </Card>
    </div>
  );
};
