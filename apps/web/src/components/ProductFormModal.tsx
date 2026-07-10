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
export interface EditableProduct {
  id: number;
  description: string;
  categoryId: number;
  supplierId: number;
  purchaseDate: string;
  originalCost: string;
  profitPercent: string;
  quantity: number;
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
  profitPercent: "20",
  quantity: "1",
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
          profitPercent: editingProduct.profitPercent,
          quantity: String(editingProduct.quantity),
        }
      : emptyForm
  );
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const computedSellingPrice =
    form.originalCost && form.profitPercent
      ? (Number(form.originalCost) * (1 + Number(form.profitPercent) / 100)).toFixed(2)
      : "0.00";

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
    fd.append("profitPercent", form.profitPercent);
    fd.append("quantity", form.quantity);
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

          <FormField label="Required Profit %">
            <Input
              type="number"
              step="0.01"
              value={form.profitPercent}
              onChange={(e) => setForm({ ...form, profitPercent: e.target.value })}
              required
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Selling Price (Calculated)">
              <Input readOnly value={`EGP ${computedSellingPrice}`} className="cursor-not-allowed" />
            </FormField>
          </div>
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
