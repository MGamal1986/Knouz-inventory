import { prisma } from "../../lib/prisma";
import { generateNextProductCode } from "../../costing/productCode";
import { calculateSellingPrice, assertValidDiscount, DiscountType } from "../../costing/pricing";
import { recordCapitalMovement } from "../capital/capital.service";

export interface CreateProductInput {
  description: string;
  categoryId: number;
  supplierId: number;
  purchaseDate: Date;
  originalCost: number;
  profitPercent: number;
  quantity: number;
  invoiceImageUrl?: string;
  discountType?: DiscountType;
  discountValue?: number;
  // When true, the purchase is funded from working capital and deducts
  // originalCost × quantity from the balance. When false, it's an outside
  // ("instantaneous") expense that leaves capital untouched.
  fromCapital?: boolean;
}

export async function createProduct(input: CreateProductInput) {
  const productCode = await generateNextProductCode(input.categoryId);
  const sellingPrice = calculateSellingPrice(input.originalCost, input.profitPercent);
  const discountType = input.discountType ?? "NONE";
  const discountValue = input.discountValue ?? 0;
  assertValidDiscount(discountType, discountValue);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        productCode,
        description: input.description,
        categoryId: input.categoryId,
        supplierId: input.supplierId,
        purchaseDate: input.purchaseDate,
        originalCost: input.originalCost,
        profitPercent: input.profitPercent,
        sellingPrice,
        discountType,
        discountValue,
        quantity: input.quantity,
        invoiceImageUrl: input.invoiceImageUrl,
      },
      include: { category: true, supplier: true },
    });

    if (input.fromCapital) {
      await recordCapitalMovement(tx, {
        type: "PURCHASE",
        amount: -(input.originalCost * input.quantity),
        description: `Purchase ${product.productCode} × ${input.quantity}`,
        productId: product.id,
      });
    }

    return product;
  });
}

// Quantity is deliberately excluded: it's fixed at creation and can only be increased
// afterwards via restockProduct (available for any product, sold out or not).
export interface UpdateProductInput {
  description?: string;
  categoryId?: number;
  supplierId?: number;
  purchaseDate?: Date;
  originalCost?: number;
  profitPercent?: number;
  invoiceImageUrl?: string;
  discountType?: DiscountType;
  discountValue?: number;
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw Object.assign(new Error("Product not found"), { status: 404 });

  const originalCost = input.originalCost ?? Number(existing.originalCost);
  const profitPercent = input.profitPercent ?? Number(existing.profitPercent);
  const sellingPrice = calculateSellingPrice(originalCost, profitPercent);
  const discountType = input.discountType ?? (existing.discountType as DiscountType);
  const discountValue = input.discountValue ?? Number(existing.discountValue);
  assertValidDiscount(discountType, discountValue);

  return prisma.product.update({
    where: { id },
    data: {
      ...input,
      originalCost,
      profitPercent,
      sellingPrice,
      discountType,
      discountValue,
    },
    include: { category: true, supplier: true },
  });
}

function computeStatus(quantity: number, quantitySold: number): "IN_STOCK" | "SOLD" | "PARTIALLY_SOLD" {
  if (quantitySold >= quantity) return "SOLD";
  if (quantitySold > 0) return "PARTIALLY_SOLD";
  return "IN_STOCK";
}

export interface RestockInput {
  additionalQuantity: number;
  originalCost?: number;
  profitPercent?: number;
  discountType?: DiscountType;
  discountValue?: number;
  // When true, the restock batch is funded from working capital and deducts
  // its cost (batch originalCost × additionalQuantity) from the balance.
  fromCapital?: boolean;
}

// Adds purchased quantity to any product (sold out or not) and, optionally, updates its
// cost/price/discount at the same time — e.g. a new restock batch bought at a different cost.
export async function restockProduct(id: number, input: RestockInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) throw Object.assign(new Error("Product not found"), { status: 404 });

  const originalCost = input.originalCost ?? Number(existing.originalCost);
  const profitPercent = input.profitPercent ?? Number(existing.profitPercent);
  const sellingPrice = calculateSellingPrice(originalCost, profitPercent);
  const discountType = input.discountType ?? (existing.discountType as DiscountType);
  const discountValue = input.discountValue ?? Number(existing.discountValue);
  assertValidDiscount(discountType, discountValue);

  const quantity = existing.quantity + input.additionalQuantity;
  const status = computeStatus(quantity, existing.quantitySold);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.update({
      where: { id },
      data: { quantity, status, originalCost, profitPercent, sellingPrice, discountType, discountValue },
      include: { category: true, supplier: true },
    });

    if (input.fromCapital) {
      // The restock batch is priced at the cost supplied for this batch (falling back
      // to the product's existing cost), not any earlier batch's cost.
      await recordCapitalMovement(tx, {
        type: "RESTOCK",
        amount: -(originalCost * input.additionalQuantity),
        description: `Restock ${product.productCode} × ${input.additionalQuantity}`,
        productId: product.id,
      });
    }

    return product;
  });
}

export async function listProducts(filters: {
  categoryId?: number;
  supplierId?: number;
  status?: "IN_STOCK" | "SOLD" | "PARTIALLY_SOLD";
  search?: string;
}) {
  return prisma.product.findMany({
    where: {
      deletedAt: null,
      categoryId: filters.categoryId,
      supplierId: filters.supplierId,
      status: filters.status,
      ...(filters.search
        ? {
            OR: [
              { productCode: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true, supplier: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductByCode(code: string) {
  return prisma.product.findFirst({
    where: { productCode: code, deletedAt: null },
    include: { category: true, supplier: true },
  });
}

// Soft delete: keeps the row (and its unique productCode) around forever so sale
// history/invoices/reports referencing it stay intact and the code is never reissued.
export async function deleteProduct(id: number) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing || existing.deletedAt) {
    throw Object.assign(new Error("Product not found"), { status: 404 });
  }
  return prisma.product.update({ where: { id }, data: { deletedAt: new Date() } });
}
