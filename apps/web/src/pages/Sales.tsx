import { useEffect, useState } from "react";
import { api } from "../api/client";

interface Client {
  id: number;
  name: string;
  mobile: string;
}
interface Product {
  id: number;
  productCode: string;
  description: string;
  sellingPrice: string;
  quantity: number;
  quantitySold: number;
}
interface LineItem {
  productId: number;
  productCode: string;
  description: string;
  unitPrice: number;
  quantity: number;
  maxStock: number;
}
interface Sale {
  id: number;
  invoiceNumber: string;
  totalAmount: string;
  createdAt: string;
  client: Client;
}

export function Sales() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [clientId, setClientId] = useState("");
  const [productToAdd, setProductToAdd] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  function loadAll() {
    api.get("/api/clients").then((res) => setClients(res.data));
    api.get("/api/products").then((res) => setProducts(res.data));
    api.get("/api/sales").then((res) => setSales(res.data));
  }

  useEffect(loadAll, []);

  function addLineItem() {
    const product = products.find((p) => String(p.id) === productToAdd);
    if (!product) return;
    const maxStock = product.quantity - product.quantitySold;
    if (maxStock <= 0) {
      setError(`${product.productCode} is out of stock`);
      return;
    }
    setError(null);
    setLineItems((prev) => {
      const existing = prev.find((li) => li.productId === product.id);
      if (existing) {
        return prev.map((li) =>
          li.productId === product.id
            ? { ...li, quantity: Math.min(li.quantity + 1, maxStock) }
            : li
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productCode: product.productCode,
          description: product.description,
          unitPrice: Number(product.sellingPrice),
          quantity: 1,
          maxStock,
        },
      ];
    });
    setProductToAdd("");
  }

  function updateQuantity(productId: number, qty: number) {
    setLineItems((prev) =>
      prev.map((li) => (li.productId === productId ? { ...li, quantity: qty } : li))
    );
  }

  function removeLineItem(productId: number) {
    setLineItems((prev) => prev.filter((li) => li.productId !== productId));
  }

  const total = lineItems.reduce((sum, li) => sum + li.unitPrice * li.quantity, 0);

  async function submitSale() {
    setError(null);
    if (!clientId) {
      setError("Please select a client");
      return;
    }
    if (lineItems.length === 0) {
      setError("Add at least one product");
      return;
    }
    try {
      const res = await api.post("/api/sales", {
        clientId: Number(clientId),
        items: lineItems.map((li) => ({ productId: li.productId, quantity: li.quantity })),
      });
      setLineItems([]);
      setClientId("");
      loadAll();
      // Auto-download the generated invoice
      downloadInvoice(res.data.id);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create sale");
    }
  }

  function downloadInvoice(saleId: number) {
    const token = localStorage.getItem("knouz_token");
    const url = `${api.defaults.baseURL}/api/sales/${saleId}/invoice.pdf`;
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `invoice-${saleId}.pdf`;
        link.click();
      });
  }

  return (
    <div>
      <h1>Sales</h1>

      <div className="card">
        <h3>New Sale</h3>

        <label>Client</label>
        <select value={clientId} onChange={(e) => setClientId(e.target.value)} style={{ maxWidth: 320 }}>
          <option value="">Select client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.mobile})
            </option>
          ))}
        </select>

        <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "flex-end" }}>
          <div>
            <label>Add Product</label>
            <select
              value={productToAdd}
              onChange={(e) => setProductToAdd(e.target.value)}
              style={{ minWidth: 280 }}
            >
              <option value="">Select product...</option>
              {products
                .filter((p) => p.quantity - p.quantitySold > 0)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productCode} — {p.description} ({p.quantity - p.quantitySold} in stock)
                  </option>
                ))}
            </select>
          </div>
          <button type="button" onClick={addLineItem}>
            Add
          </button>
        </div>

        {lineItems.length > 0 && (
          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((li) => (
                <tr key={li.productId}>
                  <td>{li.productCode}</td>
                  <td>{li.description}</td>
                  <td>
                    <input
                      type="number"
                      min={1}
                      max={li.maxStock}
                      value={li.quantity}
                      onChange={(e) => updateQuantity(li.productId, Number(e.target.value))}
                      style={{ width: 60 }}
                    />
                  </td>
                  <td>{li.unitPrice.toFixed(2)}</td>
                  <td>{(li.unitPrice * li.quantity).toFixed(2)}</td>
                  <td>
                    <button className="secondary" onClick={() => removeLineItem(li.productId)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 12, fontWeight: 700 }}>Total: {total.toFixed(2)} EGP</div>

        {error && <div className="error">{error}</div>}

        <button style={{ marginTop: 12 }} onClick={submitSale}>
          Complete Sale &amp; Generate Invoice
        </button>
      </div>

      <div className="card">
        <h3>Sales History</h3>
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Client</th>
              <th>Total</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.map((s) => (
              <tr key={s.id}>
                <td>{s.invoiceNumber}</td>
                <td>{s.client.name}</td>
                <td>{Number(s.totalAmount).toFixed(2)}</td>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>
                  <button onClick={() => downloadInvoice(s.id)}>Download PDF</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
