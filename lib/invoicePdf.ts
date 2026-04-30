import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { Payment, Client, InvoiceSeries } from "./types";

interface InvoiceData {
  payment: Payment;
  client?: Client;
  invoiceNumber: number;
  series: InvoiceSeries;
}

/**
 * Generate a PDF invoice from payment data using pdf-lib (serverless-compatible)
 * Returns a Buffer containing the PDF
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const { payment, client, invoiceNumber, series } = data;

  try {
    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size in points
    const { width, height } = page.getSize();

    // Load standard fonts (no external files needed)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Set metadata
    pdfDoc.setTitle(`${series} ${invoiceNumber}`);
    pdfDoc.setAuthor("Billing POC");
    pdfDoc.setSubject(`Invoice for payment`);

    let yPos = height - 50;

    // Header - Company Info
    page.drawText("YOUR COMPANY NAME", {
      x: 50,
      y: yPos,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 25;

    page.drawText("Tax ID: YOUR-TAX-ID", { x: 50, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText("Address Line 1", { x: 50, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText("City, Postal Code", { x: 50, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText("Email: info@yourcompany.com", { x: 50, y: yPos, size: 10, font });
    yPos -= 15;
    page.drawText("Phone: +XX XXX XXX XXX", { x: 50, y: yPos, size: 10, font });
    yPos -= 40;

    // Invoice Title and Number
    page.drawText(series.toUpperCase(), {
      x: 50,
      y: yPos,
      size: 24,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPos -= 30;

    page.drawText(`Invoice Number: ${series}-${String(invoiceNumber).padStart(6, "0")}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    });
    yPos -= 15;

    page.drawText(`Date: ${new Date(payment.date).toLocaleDateString("es-ES")}`, {
      x: 50,
      y: yPos,
      size: 12,
      font,
    });
    yPos -= 15;

    if (payment.deliveryNoteRef) {
      page.drawText(`Delivery Note Ref: ${payment.deliveryNoteRef}`, {
        x: 50,
        y: yPos,
        size: 12,
        font,
      });
      yPos -= 15;
    }

    yPos -= 30;

    // Client Information
    page.drawText("Bill To:", {
      x: 50,
      y: yPos,
      size: 14,
      font: boldFont,
    });
    yPos -= 20;

    if (client) {
      page.drawText(client.name, { x: 50, y: yPos, size: 11, font });
      yPos -= 15;
      page.drawText(`Tax ID: ${client.taxId}`, { x: 50, y: yPos, size: 11, font });
      yPos -= 15;
      page.drawText(client.address, { x: 50, y: yPos, size: 11, font, maxWidth: 300 });
      yPos -= 15;
      if (client.email) {
        page.drawText(`Email: ${client.email}`, { x: 50, y: yPos, size: 11, font });
        yPos -= 15;
      }
      if (client.phone) {
        page.drawText(`Phone: ${client.phone}`, { x: 50, y: yPos, size: 11, font });
        yPos -= 15;
      }
    } else {
      page.drawText("No client associated", { x: 50, y: yPos, size: 11, font });
      yPos -= 15;
    }

    yPos -= 30;

    // Line Items Table Header
    page.drawText("Description", { x: 50, y: yPos, size: 10, font: boldFont });
    page.drawText("Quantity", { x: 280, y: yPos, size: 10, font: boldFont });
    page.drawText("Unit Price", { x: 360, y: yPos, size: 10, font: boldFont });
    page.drawText("Amount", { x: 470, y: yPos, size: 10, font: boldFont });
    yPos -= 5;

    // Draw line under header
    page.drawLine({
      start: { x: 50, y: yPos },
      end: { x: 540, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Line Items
    payment.concepts.forEach((concept) => {
      const lineTotal = concept.amount * concept.quantity;

      page.drawText(concept.name.substring(0, 30), { x: 50, y: yPos, size: 10, font });
      page.drawText(concept.quantity.toString(), { x: 290, y: yPos, size: 10, font });
      page.drawText(`€${concept.amount.toFixed(2)}`, { x: 360, y: yPos, size: 10, font });
      page.drawText(`€${lineTotal.toFixed(2)}`, { x: 470, y: yPos, size: 10, font });

      yPos -= 20;
    });

    yPos -= 10;

    // Draw line before totals
    page.drawLine({
      start: { x: 350, y: yPos },
      end: { x: 540, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Totals Section
    page.drawText("Subtotal:", { x: 350, y: yPos, size: 10, font });
    page.drawText(`€${payment.netAmount.toFixed(2)}`, { x: 470, y: yPos, size: 10, font });
    yPos -= 20;

    page.drawText(`VAT (${payment.vat}%):`, { x: 350, y: yPos, size: 10, font });
    page.drawText(`€${payment.vatAmount.toFixed(2)}`, { x: 470, y: yPos, size: 10, font });
    yPos -= 20;

    if (payment.surcharge && payment.surchargeAmount) {
      page.drawText(`Surcharge (${payment.surcharge}%):`, { x: 350, y: yPos, size: 10, font });
      page.drawText(`€${payment.surchargeAmount.toFixed(2)}`, { x: 470, y: yPos, size: 10, font });
      yPos -= 20;
    }

    // Draw line before total
    page.drawLine({
      start: { x: 350, y: yPos },
      end: { x: 540, y: yPos },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Total
    page.drawText("TOTAL:", { x: 350, y: yPos, size: 14, font: boldFont });
    page.drawText(`€${payment.total.toFixed(2)}`, { x: 470, y: yPos, size: 14, font: boldFont });

    // Footer
    const footerY = 50;
    page.drawText("Thank you for your business!", {
      x: width / 2 - 80,
      y: footerY + 15,
      size: 8,
      font,
    });

    const generatedText = `Generated on ${new Date().toLocaleDateString("es-ES")} at ${new Date().toLocaleTimeString("es-ES")}`;
    page.drawText(generatedText, {
      x: width / 2 - 100,
      y: footerY,
      size: 8,
      font,
    });

    // Save the PDF and return as Buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
}
