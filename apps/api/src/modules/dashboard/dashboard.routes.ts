import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";
import { getCapitalBalance } from "../capital/capital.service";

const router = Router();
router.use(requireAuth);

router.get("/summary", async (_req, res, next) => {
  try {
    const [products, categories, allSaleItems] = await Promise.all([
      prisma.product.findMany({ where: { deletedAt: null } }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
      // Not filtered by deletedAt: past profit stays intact even if the product was later deleted.
      prisma.saleItem.findMany({ include: { product: true } }),
    ]);

    const totalProducts = products.length;
    const totalStockUnits = products.reduce((sum, p) => sum + (p.quantity - p.quantitySold), 0);
    const totalStockValue = products.reduce(
      (sum, p) => sum + (p.quantity - p.quantitySold) * Number(p.originalCost),
      0
    );
    const soldCount = products.filter((p) => p.status === "SOLD").length;

    // Net of refunds: a refunded unit was never actually kept as profit.
    const totalActualProfit = allSaleItems.reduce((sum, item) => {
      const netQuantity = item.quantity - item.refundedQuantity;
      return sum + (Number(item.unitPrice) - Number(item.product.originalCost)) * netQuantity;
    }, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [salesCountThisMonth, saleItemsThisMonth, capital] = await Promise.all([
      prisma.sale.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.saleItem.findMany({ where: { sale: { createdAt: { gte: startOfMonth } } } }),
      getCapitalBalance(),
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
      totalActualProfit: Math.round(totalActualProfit * 100) / 100,
      soldCount,
      salesCountThisMonth,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      capital,
      categoryStats,
    });
  } catch (err) {
    next(err);
  }
});

// Sold-out products, for the dashboard's restock section.
router.get("/sold-out", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { status: "SOLD", deletedAt: null },
      include: { category: true, supplier: true },
      orderBy: { updatedAt: "desc" },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Top 5 products and top 5 categories by net units sold (quantity sold minus refunds),
// all-time. Not filtered by product deletedAt: past sales history stays intact.
router.get("/top-selling", async (_req, res, next) => {
  try {
    const saleItems = await prisma.saleItem.findMany({
      include: { product: { include: { category: true } } },
    });

    const productTotals = new Map<
      number,
      { productId: number; productCode: string; description: string; unitsSold: number }
    >();
    const categoryTotals = new Map<number, { categoryId: number; categoryName: string; unitsSold: number }>();

    for (const item of saleItems) {
      const netQuantity = item.quantity - item.refundedQuantity;
      if (netQuantity <= 0) continue;
      const { product } = item;

      const productEntry = productTotals.get(product.id);
      if (productEntry) {
        productEntry.unitsSold += netQuantity;
      } else {
        productTotals.set(product.id, {
          productId: product.id,
          productCode: product.productCode,
          description: product.description,
          unitsSold: netQuantity,
        });
      }

      const categoryEntry = categoryTotals.get(product.categoryId);
      if (categoryEntry) {
        categoryEntry.unitsSold += netQuantity;
      } else {
        categoryTotals.set(product.categoryId, {
          categoryId: product.categoryId,
          categoryName: product.category.name,
          unitsSold: netQuantity,
        });
      }
    }

    const topProducts = [...productTotals.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);
    const topCategories = [...categoryTotals.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5);

    res.json({ topProducts, topCategories });
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
