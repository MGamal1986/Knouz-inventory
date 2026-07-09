import { Router } from "express";
import path from "path";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import * as salesService from "./sales.service";

const router = Router();
router.use(requireAuth);

router.get("/", async (_req, res, next) => {
  try {
    const sales = await salesService.listSales();
    res.json(sales);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const sale = await salesService.getSaleById(id);
    if (!sale) return res.status(404).json({ error: "Sale not found" });
    res.json(sale);
  } catch (err) {
    next(err);
  }
});

router.get("/:id/invoice.pdf", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const sale = await salesService.getSaleById(id);
    if (!sale || !sale.invoicePdfUrl) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const filePath = path.join(process.cwd(), sale.invoicePdfUrl.replace(/^\//, ""));
    res.download(filePath, `${sale.invoiceNumber}.pdf`);
  } catch (err) {
    next(err);
  }
});

const createSaleSchema = z.object({
  clientId: z.coerce.number().int(),
  items: z
    .array(
      z.object({
        productId: z.coerce.number().int(),
        quantity: z.coerce.number().int().positive(),
      })
    )
    .min(1),
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSaleSchema.parse(req.body);
    const sale = await salesService.createSale(data);
    res.status(201).json(sale);
  } catch (err) {
    next(err);
  }
});

export default router;
