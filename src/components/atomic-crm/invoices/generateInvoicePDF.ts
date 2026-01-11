import jsPDF from "jspdf";
import { toJpeg } from "html-to-image";

/**
 * Generates a PDF from the invoice content and returns it as a base64 string
 * @param invoiceNumber - The invoice number for the filename
 * @returns Promise<string> - Base64 encoded PDF
 */
export async function generateInvoicePDFBase64(invoiceNumber: string): Promise<string> {
    const element = document.getElementById("invoice-content");
    if (!element) {
        throw new Error("Invoice content not found");
    }

    // Hide elements with 'no-print' class during capture
    const noPrintElements = document.querySelectorAll(".no-print");
    noPrintElements.forEach((el) => ((el as HTMLElement).style.display = "none"));

    // Force the pdf-export class to ensure light mode variables are used
    element.classList.add("pdf-export");

    try {
        // Capture using toJpeg for significantly smaller file size
        const dataUrl = await toJpeg(element, {
            quality: 0.8,
            pixelRatio: 2,
            backgroundColor: "#ffffff",
            includeQueryParams: true,
        });

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: "a4",
            compress: true,
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

        // Get the PDF as base64 string
        const pdfBase64 = pdf.output('datauristring').split(',')[1];

        return pdfBase64;
    } finally {
        // Cleanup: remove the class and restore elements
        element.classList.remove("pdf-export");
        noPrintElements.forEach((el) => ((el as HTMLElement).style.display = ""));
    }
}
