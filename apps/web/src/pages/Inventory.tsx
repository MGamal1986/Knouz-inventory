import { useEffect, useState } from "react";
import { api } from "../api/client";

interface InventoryItem {
  id: number;
  productCode: string;
  description: string;
  category: { name: string };
  supplier: { name: string };
  originalCost: string;
  sellingPrice: string;
  quantity: number;
  quantitySold: number;
  stock: number;
  status: string;
}

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState("");

  function load(searchValue?: string) {
    api
      .get("/api/inventory", { params: searchValue ? { search: searchValue } : {} })
      .then((res) => setItems(res.data));
  }

  useEffect(() => load(), []);

  return (
    <div>
      <h1>Inventory</h1>
      <div className="card">
        <label>Search by product code or description</label>
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            load(e.target.value);
          }}
          placeholder="e.g. RNG-0001"
          style={{ maxWidth: 320 }}
        />
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
              <th>Purchased</th>
              <th>Sold</th>
              <th>Stock</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id}>
                <td>
                  <b>{it.productCode}</b>
                </td>
                <td>{it.description}</td>
                <td>{it.category.name}</td>
                <td>{it.supplier.name}</td>
                <td>{Number(it.originalCost).toFixed(2)}</td>
                <td>{Number(it.sellingPrice).toFixed(2)}</td>
                <td>{it.quantity}</td>
                <td>{it.quantitySold}</td>
                <td>
                  <b>{it.stock}</b>
                </td>
                <td>{it.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
