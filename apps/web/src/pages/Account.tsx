import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";

interface Admin {
  id: number;
  username: string;
  fullName?: string;
  isActive: boolean;
  createdAt: string;
}

export function Account() {
  const [admins, setAdmins] = useState<Admin[]>([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const [newUsername, setNewUsername] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserFullName, setNewUserFullName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  function load() {
    api.get("/api/auth/admins").then((res) => setAdmins(res.data));
  }

  useEffect(load, []);

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwMessage(null);
    try {
      await api.post("/api/auth/change-password", { currentPassword, newPassword });
      setPwMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err: any) {
      setPwError(err.response?.data?.error || "Failed to change password");
    }
  }

  async function onAddAdmin(e: FormEvent) {
    e.preventDefault();
    setAddError(null);
    try {
      await api.post("/api/auth/admins", {
        username: newUsername,
        password: newUserPassword,
        fullName: newUserFullName,
      });
      setNewUsername("");
      setNewUserPassword("");
      setNewUserFullName("");
      load();
    } catch (err: any) {
      setAddError(err.response?.data?.error || "Failed to add admin");
    }
  }

  return (
    <div>
      <h1>My Account</h1>

      <div className="card">
        <h3>Change Password</h3>
        <p style={{ fontSize: 13, color: "#666" }}>
          If you're still using the default password (<b>0000</b>), change it now.
        </p>
        <form onSubmit={onChangePassword}>
          <label>Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <label>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={4}
          />
          {pwError && <div className="error">{pwError}</div>}
          {pwMessage && <div style={{ color: "#1c7c3d", fontSize: 13 }}>{pwMessage}</div>}
          <button type="submit">Update Password</button>
        </form>
      </div>

      <div className="card">
        <h3>Add New Admin</h3>
        <form onSubmit={onAddAdmin}>
          <label>Username</label>
          <input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
          <label>Full Name</label>
          <input value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)} />
          <label>Password</label>
          <input
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            required
            minLength={4}
          />
          {addError && <div className="error">{addError}</div>}
          <button type="submit">Add Admin</button>
        </form>
      </div>

      <div className="card">
        <h3>Existing Admins</h3>
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Active</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id}>
                <td>{a.username}</td>
                <td>{a.fullName}</td>
                <td>{a.isActive ? "Yes" : "No"}</td>
                <td>{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
