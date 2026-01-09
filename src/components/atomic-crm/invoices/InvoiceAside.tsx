import { useNotify, useRefresh, useShowContext, useTranslate, useUpdate } from "ra-core";
import { Check, Printer, Send, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
                <CardContent className="space-y-2 flex flex-col pt-2">
                    <EditButton />
                    {record.status === 'draft' && (
                        <ActionButton
                            label="resources.invoices.action.mark_as_sent"
                            status="sent"
                            icon={<Send className="w-4 h-4 mr-2" />}
                            record={record}
                        />
                    )}
                    {(record.status === 'draft' || record.status === 'sent' || record.status === 'overdue') && (
                        <ActionButton
                            label="resources.invoices.action.mark_as_paid"
                            status="paid"
                            icon={<Check className="w-4 h-4 mr-2" />}
                            record={record}
                        />
                    )}
                    {record.status !== 'cancelled' && record.status !== 'paid' && (
                        <ActionButton
                            label="resources.invoices.action.mark_as_cancelled"
                            status="cancelled"
                            variant="outline"
                            icon={<XCircle className="w-4 h-4 mr-2" />}
                            record={record}
                        />
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.print()}
                        className="w-full justify-start"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        {translate("resources.invoices.action.print")}
                    </Button>
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

const ActionButton = ({
    label,
    status,
    icon,
    record,
    variant = "default"
}: {
    label: string,
    status: Invoice['status'],
    icon: React.ReactNode,
    record: Invoice,
    variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
}) => {
    const translate = useTranslate();
    const notify = useNotify();
    const refresh = useRefresh();
    const [update, { isPending }] = useUpdate(
        'invoices',
        { id: record.id, data: { status, ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}), ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}) } },
        {
            onSuccess: () => {
                notify('resources.invoices.notification.status_updated', { type: 'info', messageArgs: { status: translate(`resources.invoices.status.${status}`) } });
                refresh();
            },
            onError: (error: any) => notify(error.message, { type: 'warning' }),
        }
    );

    return (
        <Button
            variant={variant}
            size="sm"
            onClick={() => update()}
            disabled={isPending}
            className="w-full justify-start"
        >
            {icon}
            {translate(label)}
        </Button>
    );
};
