import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Category {
  id: number;
  name: string;
  baseCode: string;
  lastSeq: number;
  _count: { products: number };
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [baseCode, setBaseCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get("/api/categories").then((res) => setCategories(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/categories", { name, baseCode });
      setName("");
      setBaseCode("");
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create category");
    }
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/api/categories/${id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to delete");
    }
  }

  return (
    <div>
      <h1>Categories</h1>

      <div className="card">
        <h3>Add Category</h3>
        <form onSubmit={onSubmit}>
          <label>Category Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Base Code (e.g. RNG)</label>
          <input
            value={baseCode}
            onChange={(e) => setBaseCode(e.target.value.toUpperCase())}
            maxLength={10}
            required
          />
          {error && <div className="error">{error}</div>}
          <button type="submit">Add Category</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Base Code</th>
              <th>Products</th>
              <th>Next Code</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.baseCode}</td>
                <td>{c._count.products}</td>
                <td>
                  {c.baseCode}-{String(c.lastSeq + 1).padStart(4, "0")}
                </td>
                <td>
                  <button className="secondary" onClick={() => onDelete(c.id)}>
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
