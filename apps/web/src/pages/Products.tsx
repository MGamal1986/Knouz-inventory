import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Category {
  id: number;
  name: string;
  baseCode: string;
}
interface Supplier {
  id: number;
  name: string;
}
interface Product {
  id: number;
  productCode: string;
  description: string;
  categoryId: number;
  category: Category;
  supplierId: number;
  supplier: Supplier;
  purchaseDate: string;
  originalCost: string;
  profitPercent: string;
  sellingPrice: string;
  quantity: number;
  quantitySold: number;
  invoiceImageUrl?: string;
  status: "IN_STOCK" | "SOLD" | "PARTIALLY_SOLD";
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

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function loadAll() {
    api.get("/api/products").then((res) => setProducts(res.data));
    api.get("/api/categories").then((res) => setCategories(res.data));
    api.get("/api/suppliers").then((res) => setSuppliers(res.data));
  }

  useEffect(loadAll, []);

  const computedSellingPrice =
    form.originalCost && form.profitPercent
      ? (Number(form.originalCost) * (1 + Number(form.profitPercent) / 100)).toFixed(2)
      : "0.00";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

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
      if (editingId) {
        await api.put(`/api/products/${editingId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await api.post("/api/products", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      setForm(emptyForm);
      setInvoiceFile(null);
      setEditingId(null);
      loadAll();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save product");
    }
  }

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      description: p.description,
      categoryId: String(p.categoryId),
      supplierId: String(p.supplierId),
      purchaseDate: p.purchaseDate.slice(0, 10),
      originalCost: p.originalCost,
      profitPercent: p.profitPercent,
      quantity: String(p.quantity),
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setInvoiceFile(null);
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    await api.delete(`/api/products/${id}`);
    loadAll();
  }

  function statusBadge(p: Product) {
    if (p.status === "SOLD") return <span className="badge sold">Sold</span>;
    if (p.status === "PARTIALLY_SOLD") return <span className="badge partial">Partial</span>;
    return <span className="badge in-stock">In Stock</span>;
  }

  return (
    <div>
      <h1>Products</h1>

      <div className="card">
        <h3>{editingId ? `Edit Product` : "Add Product"}</h3>
        <form onSubmit={onSubmit}>
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />

          <label>Category</label>
          <select
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
          </select>

          <label>Supplier</label>
          <select
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
          </select>

          <label>Purchase Date</label>
          <input
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
            required
          />

          <label>Original Cost (EGP)</label>
          <input
            type="number"
            step="0.01"
            value={form.originalCost}
            onChange={(e) => setForm({ ...form, originalCost: e.target.value })}
            required
          />

          <label>Required Profit %</label>
          <input
            type="number"
            step="0.01"
            value={form.profitPercent}
            onChange={(e) => setForm({ ...form, profitPercent: e.target.value })}
            required
          />

          <div style={{ fontSize: 13, color: "#444" }}>
            Selling price (auto): <b>{computedSellingPrice} EGP</b>
          </div>

          <label>Quantity Purchased</label>
          <input
            type="number"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            required
          />

          <label>Invoice Image (photo/scan)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
          />

          {error && <div className="error">{error}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="submit">{editingId ? "Save Changes" : "Add Product"}</button>
            {editingId && (
              <button type="button" className="secondary" onClick={cancelEdit}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Description</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Cost</th>
              <th>Sell Price</th>
              <th>Qty</th>
              <th>Sold</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.productCode}</b>
                </td>
                <td>{p.description}</td>
                <td>{p.category.name}</td>
                <td>{p.supplier.name}</td>
                <td>{Number(p.originalCost).toFixed(2)}</td>
                <td>{Number(p.sellingPrice).toFixed(2)}</td>
                <td>{p.quantity}</td>
                <td>{p.quantitySold}</td>
                <td>{statusBadge(p)}</td>
                <td>
                  <button onClick={() => startEdit(p)}>Edit</button>{" "}
                  <button className="secondary" onClick={() => onDelete(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
