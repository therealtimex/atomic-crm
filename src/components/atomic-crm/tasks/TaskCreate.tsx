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

import { FormToolbar } from "../layout/FormToolbar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { EntityTypePillSelector } from "./EntityTypePillSelector";
import { EntityAutocomplete } from "./EntityAutocomplete";
import { transformTaskEntityData } from "./taskEntityUtils";

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
            transform={(data) => ({
              ...transformTaskEntityData(data),
              sales_id: identity?.id,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })}
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
