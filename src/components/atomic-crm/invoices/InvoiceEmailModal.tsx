import { useState, useEffect } from "react";
import { useTranslate, useNotify, useDataProvider } from "ra-core";
import { Mail, Send, Loader2, FileText } from "lucide-react";
import { supabase } from "../providers/supabase/supabase";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Invoice } from "../types";
import { generateInvoiceEmailHTML } from "./generateInvoiceEmail";
import { generateInvoicePDFBase64 } from "./generateInvoicePDF";

interface InvoiceEmailModalProps {
    record: Invoice;
    trigger?: React.ReactNode;
}

export const InvoiceEmailModal = ({ record, trigger }: InvoiceEmailModalProps) => {
    const translate = useTranslate();
    const notify = useNotify();
    const dataProvider = useDataProvider();
    const [isOpen, setIsOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [body, setBody] = useState("");
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Pre-fill subject
            setSubject(`Invoice #${record.invoice_number}`);

            const defaultBody = `Please find attached your invoice #${record.invoice_number}.\n\n` +
                `Amount Due: ${record.currency} ${record.total.toFixed(2)}\n` +
                `Due Date: ${new Date(record.due_date).toLocaleDateString()}\n\n` +
                `Thank you for your business!`;

            setBody(defaultBody);

            // Fetch contact email if available
            if (record.contact_id) {
                dataProvider.getOne("contacts", { id: record.contact_id })
                    .then(({ data }) => {
                        if (data?.email) {
                            setRecipientEmail(data.email);
                        }
                    })
                    .catch(() => {
                        // Ignore error
                    });
            }
        }
    }, [isOpen, record, dataProvider]);

    const handleSend = async () => {
        if (!recipientEmail) {
            notify("Email address is required", { type: "warning" });
            return;
        }

        setIsSending(true);
        try {
            // Fetch all necessary data for the email template
            const [businessProfileRes, companyRes, contactRes, itemsRes] = await Promise.all([
                dataProvider.getOne("business_profile", { id: 1 }).catch(() => ({ data: null })),
                record.company_id ? dataProvider.getOne("companies", { id: record.company_id }).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
                record.contact_id ? dataProvider.getOne("contacts", { id: record.contact_id }).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
                dataProvider.getList("invoice_items", {
                    filter: { invoice_id: record.id },
                    pagination: { page: 1, perPage: 100 },
                    sort: { field: "sort_order", order: "ASC" },
                }).catch(() => ({ data: [] })),
            ]);

            // Generate HTML email
            const html = generateInvoiceEmailHTML({
                invoice: record,
                businessProfile: businessProfileRes.data,
                company: companyRes.data,
                contact: contactRes.data,
                items: itemsRes.data,
                message: body, // User's custom message
            });

            // Generate PDF attachment
            const pdfBase64 = await generateInvoicePDFBase64(record.invoice_number);

            const { error } = await supabase.functions.invoke("send-email", {
                body: {
                    to: recipientEmail,
                    subject,
                    body, // Plain text fallback
                    html, // Rich HTML version
                    attachments: [
                        {
                            filename: `${record.invoice_number}.pdf`,
                            content: pdfBase64,
                        },
                    ],
                },
            });

            if (error) throw error;

            notify("resources.invoices.notification.email_sent", {
                type: "success",
                messageArgs: { number: record.invoice_number }
            });

            // Mark invoice as sent if it was in draft
            if (record.status === 'draft') {
                await dataProvider.update('invoices', {
                    id: record.id,
                    data: {
                        status: 'sent',
                        sent_at: new Date().toISOString()
                    },
                    previousData: record
                });
            }

            setIsOpen(false);
        } catch (error: any) {
            console.error("Error sending email:", error);
            notify(error.message || "Failed to send email", { type: "warning" });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                        <Mail className="w-4 h-4 mr-2" />
                        {translate("resources.invoices.action.send_email")}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{translate("resources.invoices.action.send_email")}</DialogTitle>
                    <DialogDescription>
                        {translate("resources.invoices.email.description")}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="email">{translate("resources.contacts.fields.email")}</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="recipient@example.com"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subject">{translate("resources.invoices.email.subject")}</Label>
                        <Input
                            id="subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="body">Message (Optional)</Label>
                        <Textarea
                            id="body"
                            rows={6}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Add a personal message to include in the email..."
                        />
                        <p className="text-xs text-muted-foreground">
                            A professional invoice email will be generated automatically with all invoice details.
                        </p>
                    </div>
                    <div className="rounded-md bg-muted p-3 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <p className="text-sm font-medium">PDF Attachment</p>
                            <p className="text-xs text-muted-foreground">
                                Invoice {record.invoice_number}.pdf will be automatically attached
                            </p>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                        {translate("ra.action.cancel")}
                    </Button>
                    <Button type="button" onClick={handleSend} disabled={isSending}>
                        {isSending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Send className="mr-2 h-4 w-4" />
                        )}
                        {isSending ? translate("ra.action.sending") : translate("ra.action.send")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
