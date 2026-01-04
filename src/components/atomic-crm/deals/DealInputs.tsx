import { useEffect, useRef } from "react";
import { useWatch, useFormContext } from "react-hook-form";
import { required } from "ra-core";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { ReferenceArrayInput } from "@/components/admin/reference-array-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { TextInput } from "@/components/admin/text-input";
import { NumberInput } from "@/components/admin/number-input";
import { DateInput } from "@/components/admin/date-input";
import { SelectInput } from "@/components/admin/select-input";
import { useTranslate } from "ra-core";
import { translateChoice } from "@/i18n/utils";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";

import { contactOptionText } from "../misc/ContactOption";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { AutocompleteCompanyInput } from "../companies/AutocompleteCompanyInput.tsx";

export const DealInputs = () => {
  const isMobile = useIsMobile();
  return (
    <div className="flex flex-col gap-8">
      <DealInfoInputs />

      <div className={`flex gap-6 ${isMobile ? "flex-col" : "flex-row"}`}>
        <DealLinkedToInputs />
        <Separator orientation={isMobile ? "horizontal" : "vertical"} />
        <DealMiscInputs />
      </div>
    </div>
  );
};

const DealInfoInputs = () => {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <TextInput
        source="name"
        label="Deal name"
        validate={required()}
        helperText={false}
      />
      <TextInput source="description" multiline rows={3} helperText={false} />
    </div>
  );
};

const DealLinkedToInputs = () => {
  const company_id = useWatch({ name: "company_id" });
  const { setValue } = useFormContext();
  const previousCompanyId = useRef(company_id);

  // Clear selected contacts when company changes
  useEffect(() => {
    if (
      previousCompanyId.current !== undefined &&
      previousCompanyId.current !== company_id
    ) {
      setValue("contact_ids", []);
    }
    previousCompanyId.current = company_id;
  }, [company_id, setValue]);

  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Linked to</h3>
      <ReferenceInput source="company_id" reference="companies">
        <AutocompleteCompanyInput validate={required()} />
      </ReferenceInput>

      <ReferenceArrayInput
        source="contact_ids"
        reference="contacts_summary"
        filter={company_id ? { company_id } : undefined}
      >
        <AutocompleteArrayInput
          label="Contacts"
          optionText={contactOptionText}
          helperText={
            company_id
              ? false
              : "Please select a company first to see its contacts"
          }
        />
      </ReferenceArrayInput>
    </div>
  );
};

const DealMiscInputs = () => {
  const { dealStages, dealCategories } = useConfigurationContext();
  const translate = useTranslate();

  const translatedDealCategories = dealCategories.map((category) => ({
    id: category,
    name: translateChoice(
      translate,
      "crm.deal.category",
      category,
      category,
    ),
  }));

  const translatedDealStages = dealStages.map((stage) => ({
    id: stage.value,
    name: translateChoice(
      translate,
      "crm.deal.stage",
      stage.value,
      stage.label,
    ),
  }));
  return (
    <div className="flex flex-col gap-4 flex-1">
      <h3 className="text-base font-medium">Misc</h3>

      <SelectInput
        source="category"
        label="Category"
        choices={translatedDealCategories}
        helperText={false}
      />
      <NumberInput
        source="amount"
        defaultValue={0}
        helperText={false}
        validate={required()}
      />
      <DateInput
        validate={required()}
        source="expected_closing_date"
        helperText={false}
        defaultValue={new Date().toISOString().split("T")[0]}
      />
      <SelectInput
        source="stage"
        choices={translatedDealStages}
        defaultValue="opportunity"
        helperText={false}
        validate={required()}
      />
    </div>
  );
};
