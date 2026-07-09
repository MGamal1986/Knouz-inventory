import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { shapeText } from "./arabicText";

const FONT_REGULAR = path.join(process.cwd(), "assets/fonts/Amiri-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "assets/fonts/Amiri-Bold.ttf");

export interface InvoiceLine {
  productCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  clientName: string;
  clientAddress?: string | null;
  clientMobile: string;
  lines: InvoiceLine[];
  totalAmount: number;
}

const INVOICES_DIR = path.join(process.cwd(), "invoices");

export async function generateInvoicePdf(data: InvoiceData): Promise<string> {
  if (!fs.existsSync(INVOICES_DIR)) {
    fs.mkdirSync(INVOICES_DIR, { recursive: true });
  }

  const fileName = `${data.invoiceNumber}.pdf`;
  const filePath = path.join(INVOICES_DIR, fileName);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  doc.registerFont("Body", FONT_REGULAR);
  doc.registerFont("Body-Bold", FONT_BOLD);
  doc.font("Body");

  doc.fontSize(20).text(shapeText("Knouz — Sales Invoice"), { align: "center" });
  doc.moveDown();

  doc.fontSize(10);
  doc.text(shapeText(`Invoice #: ${data.invoiceNumber}`));
  doc.text(shapeText(`Date/Time: ${data.createdAt.toLocaleString()}`));
  doc.moveDown();

  doc.text(shapeText(`Client: ${data.clientName}`));
  if (data.clientAddress) doc.text(shapeText(`Address: ${data.clientAddress}`));
  doc.text(shapeText(`Mobile: ${data.clientMobile}`));
  doc.moveDown();

  // Table header
  const tableTop = doc.y;
  doc.font("Body-Bold");
  doc.text("Code", 50, tableTop, { width: 80 });
  doc.text("Description", 130, tableTop, { width: 170 });
  doc.text("Qty", 300, tableTop, { width: 50 });
  doc.text("Unit Price", 350, tableTop, { width: 80 });
  doc.text("Total", 440, tableTop, { width: 80 });
  doc.font("Body");
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  data.lines.forEach((line) => {
    const y = doc.y + 5;
    doc.text(line.productCode, 50, y, { width: 80 });
    doc.text(shapeText(line.description), 130, y, { width: 170 });
    doc.text(String(line.quantity), 300, y, { width: 50 });
    doc.text(`${line.unitPrice.toFixed(2)} EGP`, 350, y, { width: 80 });
    doc.text(`${line.lineTotal.toFixed(2)} EGP`, 440, y, { width: 80 });
    doc.moveDown();
  });

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();
  doc.font("Body-Bold").text(`TOTAL: ${data.totalAmount.toFixed(2)} EGP`, { align: "right" });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return `/invoices/${fileName}`;
}
