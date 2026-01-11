import type { Invoice } from "../types";

interface EmailTemplateData {
    invoice: Invoice;
    businessProfile?: {
        name?: string;
        logo?: { src?: string };
        address?: string;
        email_from_name?: string;
    };
    company?: {
        name?: string;
    };
    contact?: {
        first_name?: string;
        last_name?: string;
        email?: string;
    };
    items?: Array<{
        description: string;
        quantity: number;
        unit_price: number;
        line_total_with_tax: number;
    }>;
    message?: string;
}

export function generateInvoiceEmailHTML(data: EmailTemplateData): string {
    const { invoice, businessProfile, company, contact, items, message } = data;

    const contactName = contact?.first_name
        ? `${contact.first_name} ${contact.last_name || ''}`.trim()
        : 'Valued Customer';

    const companyName = company?.name || '';
    const senderName = businessProfile?.email_from_name || businessProfile?.name || 'Your Company';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice ${invoice.invoice_number}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px;">
              ${businessProfile?.logo?.src ? `
                <img src="${businessProfile.logo.src}" alt="${senderName}" style="max-height: 60px; margin-bottom: 20px;" />
              ` : `
                <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">${senderName}</h1>
              `}
              ${businessProfile?.address ? `
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #666; line-height: 1.5;">${businessProfile.address.replace(/\n/g, '<br>')}</p>
              ` : ''}
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1a1a1a;">Invoice #${invoice.invoice_number}</h2>
              <p style="margin: 0; font-size: 16px; color: #333; line-height: 1.6;">
                Hello ${contactName}${companyName ? ` from ${companyName}` : ''},
              </p>
            </td>
          </tr>

          <!-- Custom Message -->
          ${message ? `
          <tr>
            <td style="padding: 0 40px 20px 40px;">
              <p style="margin: 0; font-size: 15px; color: #333; line-height: 1.6; white-space: pre-line;">${message}</p>
            </td>
          </tr>
          ` : ''}

          <!-- Invoice Summary -->
          <tr>
            <td style="padding: 20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 6px; padding: 20px;">
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #666;">Issue Date:</span>
                    <strong style="float: right; font-size: 14px; color: #1a1a1a;">${new Date(invoice.issue_date).toLocaleDateString()}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0;">
                    <span style="font-size: 14px; color: #666;">Due Date:</span>
                    <strong style="float: right; font-size: 14px; color: #1a1a1a;">${new Date(invoice.due_date).toLocaleDateString()}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-top: 1px solid #dee2e6;">
                    <span style="font-size: 16px; color: #666;">Amount Due:</span>
                    <strong style="float: right; font-size: 20px; color: #2563eb;">${invoice.currency} ${invoice.total.toFixed(2)}</strong>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Line Items (if provided) -->
          ${items && items.length > 0 ? `
          <tr>
            <td style="padding: 20px 40px;">
              <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #1a1a1a;">Invoice Details</h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #dee2e6;">
                <thead>
                  <tr style="background-color: #f8f9fa;">
                    <th style="padding: 12px 0; text-align: left; font-size: 13px; color: #666; font-weight: 600;">Description</th>
                    <th style="padding: 12px 0; text-align: center; font-size: 13px; color: #666; font-weight: 600; width: 60px;">Qty</th>
                    <th style="padding: 12px 0; text-align: right; font-size: 13px; color: #666; font-weight: 600; width: 100px;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.map(item => `
                  <tr style="border-bottom: 1px solid #dee2e6;">
                    <td style="padding: 12px 0; font-size: 14px; color: #333;">${item.description}</td>
                    <td style="padding: 12px 0; text-align: center; font-size: 14px; color: #666;">${item.quantity}</td>
                    <td style="padding: 12px 0; text-align: right; font-size: 14px; color: #333;">${invoice.currency} ${item.line_total_with_tax.toFixed(2)}</td>
                  </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Payment Terms -->
          ${invoice.payment_terms ? `
          <tr>
            <td style="padding: 20px 40px;">
              <p style="margin: 0; font-size: 13px; color: #666; line-height: 1.5;">
                <strong>Payment Terms:</strong> ${invoice.payment_terms}
              </p>
            </td>
          </tr>
          ` : ''}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px 40px 40px; border-top: 1px solid #dee2e6;">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: #666; line-height: 1.6;">
                Thank you for your business!
              </p>
              <p style="margin: 0; font-size: 13px; color: #999;">
                If you have any questions about this invoice, please contact us.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
