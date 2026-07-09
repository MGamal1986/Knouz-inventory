import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Category {
  id: number;
  name: string;
  baseCode: string;
  codeRangeStart: number;
  codeRangeEnd: number;
  lastSeq: number;
  _count: { products: number };
}

export function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [baseCode, setBaseCode] = useState("");
  const [codeRangeStart, setCodeRangeStart] = useState("");
  const [codeRangeEnd, setCodeRangeEnd] = useState("");
  const [error, setError] = useState<string | null>(null);

  function load() {
    api.get("/api/categories").then((res) => setCategories(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/api/categories", {
        name,
        baseCode,
        codeRangeStart: Number(codeRangeStart),
        codeRangeEnd: Number(codeRangeEnd),
      });
      setName("");
      setBaseCode("");
      setCodeRangeStart("");
      setCodeRangeEnd("");
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
          <label>Start Code</label>
          <input
            type="number"
            min={1}
            value={codeRangeStart}
            onChange={(e) => setCodeRangeStart(e.target.value)}
            required
          />
          <label>End Code</label>
          <input
            type="number"
            min={1}
            value={codeRangeEnd}
            onChange={(e) => setCodeRangeEnd(e.target.value)}
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
              <th>Code Range</th>
              <th>Products</th>
              <th>Next Code</th>
              <th>Remaining</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => {
              const padLength = String(c.codeRangeEnd).length;
              const nextSeq = c.lastSeq + 1;
              const remaining = c.codeRangeEnd - c.lastSeq;
              return (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.baseCode}</td>
                <td>
                  {c.codeRangeStart}–{c.codeRangeEnd}
                </td>
                <td>{c._count.products}</td>
                <td>
                  {remaining > 0
                    ? `${c.baseCode}-${String(nextSeq).padStart(padLength, "0")}`
                    : "—"}
                </td>
                <td>{remaining > 0 ? remaining : "Exhausted"}</td>
                <td>
                  <button className="secondary" onClick={() => onDelete(c.id)}>
                    Delete
                  </button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
