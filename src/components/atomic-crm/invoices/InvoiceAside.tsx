import { useShowContext, useTranslate } from "ra-core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/admin/date-field";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { EditButton } from "@/components/admin/edit-button";

import type { Invoice } from "../types";

export const InvoiceAside = () => {
    const { record, isPending } = useShowContext<Invoice>();
    const translate = useTranslate();

    if (isPending || !record) return null;

    return (
        <div className="w-80 space-y-4">
            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {translate("resources.invoices.section.actions")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    <EditButton />
                </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">
                        {translate("resources.invoices.section.details")}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            {translate("resources.invoices.fields.invoice_number")}
                        </p>
                        <p className="text-sm font-medium">{record.invoice_number}</p>
                    </div>

                    {record.reference && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">
                                {translate("resources.invoices.fields.reference")}
                            </p>
                            <p className="text-sm font-medium">{record.reference}</p>
                        </div>
                    )}

                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            {translate("resources.invoices.fields.currency")}
                        </p>
                        <p className="text-sm font-medium">{record.currency}</p>
                    </div>

                    <div>
                        <p className="text-xs text-muted-foreground mb-1">
                            {translate("resources.invoices.fields.created_at")}
                        </p>
                        <p className="text-sm">
                            <DateField source="created_at" showTime />
                        </p>
                    </div>

                    {record.sent_at && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">
                                {translate("resources.invoices.fields.sent_at")}
                            </p>
                            <p className="text-sm">
                                <DateField source="sent_at" showTime />
                            </p>
                        </div>
                    )}

                    {record.viewed_at && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">
                                {translate("resources.invoices.fields.viewed_at")}
                            </p>
                            <p className="text-sm">
                                <DateField source="viewed_at" showTime />
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assigned To */}
            {record.sales_id && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">
                            {translate("resources.invoices.section.assigned_to")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ReferenceField source="sales_id" reference="sales" link={false}>
                            <div className="flex items-center gap-2">
                                <div className="text-sm">
                                    <TextField source="first_name" /> <TextField source="last_name" />
                                </div>
                            </div>
                        </ReferenceField>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
