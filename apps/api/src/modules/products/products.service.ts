import { prisma } from "../../lib/prisma";
import { generateNextProductCode } from "../../costing/productCode";
import { calculateSellingPrice } from "../../costing/pricing";

export interface CreateProductInput {
  description: string;
  categoryId: number;
  supplierId: number;
  purchaseDate: Date;
  originalCost: number;
  profitPercent: number;
  quantity: number;
  invoiceImageUrl?: string;
}

export async function createProduct(input: CreateProductInput) {
  const productCode = await generateNextProductCode(input.categoryId);
  const sellingPrice = calculateSellingPrice(input.originalCost, input.profitPercent);

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
      quantity: input.quantity,
      invoiceImageUrl: input.invoiceImageUrl,
    },
    include: { category: true, supplier: true },
  });
}

export interface UpdateProductInput {
  description?: string;
  categoryId?: number;
  supplierId?: number;
  purchaseDate?: Date;
  originalCost?: number;
  profitPercent?: number;
  quantity?: number;
  invoiceImageUrl?: string;
}

export async function updateProduct(id: number, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw Object.assign(new Error("Product not found"), { status: 404 });

  const originalCost = input.originalCost ?? Number(existing.originalCost);
  const profitPercent = input.profitPercent ?? Number(existing.profitPercent);
  const sellingPrice = calculateSellingPrice(originalCost, profitPercent);

  return prisma.product.update({
    where: { id },
    data: {
      ...input,
      originalCost,
      profitPercent,
      sellingPrice,
    },
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
