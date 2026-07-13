import { prisma } from "../../lib/prisma";
import { generateNextProductCode } from "../../costing/productCode";
import { calculateSellingPrice, assertValidDiscount, DiscountType } from "../../costing/pricing";

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
}

export async function createProduct(input: CreateProductInput) {
  const productCode = await generateNextProductCode(input.categoryId);
  const sellingPrice = calculateSellingPrice(input.originalCost, input.profitPercent);
  const discountType = input.discountType ?? "NONE";
  const discountValue = input.discountValue ?? 0;
  assertValidDiscount(discountType, discountValue);

  return prisma.product.create({
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
}

// Quantity is deliberately excluded: it's fixed at creation and can only be increased
// afterwards via restockProduct, which is restricted to sold-out products.
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
  if (!existing) throw Object.assign(new Error("Product not found"), { status: 404 });

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

// Adds more purchased quantity to a sold-out product. Restricted to SOLD products since
// stock is only ever replenished from the dashboard's Sold Out Items section.
export async function restockProduct(id: number, additionalQuantity: number) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error("Product not found"), { status: 404 });
  if (existing.status !== "SOLD") {
    throw Object.assign(new Error("Only sold-out products can be restocked"), { status: 400 });
  }

  const quantity = existing.quantity + additionalQuantity;
  const status = computeStatus(quantity, existing.quantitySold);

  return prisma.product.update({
    where: { id },
    data: { quantity, status },
    include: { category: true, supplier: true },
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
  return prisma.product.findUnique({
    where: { productCode: code },
    include: { category: true, supplier: true },
  });
}

export async function deleteProduct(id: number) {
  return prisma.product.delete({ where: { id } });
}
