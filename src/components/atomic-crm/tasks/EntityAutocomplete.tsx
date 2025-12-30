import { useWatch } from "react-hook-form";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { contactOptionText } from "../misc/ContactOption";

interface EntityAutocompleteProps {
  helperText?: boolean;
  validate?: any;
}

export const EntityAutocomplete = ({
  helperText = false,
  validate
}: EntityAutocompleteProps) => {
  const entityType = useWatch({ name: "entity_type" });

  if (entityType === "contact") {
    return (
      <ReferenceInput source="contact_id" reference="contacts_summary">
        <AutocompleteInput
          label="Contact"
          optionText={contactOptionText}
          helperText={helperText}
          validate={validate}
        />
      </ReferenceInput>
    );
  }

  if (entityType === "company") {
    return (
      <ReferenceInput source="company_id" reference="companies">
        <AutocompleteInput
          label="Company"
          optionText="name"
          helperText={helperText}
          validate={validate}
        />
      </ReferenceInput>
    );
  }

  if (entityType === "deal") {
    return (
      <ReferenceInput source="deal_id" reference="deals">
        <AutocompleteInput
          label="Deal"
          optionText="name"
          helperText={helperText}
          validate={validate}
        />
      </ReferenceInput>
    );
  }

  return null;
};
