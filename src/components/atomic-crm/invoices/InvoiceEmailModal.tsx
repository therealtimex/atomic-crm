import { useState, useEffect } from "react";
import { useTranslate, useNotify, useDataProvider } from "ra-core";
import { Mail, Send, Loader2 } from "lucide-react";
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
            // Pre-fill subject and body
            setSubject(`${translate("resources.invoices.name", { smart_count: 1 })} #${record.invoice_number}`);

            const defaultBody = `${translate("crm.common.hello")},\n\n` +
                `${translate("resources.invoices.email.body_intro", { number: record.invoice_number })}\n\n` +
                `${translate("resources.invoices.fields.total")}: ${record.currency} ${record.total.toFixed(2)}\n` +
                `${translate("resources.invoices.fields.due_date")}: ${new Date(record.due_date).toLocaleDateString()}\n\n` +
                `${translate("resources.invoices.email.body_closing")}\n\n` +
                `${translate("crm.common.regards")}`;

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
    }, [isOpen, record, translate, dataProvider]);

    const handleSend = async () => {
        if (!recipientEmail) {
            notify("crm.company.error.invalid_url", { type: "warning" }); // Or better: "Email is required"
            return;
        }

        setIsSending(true);
        try {
            const { error } = await supabase.functions.invoke("send-email", {
                body: {
                    to: recipientEmail,
                    subject,
                    body,
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
                        <Label htmlFor="body">{translate("resources.invoices.email.body")}</Label>
                        <Textarea
                            id="body"
                            rows={8}
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                        />
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
