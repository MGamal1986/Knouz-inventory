import { useState, FormEvent } from "react";
import { api } from "../api/client";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { FormField, Input, Select, Textarea } from "./ui/FormField";
import { Icon } from "./ui/Icon";

interface Category {
  id: number;
  name: string;
  baseCode: string;
}
interface Supplier {
  id: number;
  name: string;
}
export type DiscountType = "NONE" | "PERCENTAGE" | "FIXED";

export interface EditableProduct {
  id: number;
  description: string;
  categoryId: number;
  supplierId: number;
  purchaseDate: string;
  originalCost: string;
  sellingPrice: string;
  quantity: number;
  discountType: DiscountType;
  discountValue: string;
}

interface ProductFormModalProps {
  categories: Category[];
  suppliers: Supplier[];
  editingProduct: EditableProduct | null;
  onClose: () => void;
  onSaved: () => void;
}

const emptyForm = {
  description: "",
  categoryId: "",
  supplierId: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  originalCost: "",
  sellingPrice: "",
  quantity: "1",
  discountType: "NONE" as DiscountType,
  discountValue: "0",
};

export function ProductFormModal({ categories, suppliers, editingProduct, onClose, onSaved }: ProductFormModalProps) {
  const [form, setForm] = useState(
    editingProduct
      ? {
          description: editingProduct.description,
          categoryId: String(editingProduct.categoryId),
          supplierId: String(editingProduct.supplierId),
          purchaseDate: editingProduct.purchaseDate.slice(0, 10),
          originalCost: editingProduct.originalCost,
          sellingPrice: editingProduct.sellingPrice,
          quantity: String(editingProduct.quantity),
          discountType: editingProduct.discountType,
          discountValue: editingProduct.discountValue,
        }
      : emptyForm
  );
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const computedProfitPercent =
    form.originalCost && form.sellingPrice && Number(form.originalCost) > 0
      ? ((Number(form.sellingPrice) / Number(form.originalCost) - 1) * 100).toFixed(2)
      : "0.00";

  const discountedPrice = (() => {
    const price = Number(form.sellingPrice) || 0;
    const value = Number(form.discountValue) || 0;
    if (form.discountType === "PERCENTAGE") return Math.max(0, price * (1 - value / 100));
    if (form.discountType === "FIXED") return Math.max(0, price - value);
    return price;
  })();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const fd = new FormData();
    fd.append("description", form.description);
    fd.append("categoryId", form.categoryId);
    fd.append("supplierId", form.supplierId);
    fd.append("purchaseDate", form.purchaseDate);
    fd.append("originalCost", form.originalCost);
    fd.append("profitPercent", computedProfitPercent);
    fd.append("quantity", form.quantity);
    fd.append("discountType", form.discountType);
    fd.append("discountValue", form.discountType === "NONE" ? "0" : form.discountValue || "0");
    if (invoiceFile) fd.append("invoiceImage", invoiceFile);

    try {
      if (editingProduct) {
        await api.put(`/api/products/${editingProduct.id}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      onSaved();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={editingProduct ? "Edit Product" : "Add New Product"}
      onClose={onClose}
      footer={
        <>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="product-form" disabled={submitting}>
            {editingProduct ? "Save Changes" : "Add Product"}
          </Button>
        </>
      }
    >
      <form id="product-form" onSubmit={onSubmit} className="space-y-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          <div className="md:col-span-2">
            <FormField label="Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </FormField>
          </div>

          <FormField label="Category">
            <Select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              required
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.baseCode})
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Supplier">
            <Select
              value={form.supplierId}
              onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
              required
            >
              <option value="">Select supplier...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Purchase Date">
            <Input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Quantity Purchased">
            <Input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Original Cost (EGP)">
            <Input
              type="number"
              step="0.01"
              value={form.originalCost}
              onChange={(e) => setForm({ ...form, originalCost: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Selling Price (EGP)">
            <Input
              type="number"
              step="0.01"
              value={form.sellingPrice}
              onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Profit % (Calculated)">
            <Input readOnly value={`${computedProfitPercent}%`} className="cursor-not-allowed" />
          </FormField>

          <div />

          <FormField label="Discount Type">
            <Select
              value={form.discountType}
              onChange={(e) =>
                setForm({ ...form, discountType: e.target.value as DiscountType, discountValue: "0" })
              }
            >
              <option value="NONE">No discount</option>
              <option value="PERCENTAGE">Percentage (%)</option>
              <option value="FIXED">Fixed amount (EGP)</option>
            </Select>
          </FormField>

          {form.discountType !== "NONE" && (
            <FormField label={form.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount (EGP)"}>
              <Input
                type="number"
                step="0.01"
                min="0"
                max={form.discountType === "PERCENTAGE" ? "100" : undefined}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
              />
            </FormField>
          )}

          {form.discountType !== "NONE" && (
            <div className="md:col-span-2">
              <FormField label="Price After Discount">
                <Input
                  readOnly
                  value={`EGP ${discountedPrice.toFixed(2)}`}
                  className="cursor-not-allowed text-success-emerald font-medium"
                />
              </FormField>
            </div>
          )}
        </div>

        <FormField label="Invoice Upload">
          <label className="border-2 border-dashed border-surface-border rounded-xl p-xl flex flex-col items-center justify-center gap-sm bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer">
            <Icon name="cloud_upload" className="text-artisan-gold text-[32px]" />
            <p className="text-body-sm text-on-surface-variant">
              {invoiceFile ? invoiceFile.name : "Drag and drop invoice images or "}
              {!invoiceFile && <span className="text-artisan-gold font-semibold">browse</span>}
            </p>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
            />
          </label>
        </FormField>

        {error && <div className="text-error text-body-sm">{error}</div>}
      </form>
    </Modal>
  );
}
