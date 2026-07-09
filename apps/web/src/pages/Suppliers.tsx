import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

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

  function load() {
    api.get("/api/suppliers").then((res) => setSuppliers(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/api/suppliers", { name, phone, address });
    setName("");
    setPhone("");
    setAddress("");
    load();
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this supplier?")) return;
    await api.delete(`/api/suppliers/${id}`);
    load();
  }

  return (
    <div>
      <h1>Suppliers</h1>
      <div className="card">
        <h3>Add Supplier</h3>
        <form onSubmit={onSubmit}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
          <button type="submit">Add Supplier</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.phone}</td>
                <td>{s.address}</td>
                <td>
                  <button className="secondary" onClick={() => onDelete(s.id)}>
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
