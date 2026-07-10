import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Avatar } from "../components/ui/Avatar";
import { FormField, Input } from "../components/ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { downloadCsv } from "../utils/csv";

interface Client {
  id: number;
  name: string;
  address?: string;
  mobile: string;
}

export function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [mobile, setMobile] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  function load() {
    api.get("/api/clients").then((res) => setClients(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      await api.put(`/api/clients/${editingId}`, { name, address, mobile });
    } else {
      await api.post("/api/clients", { name, address, mobile });
    }
    cancelEdit();
    load();
  }

  function startEdit(c: Client) {
    setEditingId(c.id);
    setName(c.name);
    setAddress(c.address || "");
    setMobile(c.mobile);
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setAddress("");
    setMobile("");
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this client?")) return;
    await api.delete(`/api/clients/${id}`);
    load();
  }

  function onExport() {
    downloadCsv(
      "clients.csv",
      ["Name", "Mobile", "Address"],
      clients.map((c) => [c.name, c.mobile, c.address || ""])
    );
  }

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex items-start justify-between gap-md">
        <div>
          <h2 className="text-headline-lg font-headline-lg text-primary">Client Directory</h2>
          <p className="text-body-md font-body-md text-on-surface-variant mt-xs">
            Manage your returning jewelry buyers and their purchase history.
          </p>
        </div>
        <Button variant="ghost" onClick={onExport} className="shrink-0">
          <Icon name="download" className="text-[18px]" />
          Export CSV
        </Button>
      </div>

      <Card className="p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">
          {editingId ? "Edit Client" : "Add Client"}
        </h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end">
          <FormField label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Address">
            <Input value={address} onChange={(e) => setAddress(e.target.value)} />
          </FormField>
          <FormField label="Mobile Number">
            <Input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          </FormField>
          <div className="md:col-span-3 flex gap-sm">
            <Button type="submit" className="w-fit">
              <Icon name={editingId ? "save" : "person_add"} />
              {editingId ? "Save Changes" : "Add Client"}
            </Button>
            {editingId && (
              <Button type="button" variant="ghost" className="w-fit" onClick={cancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <Table>
          <Thead>
            <tr>
              <Th>Client Name</Th>
              <Th>Mobile Number</Th>
              <Th>Address</Th>
              <Th className="w-16 text-center">Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {clients.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <div className="flex items-center gap-md">
                    <Avatar name={c.name} tone="gold" className="w-10 h-10" />
                    <p className="text-body-md font-body-md text-primary font-medium">{c.name}</p>
                  </div>
                </Td>
                <Td className="text-on-background">{c.mobile}</Td>
                <Td className="text-on-surface-variant">{c.address}</Td>
                <Td className="text-center">
                  <div className="flex items-center justify-center gap-sm">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      className="text-on-surface-variant hover:text-primary"
                      aria-label="Edit client"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className="text-on-surface-variant hover:text-error"
                      aria-label="Delete client"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        <div className="px-lg py-md border-t border-surface-border text-body-sm text-on-surface-variant">
          Showing {clients.length} client{clients.length === 1 ? "" : "s"}
        </div>
      </Card>
    </div>
  );
}
