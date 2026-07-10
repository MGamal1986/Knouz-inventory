import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { FormField, Input } from "../components/ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";

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
  const [editingId, setEditingId] = useState<number | null>(null);

  function load() {
    api.get("/api/categories").then((res) => setCategories(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (editingId) {
        // Base code / code range are locked once a category exists, so only
        // `name` is ever sent — the API silently ignores the other fields anyway.
        await api.put(`/api/categories/${editingId}`, { name });
      } else {
        await api.post("/api/categories", {
          name,
          baseCode,
          codeRangeStart: Number(codeRangeStart),
          codeRangeEnd: Number(codeRangeEnd),
        });
      }
      cancelEdit();
      load();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save category");
    }
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setError(null);
    setName(c.name);
    setBaseCode(c.baseCode);
    setCodeRangeStart(String(c.codeRangeStart));
    setCodeRangeEnd(String(c.codeRangeEnd));
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
    setName("");
    setBaseCode("");
    setCodeRangeStart("");
    setCodeRangeEnd("");
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
    <div className="flex flex-col gap-lg">
      <h2 className="text-headline-lg font-headline-lg text-primary">Categories</h2>

      <Card className="p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">
          {editingId ? "Edit Category" : "Add Category"}
        </h3>
        {editingId && (
          <p className="text-body-sm text-on-surface-variant mb-md -mt-sm">
            Base code and code range are locked once a category exists (protects product code history) — only the
            name can be changed.
          </p>
        )}
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-lg items-end">
          <FormField label="Category Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Base Code (e.g. RNG)">
            <Input
              value={baseCode}
              onChange={(e) => setBaseCode(e.target.value.toUpperCase())}
              maxLength={10}
              required
              disabled={!!editingId}
            />
          </FormField>
          <FormField label="Start Code">
            <Input
              type="number"
              min={1}
              value={codeRangeStart}
              onChange={(e) => setCodeRangeStart(e.target.value)}
              required
              disabled={!!editingId}
            />
          </FormField>
          <FormField label="End Code">
            <Input
              type="number"
              min={1}
              value={codeRangeEnd}
              onChange={(e) => setCodeRangeEnd(e.target.value)}
              required
              disabled={!!editingId}
            />
          </FormField>
          {error && <div className="text-error text-body-sm md:col-span-4">{error}</div>}
          <div className="md:col-span-4 flex gap-sm">
            <Button type="submit" className="w-fit">
              {editingId ? "Save Changes" : "Add Category"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" className="w-fit" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card>
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Base Code</Th>
              <Th>Code Range</Th>
              <Th>Products</Th>
              <Th>Next Code</Th>
              <Th>Remaining</Th>
              <Th className="w-10" />
            </tr>
          </Thead>
          <Tbody>
            {categories.map((c) => {
              const padLength = String(c.codeRangeEnd).length;
              const nextSeq = c.lastSeq + 1;
              const remaining = c.codeRangeEnd - c.lastSeq;
              return (
                <Tr key={c.id}>
                  <Td className="text-primary font-medium">{c.name}</Td>
                  <Td className="text-code-label font-code-label text-primary">{c.baseCode}</Td>
                  <Td className="text-on-surface-variant">
                    {c.codeRangeStart}–{c.codeRangeEnd}
                  </Td>
                  <Td className="text-on-surface-variant">{c._count.products}</Td>
                  <Td className="text-code-label font-code-label text-primary">
                    {remaining > 0 ? `${c.baseCode}-${String(nextSeq).padStart(padLength, "0")}` : "—"}
                  </Td>
                  <Td className="text-on-surface-variant">{remaining > 0 ? remaining : "Exhausted"}</Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-sm">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-on-surface-variant hover:text-primary"
                        aria-label="Edit category"
                      >
                        <Icon name="edit" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
                        className="text-on-surface-variant hover:text-error"
                        aria-label="Delete category"
                      >
                        <Icon name="delete" />
                      </button>
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
