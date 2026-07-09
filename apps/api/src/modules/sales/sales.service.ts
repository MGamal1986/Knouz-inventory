import { prisma } from "../../lib/prisma";
import { generateInvoicePdf, InvoiceLine } from "../../lib/pdf";

export interface SaleItemInput {
  productId: number;
  quantity: number;
}

export interface CreateSaleInput {
  clientId: number;
  items: SaleItemInput[];
}

async function nextInvoiceNumber(): Promise<string> {
  const count = await prisma.sale.count();
  return `SALE-${String(count + 1).padStart(6, "0")}`;
}

export async function createSale(input: CreateSaleInput) {
  if (input.items.length === 0) {
    throw Object.assign(new Error("A sale must include at least one item"), { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const client = await tx.client.findUnique({ where: { id: input.clientId } });
    if (!client) throw Object.assign(new Error("Client not found"), { status: 404 });

    let totalAmount = 0;
    const saleItemsData: {
      productId: number;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }[] = [];
    const invoiceLines: InvoiceLine[] = [];

    for (const item of input.items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) {
        throw Object.assign(new Error(`Product ${item.productId} not found`), { status: 404 });
      }

      const remainingStock = product.quantity - product.quantitySold;
      if (item.quantity > remainingStock) {
        throw Object.assign(
          new Error(
            `Not enough stock for ${product.productCode}. Remaining: ${remainingStock}, requested: ${item.quantity}`
          ),
          { status: 400 }
        );
      }

      const unitPrice = Number(product.sellingPrice);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      totalAmount += lineTotal;

      saleItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });

      invoiceLines.push({
        productCode: product.productCode,
        description: product.description,
        quantity: item.quantity,
        unitPrice,
        lineTotal,
      });

      const newQuantitySold = product.quantitySold + item.quantity;
      const newStatus =
        newQuantitySold >= product.quantity
          ? "SOLD"
          : newQuantitySold > 0
          ? "PARTIALLY_SOLD"
          : "IN_STOCK";

      await tx.product.update({
        where: { id: product.id },
        data: { quantitySold: newQuantitySold, status: newStatus },
      });
    }

    totalAmount = Math.round(totalAmount * 100) / 100;
    const invoiceNumber = await nextInvoiceNumber();

    const sale = await tx.sale.create({
      data: {
        invoiceNumber,
        clientId: input.clientId,
        totalAmount,
        items: { create: saleItemsData },
      },
      include: { items: true, client: true },
    });

    return { sale, client, invoiceLines, totalAmount, invoiceNumber };
  });

  // Generate PDF outside the DB transaction (file I/O)
  const invoicePdfUrl = await generateInvoicePdf({
    invoiceNumber: result.invoiceNumber,
    createdAt: result.sale.createdAt,
    clientName: result.client.name,
    clientAddress: result.client.address,
    clientMobile: result.client.mobile,
    lines: result.invoiceLines,
    totalAmount: result.totalAmount,
  });

  const updatedSale = await prisma.sale.update({
    where: { id: result.sale.id },
    data: { invoicePdfUrl },
    include: { items: { include: { product: true } }, client: true },
  });

  return updatedSale;
}

export async function listSales() {
  return prisma.sale.findMany({
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSaleById(id: number) {
  return prisma.sale.findUnique({
    where: { id },
    include: { client: true, items: { include: { product: true } } },
  });
}
