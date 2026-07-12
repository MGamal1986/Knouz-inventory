import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { shapeArabic } from "./arabicText";

const FONT_REGULAR = path.join(process.cwd(), "assets/fonts/Amiri-Regular.ttf");
const FONT_BOLD = path.join(process.cwd(), "assets/fonts/Amiri-Bold.ttf");

export interface InvoiceLine {
  productCode: string;
  description: string;
  quantity: number;
  originalUnitPrice: number;
  discountAmount: number;
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
  subtotalAmount: number;
  totalDiscount: number;
  totalAmount: number;
}

const INVOICES_DIR = path.join(process.cwd(), "invoices");

// pdfkit lays the WHOLE string out as one run only when `features` is set and
// line-breaking is off — exactly what the Arabic shaping in arabicText.ts needs.
// (Its per-word cache path would reverse each Arabic word individually.)
const SHAPED_OPTS: PDFKit.Mixins.TextOptions = { features: [], lineBreak: false };

type Doc = InstanceType<typeof PDFDocument>;

/** Draw a single (possibly Arabic) line at an absolute position, shaped correctly. */
function drawShaped(doc: Doc, text: string, x: number, y: number, width: number, align: "left" | "right" | "center" = "left") {
  doc.text(shapeArabic(text), x, y, { ...SHAPED_OPTS, width, align });
}

/**
 * Word-wrap logical (pre-shaping) text to fit `maxWidth`, measuring each
 * candidate line in its shaped form. Wrapping on the logical text keeps letter
 * joining and bidi ordering correct within every resulting line.
 */
function wrapLogicalToWidth(doc: Doc, logical: string, maxWidth: number): string[] {
  const words = logical.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];

  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    const trialWidth = doc.widthOfString(shapeArabic(trial), SHAPED_OPTS);
    if (current && trialWidth > maxWidth) {
      lines.push(current);
      current = word;
    } else {
      current = trial;
    }
  }
  if (current) lines.push(current);
  return lines;
}

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

  doc.fontSize(20).text("Knouz — Sales Invoice", { align: "center" });
  doc.moveDown();

  doc.fontSize(10);
  drawShaped(doc, `Invoice #: ${data.invoiceNumber}`, 50, doc.y, 500);
  drawShaped(doc, `Date/Time: ${data.createdAt.toLocaleString()}`, 50, doc.y, 500);
  doc.moveDown();

  drawShaped(doc, `Client: ${data.clientName}`, 50, doc.y, 500);
  if (data.clientAddress) drawShaped(doc, `Address: ${data.clientAddress}`, 50, doc.y, 500);
  drawShaped(doc, `Mobile: ${data.clientMobile}`, 50, doc.y, 500);
  doc.moveDown();

  // Column geometry
  const COLS = {
    code: { x: 50, w: 70 },
    desc: { x: 120, w: 130 },
    qty: { x: 250, w: 40 },
    price: { x: 290, w: 70 },
    discount: { x: 360, w: 70 },
    total: { x: 440, w: 100 },
  };

  // Table header
  const headerY = doc.y;
  doc.font("Body-Bold");
  doc.text("Code", COLS.code.x, headerY, { width: COLS.code.w, lineBreak: false });
  doc.text("Description", COLS.desc.x, headerY, { width: COLS.desc.w, lineBreak: false });
  doc.text("Qty", COLS.qty.x, headerY, { width: COLS.qty.w, lineBreak: false });
  doc.text("Price", COLS.price.x, headerY, { width: COLS.price.w, lineBreak: false });
  doc.text("Discount", COLS.discount.x, headerY, { width: COLS.discount.w, lineBreak: false });
  doc.text("Total", COLS.total.x, headerY, { width: COLS.total.w, lineBreak: false });
  doc.font("Body");
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();

  const lineHeight = doc.currentLineHeight();

  data.lines.forEach((line) => {
    const rowY = doc.y + 5;
    const descLines = wrapLogicalToWidth(doc, line.description, COLS.desc.w);

    doc.text(line.productCode, COLS.code.x, rowY, { width: COLS.code.w, lineBreak: false });
    descLines.forEach((dl, i) => {
      doc.text(shapeArabic(dl), COLS.desc.x, rowY + i * lineHeight, { ...SHAPED_OPTS, width: COLS.desc.w });
    });
    doc.text(String(line.quantity), COLS.qty.x, rowY, { width: COLS.qty.w, lineBreak: false });
    doc.text(line.originalUnitPrice.toFixed(2), COLS.price.x, rowY, { width: COLS.price.w, lineBreak: false });
    doc.text(
      line.discountAmount > 0 ? `-${line.discountAmount.toFixed(2)}` : "-",
      COLS.discount.x,
      rowY,
      { width: COLS.discount.w, lineBreak: false }
    );
    doc.text(`${line.lineTotal.toFixed(2)} EGP`, COLS.total.x, rowY, { width: COLS.total.w, lineBreak: false });

    doc.y = rowY + Math.max(1, descLines.length) * lineHeight;
  });

  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown();

  doc.text(`Subtotal: ${data.subtotalAmount.toFixed(2)} EGP`, 50, doc.y, { width: 500, align: "right", lineBreak: false });
  if (data.totalDiscount > 0) {
    doc.text(`Discount: -${data.totalDiscount.toFixed(2)} EGP`, 50, doc.y, { width: 500, align: "right", lineBreak: false });
  }
  doc
    .font("Body-Bold")
    .text(`TOTAL: ${data.totalAmount.toFixed(2)} EGP`, 50, doc.y, { width: 500, align: "right", lineBreak: false });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    stream.on("finish", () => resolve());
    stream.on("error", reject);
  });

  return `/invoices/${fileName}`;
}
