import express from "express";
import cors from "cors";
import path from "path";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";

import authRoutes from "./modules/auth/auth.routes";
import categoriesRoutes from "./modules/categories/categories.routes";
import suppliersRoutes from "./modules/suppliers/suppliers.routes";
import productsRoutes from "./modules/products/products.routes";
import clientsRoutes from "./modules/clients/clients.routes";
import salesRoutes from "./modules/sales/sales.routes";
import inventoryRoutes from "./modules/inventory/inventory.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";

export const app = express();

app.use(cors());
app.use(express.json());

// Static file serving for uploaded invoice images and generated invoice PDFs (auth required)
app.use("/uploads", requireAuth, express.static(path.join(process.cwd(), "uploads")));
app.use("/invoices", requireAuth, express.static(path.join(process.cwd(), "invoices")));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/clients", clientsRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.use(errorHandler);
