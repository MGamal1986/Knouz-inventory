import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { upload } from "../../middleware/upload";
import * as productsService from "./products.service";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const { categoryId, supplierId, status, search } = req.query;
    const products = await productsService.listProducts({
      categoryId: categoryId ? Number(categoryId) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
      status: status as any,
      search: search as string | undefined,
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

router.get("/search", async (req, res, next) => {
  try {
    const code = String(req.query.code || "");
    const product = await productsService.getProductByCode(code);
    if (!product) return res.status(404).json({ error: "No product found with that code" });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

const discountTypeSchema = z.enum(["NONE", "PERCENTAGE", "FIXED"]);

const createSchema = z.object({
  description: z.string().min(1),
  categoryId: z.coerce.number().int(),
  supplierId: z.coerce.number().int(),
  purchaseDate: z.coerce.date(),
  originalCost: z.coerce.number().positive(),
  profitPercent: z.coerce.number().min(0),
  quantity: z.coerce.number().int().positive(),
  discountType: discountTypeSchema.optional(),
  discountValue: z.coerce.number().min(0).optional(),
});

router.post("/", upload.single("invoiceImage"), async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);
    const invoiceImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const product = await productsService.createProduct({ ...data, invoiceImageUrl });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

const updateSchema = z.object({
  description: z.string().min(1).optional(),
  categoryId: z.coerce.number().int().optional(),
  supplierId: z.coerce.number().int().optional(),
  purchaseDate: z.coerce.date().optional(),
  originalCost: z.coerce.number().positive().optional(),
  profitPercent: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().int().positive().optional(),
  discountType: discountTypeSchema.optional(),
  discountValue: z.coerce.number().min(0).optional(),
});

router.put("/:id", upload.single("invoiceImage"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const data = updateSchema.parse(req.body);
    const invoiceImageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    const product = await productsService.updateProduct(id, {
      ...data,
      ...(invoiceImageUrl ? { invoiceImageUrl } : {}),
    });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await productsService.deleteProduct(id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
