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

    const salesThisMonth = await prisma.sale.findMany({
      where: { createdAt: { gte: startOfMonth } },
    });
    const revenueThisMonth = salesThisMonth.reduce((sum, s) => sum + Number(s.totalAmount), 0);

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
      salesCountThisMonth: salesThisMonth.length,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      categoryStats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
