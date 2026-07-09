import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

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

  function load() {
    api.get("/api/clients").then((res) => setClients(res.data));
  }

  useEffect(load, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.post("/api/clients", { name, address, mobile });
    setName("");
    setAddress("");
    setMobile("");
    load();
  }

  async function onDelete(id: number) {
    if (!confirm("Delete this client?")) return;
    await api.delete(`/api/clients/${id}`);
    load();
  }

  return (
    <div>
      <h1>Clients</h1>
      <div className="card">
        <h3>Register Client</h3>
        <form onSubmit={onSubmit}>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
          <label>Address</label>
          <input value={address} onChange={(e) => setAddress(e.target.value)} />
          <label>Mobile Number</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} required />
          <button type="submit">Add Client</button>
        </form>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Mobile</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.address}</td>
                <td>{c.mobile}</td>
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
