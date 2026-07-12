import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (_req, res, next) => {
  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany(),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((sum, p) => sum + (p.quantity - p.quantitySold), 0);
    const totalStockValue = products.reduce(
      (sum, p) => sum + (p.quantity - p.quantitySold) * Number(p.originalCost),
      0
    );
    const soldCount = products.filter((p) => p.status === "SOLD").length;
    const inStockCount = products.filter((p) => p.status === "IN_STOCK").length;
    const lowStockCount = products.filter((p) => p.quantity - p.quantitySold <= 2 && p.quantity - p.quantitySold > 0).length;

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [salesCountThisMonth, saleItemsThisMonth] = await Promise.all([
      prisma.sale.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.saleItem.findMany({ where: { sale: { createdAt: { gte: startOfMonth } } } }),
    ]);
    // Net of refunds: a refunded unit never counted as revenue.
    const revenueThisMonth = saleItemsThisMonth.reduce(
      (sum, item) => sum + Number(item.unitPrice) * (item.quantity - item.refundedQuantity),
      0
    );

    const categoryStats = categories.map((cat) => {
      const catProducts = products.filter((p) => p.categoryId === cat.id);
      const unitsInStock = catProducts.reduce((sum, p) => sum + (p.quantity - p.quantitySold), 0);
      const totalOriginalCost = catProducts.reduce(
        (sum, p) => sum + (p.quantity - p.quantitySold) * Number(p.originalCost),
        0
      );
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        unitsInStock,
        totalOriginalCost: Math.round(totalOriginalCost * 100) / 100,
      };
    });

    res.json({
      totalProducts,
      totalStockUnits,
      totalStockValue: Math.round(totalStockValue * 100) / 100,
      soldCount,
      inStockCount,
      lowStockCount,
      salesCountThisMonth,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      categoryStats,
    });
  } catch (err) {
    next(err);
  }
});

// Filterable revenue explorer: time range, category, client, and/or product.
// Net of refunds, since a refunded unit was never actually kept as revenue.
router.get("/revenue", async (req, res, next) => {
  try {
    const { from, to, categoryId, clientId, productId } = req.query;

    const items = await prisma.saleItem.findMany({
      where: {
        sale: {
          createdAt: {
            gte: from ? new Date(String(from)) : undefined,
            lte: to ? new Date(String(to)) : undefined,
          },
          clientId: clientId ? Number(clientId) : undefined,
        },
        productId: productId ? Number(productId) : undefined,
        ...(categoryId ? { product: { categoryId: Number(categoryId) } } : {}),
      },
      select: { saleId: true, quantity: true, refundedQuantity: true, unitPrice: true },
    });

    let grossRevenue = 0;
    let refundedAmount = 0;
    const saleIds = new Set<number>();
    for (const item of items) {
      const unitPrice = Number(item.unitPrice);
      grossRevenue += unitPrice * item.quantity;
      refundedAmount += unitPrice * item.refundedQuantity;
      saleIds.add(item.saleId);
    }

    res.json({
      grossRevenue: Math.round(grossRevenue * 100) / 100,
      refundedAmount: Math.round(refundedAmount * 100) / 100,
      netRevenue: Math.round((grossRevenue - refundedAmount) * 100) / 100,
      salesCount: saleIds.size,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
