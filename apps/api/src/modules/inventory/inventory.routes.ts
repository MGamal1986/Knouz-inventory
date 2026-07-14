import { Router } from "express";
import { prisma } from "../../lib/prisma";
import { requireAuth } from "../../middleware/auth";

const router = Router();
router.use(requireAuth);

// Detailed inventory view: every product with computed stock, searchable by code
router.get("/", async (req, res, next) => {
  try {
    const { search, categoryId, lowStockThreshold } = req.query;

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        categoryId: categoryId ? Number(categoryId) : undefined,
        ...(search
          ? {
              OR: [
                { productCode: { contains: String(search), mode: "insensitive" } },
                { description: { contains: String(search), mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { category: true, supplier: true },
      orderBy: { productCode: "asc" },
    });

    const withStock = products.map((p) => ({
      ...p,
      stock: p.quantity - p.quantitySold,
    }));

    const filtered = lowStockThreshold
      ? withStock.filter((p) => p.stock <= Number(lowStockThreshold))
      : withStock;

    res.json(filtered);
  } catch (err) {
    next(err);
  }
});

export default router;
