import { useTranslate } from "ra-core";
import { Card, CardContent } from "@/components/ui/card";

import type { Invoice } from "../types";

export const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const translate = useTranslate();

    return (
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div>
                        <h3 className="font-semibold text-lg">#{invoice.invoice_number}</h3>
                        {invoice.company_name && (
                            <p className="text-sm text-muted-foreground">{invoice.company_name}</p>
                        )}
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                </div>

                <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">
                            {translate("crm.invoice.field.total")}:
                        </span>
                        <span className="font-semibold">
                            {invoice.currency} {invoice.total.toFixed(2)}
                        </span>
                    </div>

                    {invoice.balance_due && invoice.balance_due > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>{translate("crm.invoice.field.balance_due")}:</span>
                            <span className="font-semibold">
                                {invoice.currency} {invoice.balance_due.toFixed(2)}
                            </span>
                        </div>
                    )}

                    <div className="flex justify-between text-xs text-muted-foreground pt-2">
                        <span>
                            {translate("crm.invoice.field.due_date")}:{" "}
                            {new Date(invoice.due_date).toLocaleDateString()}
                        </span>
                        {invoice.days_overdue && invoice.days_overdue > 0 && (
                            <span className="text-red-600 font-medium">
                                {invoice.days_overdue} {translate("crm.invoice.days_overdue")}
                            </span>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const InvoiceStatusBadge = ({ status }: { status: string }) => {
    const translate = useTranslate();

    const statusColors: Record<string, string> = {
        draft: "bg-gray-100 text-gray-800",
        sent: "bg-blue-100 text-blue-800",
        paid: "bg-green-100 text-green-800",
        overdue: "bg-red-100 text-red-800",
        cancelled: "bg-gray-100 text-gray-500",
    };

    return (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[status] || statusColors.draft
                }`}
        >
            {translate(`crm.invoice.status.${status}`)}
        </span>
    );
};
