import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { FormField, Input } from "../components/ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { downloadCsv } from "../utils/csv";

interface Supplier {
  id: number;
  name: string;
  phone?: string;
  address?: string;
}

export function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  function load() {
    api.get("/api/suppliers").then((res) => setSuppliers(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      await api.put(`/api/suppliers/${editingId}`, { name, phone, address });
    } else {
      await api.post("/api/suppliers", { name, phone, address });
    }
    cancelEdit();
    load();
  }

  function startEdit(s: Supplier) {
    setEditingId(s.id);
    setName(s.name);
    setPhone(s.phone || "");
    setAddress(s.address || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setPhone("");
    setAddress("");
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this supplier?")) return;
    await api.delete(`/api/suppliers/${id}`);
    load();
  }

  function onExport() {
    downloadCsv(
      "suppliers.csv",
      ["Name", "Phone", "Address"],
      suppliers.map((s) => [s.name, s.phone || "", s.address || ""])
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-headline-lg font-headline-lg text-primary">Suppliers</h2>
        <Button variant="ghost" onClick={onExport}>
          <Icon name="download" className="text-[18px]" />
          Export CSV
        </Button>
      </div>

      <Card className="p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">
          {editingId ? "Edit Supplier" : "Add Supplier"}
        </h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end">
          <FormField label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Phone">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
          <FormField label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
          <div className="md:col-span-3 flex gap-sm">
            <Button type="submit" className="w-fit">
              {editingId ? "Save Changes" : "Add Supplier"}
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
              <Th>Phone</Th>
              <Th>Address</Th>
              <Th className="w-16" />
            </tr>
          </Thead>
          <Tbody>
            {suppliers.map((s) => (
              <Tr key={s.id}>
                <Td className="text-primary font-medium">{s.name}</Td>
                <Td className="text-on-surface-variant">{s.phone}</Td>
                <Td className="text-on-surface-variant">{s.address}</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-sm">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="text-on-surface-variant hover:text-primary"
                      aria-label="Edit supplier"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(s.id)}
                      className="text-on-surface-variant hover:text-error"
                      aria-label="Delete supplier"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
