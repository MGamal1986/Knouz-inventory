import { prisma } from "../../lib/prisma";
import { generateInvoicePdf, InvoiceLine } from "../../lib/pdf";
import { calculateDiscountedPrice, assertValidDiscount, DiscountType } from "../../costing/pricing";

export interface SaleItemInput {
  productId: number;
  quantity: number;
  // Per-invoice discount override. Defaults to the product's configured discount when
  // omitted; explicitly set (including "NONE") this applies only to this sale — it never
  // changes the product's own discountType/discountValue.
  discountType?: DiscountType;
  discountValue?: number;
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
    let subtotalAmount = 0;
    let totalDiscount = 0;
    const saleItemsData: {
      productId: number;
      quantity: number;
      originalUnitPrice: number;
      discountType: DiscountType;
      discountValue: number;
      discountAmount: number;
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

      const originalUnitPrice = Number(product.sellingPrice);
      const discountType: DiscountType = item.discountType ?? (product.discountType as DiscountType);
      const discountValue = item.discountValue ?? Number(product.discountValue);
      assertValidDiscount(discountType, discountValue);
      const unitPrice = calculateDiscountedPrice(originalUnitPrice, discountType, discountValue);
      const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
      const discountAmount = Math.round((originalUnitPrice - unitPrice) * item.quantity * 100) / 100;

      totalAmount += lineTotal;
      subtotalAmount += Math.round(originalUnitPrice * item.quantity * 100) / 100;
      totalDiscount += discountAmount;

      saleItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        originalUnitPrice,
        discountType,
        discountValue,
        discountAmount,
        unitPrice,
        lineTotal,
      });

      invoiceLines.push({
        productCode: product.productCode,
        description: product.description,
        quantity: item.quantity,
        originalUnitPrice,
        discountAmount,
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
    subtotalAmount = Math.round(subtotalAmount * 100) / 100;
    totalDiscount = Math.round(totalDiscount * 100) / 100;
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

    return { sale, client, invoiceLines, totalAmount, subtotalAmount, totalDiscount, invoiceNumber };
  });

  // Generate PDF outside the DB transaction (file I/O)
  const invoicePdfUrl = await generateInvoicePdf({
    invoiceNumber: result.invoiceNumber,
    createdAt: result.sale.createdAt,
    clientName: result.client.name,
    clientAddress: result.client.address,
    clientMobile: result.client.mobile,
    lines: result.invoiceLines,
    subtotalAmount: result.subtotalAmount,
    totalDiscount: result.totalDiscount,
    totalAmount: result.totalAmount,
  });

  const updatedSale = await prisma.sale.update({
    where: { id: result.sale.id },
    data: { invoicePdfUrl },
    include: { items: { include: { product: true } }, client: true },
  });

  return updatedSale;
}

function withNetTotals<T extends { items: { unitPrice: unknown; quantity: number; refundedQuantity: number }[] }>(
  sale: T
) {
  let netTotal = 0;
  let totalRefunded = 0;
  for (const item of sale.items) {
    const unitPrice = Number(item.unitPrice);
    netTotal += unitPrice * (item.quantity - item.refundedQuantity);
    totalRefunded += unitPrice * item.refundedQuantity;
  }
  return {
    ...sale,
    netTotal: Math.round(netTotal * 100) / 100,
    totalRefunded: Math.round(totalRefunded * 100) / 100,
  };
}

export async function listSales() {
  const sales = await prisma.sale.findMany({
    include: { client: true, items: true },
    orderBy: { createdAt: "desc" },
  });
  return sales.map(withNetTotals);
}

export async function getSaleById(id: number) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: { client: true, items: { include: { product: true, refunds: true } } },
  });
  return sale ? withNetTotals(sale) : null;
}

export interface RefundItemInput {
  saleItemId: number;
  quantity: number;
}

export interface CreateRefundInput {
  items: RefundItemInput[];
  reason?: string;
}

export async function createRefund(saleId: number, input: CreateRefundInput) {
  if (input.items.length === 0) {
    throw Object.assign(new Error("A refund must include at least one item"), { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId } });
    if (!sale) throw Object.assign(new Error("Sale not found"), { status: 404 });

    for (const refundItem of input.items) {
      const saleItem = await tx.saleItem.findUnique({
        where: { id: refundItem.saleItemId },
        include: { product: true },
      });
      if (!saleItem || saleItem.saleId !== saleId) {
        throw Object.assign(new Error(`Sale item ${refundItem.saleItemId} not found on this sale`), {
          status: 404,
        });
      }

      const remaining = saleItem.quantity - saleItem.refundedQuantity;
      if (refundItem.quantity <= 0 || refundItem.quantity > remaining) {
        throw Object.assign(
          new Error(
            `Invalid refund quantity for ${saleItem.product.productCode}. Refundable: ${remaining}, requested: ${refundItem.quantity}`
          ),
          { status: 400 }
        );
      }

      const refundAmount = Math.round(Number(saleItem.unitPrice) * refundItem.quantity * 100) / 100;

      await tx.refund.create({
        data: {
          saleItemId: saleItem.id,
          quantity: refundItem.quantity,
          refundAmount,
          reason: input.reason,
        },
      });

      await tx.saleItem.update({
        where: { id: saleItem.id },
        data: { refundedQuantity: saleItem.refundedQuantity + refundItem.quantity },
      });

      // Restock at the product's existing cost/selling price — refunds never alter pricing or discount config.
      const product = saleItem.product;
      const newQuantitySold = Math.max(0, product.quantitySold - refundItem.quantity);
      const newStatus =
        newQuantitySold >= product.quantity ? "SOLD" : newQuantitySold > 0 ? "PARTIALLY_SOLD" : "IN_STOCK";

      await tx.product.update({
        where: { id: product.id },
        data: { quantitySold: newQuantitySold, status: newStatus },
      });
    }
  });

  return getSaleById(saleId);
}
