import { useTranslate, useGetIdentity, required } from "ra-core";
import { useWatch, useFormContext } from "react-hook-form";
import { useEffect } from "react";
import { TextInput } from "@/components/admin/text-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";

import { InvoiceItemsInput } from "./InvoiceItemsInput";

export const InvoiceInputs = () => {
    const translate = useTranslate();
    const { identity } = useGetIdentity();
    const { setValue } = useFormContext();
    const company_id = useWatch({ name: "company_id" });

    // Clear dependent fields when company changes (optional but good UX)
    // We need a ref to track previous company_id if we want to avoid initial clear
    // But for now, let's just let the user re-select if they change company.
    useEffect(() => {
        if (company_id === null || company_id === undefined) return;
        // Logic to clear contact/deal if they don't belong to new company?
        // Ideally we check if current contact.company_id == new company_id
        // But simpler to just rely on the filter.
    }, [company_id]);

    const currencyChoices = [
        { id: "USD", name: "USD - US Dollar" },
        { id: "EUR", name: "EUR - Euro" },
        { id: "GBP", name: "GBP - British Pound" },
        { id: "CAD", name: "CAD - Canadian Dollar" },
        { id: "JPY", name: "JPY - Japanese Yen" },
        { id: "KRW", name: "KRW - Korean Won" },
        { id: "AUD", name: "AUD - Australian Dollar" },
        { id: "CHF", name: "CHF - Swiss Franc" },
    ];

    const statusChoices = [
        { id: "draft", name: translate("crm.invoice.status.draft") },
        { id: "sent", name: translate("crm.invoice.status.sent") },
        { id: "paid", name: translate("crm.invoice.status.paid") },
        { id: "overdue", name: translate("crm.invoice.status.overdue") },
        { id: "cancelled", name: translate("crm.invoice.status.cancelled") },
    ];

    return (
        <div className="space-y-6">
            {/* Invoice Number and Reference */}
            <div className="grid grid-cols-2 gap-4">
                <TextInput
                    source="invoice_number"
                    label="crm.invoice.field.invoice_number"
                    validate={required()}
                    helperText="crm.invoice.helper.invoice_number"
                />
                <TextInput
                    source="reference"
                    label="crm.invoice.field.reference"
                    helperText="crm.invoice.helper.reference"
                />
            </div>

            {/* Entity References */}
            {/* Entity References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <ReferenceInput source="company_id" reference="companies">
                        <AutocompleteInput
                            label="crm.invoice.field.company"
                            optionText="name"
                        />
                    </ReferenceInput>
                </div>

                <ReferenceInput
                    source="contact_id"
                    reference="contacts"
                    filter={company_id ? { company_id } : undefined}
                >
                    <AutocompleteInput
                        label="crm.invoice.field.contact"
                        optionText={(record) =>
                            record ? `${record.first_name} ${record.last_name}` : ""
                        }
                        helperText={!company_id ? translate("crm.invoice.helper.select_company_for_contacts") : false}
                    />
                </ReferenceInput>

                <ReferenceInput
                    source="deal_id"
                    reference="deals"
                    filter={company_id ? { company_id } : undefined}
                >
                    <AutocompleteInput
                        label="crm.invoice.field.deal"
                        optionText="name"
                        helperText={!company_id ? translate("crm.invoice.helper.select_company_for_deals") : false}
                    />
                </ReferenceInput>
            </div>

            {/* Status and Currency */}
            <div className="grid grid-cols-2 gap-4">
                <SelectInput
                    source="status"
                    label="crm.invoice.field.status"
                    choices={statusChoices}
                    defaultValue="draft"
                    validate={required()}
                />
                <SelectInput
                    source="currency"
                    label="crm.invoice.field.currency"
                    choices={currencyChoices}
                    defaultValue="USD"
                    validate={required()}
                />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
                <DateInput
                    source="issue_date"
                    label="crm.invoice.field.issue_date"
                    validate={required()}
                    defaultValue={new Date().toISOString().split("T")[0]}
                />
                <DateInput
                    source="due_date"
                    label="crm.invoice.field.due_date"
                    validate={required()}
                    defaultValue={
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0]
                    }
                />
                <DateInput
                    source="paid_at"
                    label="crm.invoice.field.paid_at"
                />
            </div>

            {/* Line Items */}
            <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">
                    {translate("crm.invoice.section.items")}
                </h3>
                <InvoiceItemsInput />
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 gap-4">
                <TextInput
                    source="notes"
                    label="crm.invoice.field.notes"
                    multiline
                    rows={3}
                />
                <TextInput
                    source="payment_terms"
                    label="crm.invoice.field.payment_terms"
                    multiline
                    rows={2}
                    helperText="crm.invoice.helper.payment_terms"
                />
                <TextInput
                    source="terms_and_conditions"
                    label="crm.invoice.field.terms_and_conditions"
                    multiline
                    rows={3}
                />
            </div>

            {/* Hidden field for sales_id */}
            <input type="hidden" name="sales_id" value={identity?.id || ""} />
        </div>
    );
};
