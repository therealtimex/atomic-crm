import { useTranslate, useGetIdentity, required } from "ra-core";
import { useWatch, useFormContext } from "react-hook-form";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { TextInput } from "@/components/admin/text-input";
import { DateInput } from "@/components/admin/date-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { SelectInput } from "@/components/admin/select-input";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

import { InvoiceItemsInput } from "./InvoiceItemsInput";

export const InvoiceInputs = () => {
    const translate = useTranslate();
    const { identity } = useGetIdentity();
    const { setValue } = useFormContext();
    const location = useLocation();
    const company_id = useWatch({ name: "company_id" });

    // Pre-fill from router state (e.g. when coming from CompanyShow)
    useEffect(() => {
        const state = location.state as { record?: any };
        if (state?.record) {
            const { company_id, contact_id, deal_id } = state.record;
            if (company_id) setValue("company_id", company_id);
            if (contact_id) setValue("contact_id", contact_id);
            if (deal_id) setValue("deal_id", deal_id);
        }
    }, [location.state, setValue]);

    // Clear dependent fields when company changes (optional but good UX)
    // We need a ref to track previous company_id if we want to avoid initial clear
    // But for now, let's just let the user re-select if they change company.
    useEffect(() => {
        if (company_id === null || company_id === undefined) return;
        // Logic to clear contact/deal if they don't belong to new company?
        // Ideally we check if current contact.company_id == new company_id
        // But simpler to just rely on the filter.
    }, [company_id]);

    const suggestInvoiceNumber = () => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 9000) + 1000;
        setValue("invoice_number", `INV-${year}-${random}`);
    };

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
        { id: "draft", name: translate("resources.invoices.status.draft") },
        { id: "sent", name: translate("resources.invoices.status.sent") },
        { id: "paid", name: translate("resources.invoices.status.paid") },
        { id: "overdue", name: translate("resources.invoices.status.overdue") },
        { id: "cancelled", name: translate("resources.invoices.status.cancelled") },
    ];

    return (
        <div className="space-y-6">
            {/* Invoice Number and Reference */}
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end gap-2">
                    <div className="flex-1">
                        <TextInput
                            source="invoice_number"
                            label="resources.invoices.fields.invoice_number"
                            validate={required()}
                            helperText="resources.invoices.helper.invoice_number"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={suggestInvoiceNumber}
                        className="mb-6 h-10 w-10 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        title={translate("resources.invoices.action.suggest_number") || "Suggest number"}
                    >
                        <Sparkles className="h-4 w-4" />
                    </Button>
                </div>
                <TextInput
                    source="reference"
                    label="resources.invoices.fields.reference"
                    helperText="resources.invoices.helper.reference"
                />
            </div>

            {/* Entity References */}
            {/* Entity References */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                    <ReferenceInput source="company_id" reference="companies">
                        <AutocompleteInput
                            label="resources.invoices.fields.company_id"
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
                        label="resources.invoices.fields.contact_id"
                        optionText={(record) =>
                            record ? `${record.first_name} ${record.last_name}` : ""
                        }
                        helperText={!company_id ? translate("resources.invoices.helper.select_company_for_contacts") : false}
                    />
                </ReferenceInput>

                <ReferenceInput
                    source="deal_id"
                    reference="deals"
                    filter={company_id ? { company_id } : undefined}
                >
                    <AutocompleteInput
                        label="resources.invoices.fields.deal_id"
                        optionText="name"
                        helperText={!company_id ? translate("resources.invoices.helper.select_company_for_deals") : false}
                    />
                </ReferenceInput>
            </div>

            {/* Status and Currency */}
            <div className="grid grid-cols-2 gap-4">
                <SelectInput
                    source="status"
                    label="resources.invoices.fields.status"
                    choices={statusChoices}
                    defaultValue="draft"
                    validate={required()}
                />
                <SelectInput
                    source="currency"
                    label="resources.invoices.fields.currency"
                    choices={currencyChoices}
                    defaultValue="USD"
                    validate={required()}
                />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-3 gap-4">
                <DateInput
                    source="issue_date"
                    label="resources.invoices.fields.issue_date"
                    validate={required()}
                    defaultValue={new Date().toISOString().split("T")[0]}
                />
                <DateInput
                    source="due_date"
                    label="resources.invoices.fields.due_date"
                    validate={required()}
                    defaultValue={
                        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            .toISOString()
                            .split("T")[0]
                    }
                />
                <DateInput
                    source="paid_at"
                    label="resources.invoices.fields.paid_at"
                />
            </div>

            {/* Line Items */}
            <div className="border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">
                    {translate("resources.invoices.section.items")}
                </h3>
                <InvoiceItemsInput />
            </div>

            {/* Notes and Terms */}
            <div className="grid grid-cols-1 gap-4">
                <TextInput
                    source="notes"
                    label="resources.invoices.fields.notes"
                    multiline
                    rows={3}
                />
                <TextInput
                    source="payment_terms"
                    label="resources.invoices.fields.payment_terms"
                    multiline
                    rows={2}
                    helperText="resources.invoices.helper.payment_terms"
                />
                <TextInput
                    source="terms_and_conditions"
                    label="resources.invoices.fields.terms_and_conditions"
                    multiline
                    rows={3}
                />
            </div>

            {/* Hidden field for sales_id */}
            <input type="hidden" name="sales_id" value={identity?.id || ""} />
        </div>
    );
};
