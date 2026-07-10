import { useEffect, useState, FormEvent } from "react";
import { api } from "../api/client";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { FormField, Input } from "../components/ui/FormField";
import { Table, Thead, Tbody, Tr, Th, Td } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";

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
    <div className="flex flex-col gap-lg">
      <h2 className="text-headline-lg font-headline-lg text-primary">Account</h2>

      <Card className="p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-xs">Change Password</h3>
        <p className="text-body-sm text-on-surface-variant mb-md">
          If you're still using the default password (<b className="text-primary">0000</b>), change it now.
        </p>
        <form onSubmit={onChangePassword} className="flex flex-col gap-md max-w-[420px]">
          <FormField label="Current Password">
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </FormField>
          <FormField label="New Password">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </FormField>
          {pwError && <div className="text-error text-body-sm">{pwError}</div>}
          {pwMessage && <div className="text-success-emerald text-body-sm">{pwMessage}</div>}
          <Button type="submit" className="w-fit">
            Update Password
          </Button>
        </form>
      </Card>

      <Card className="p-lg">
        <h3 className="text-headline-sm font-headline-sm text-primary mb-md">Add New Admin</h3>
        <form onSubmit={onAddAdmin} className="grid grid-cols-1 md:grid-cols-3 gap-lg items-end max-w-[720px]">
          <FormField label="Username">
            <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} required />
          </FormField>
          <FormField label="Full Name">
            <Input value={newUserFullName} onChange={(e) => setNewUserFullName(e.target.value)} />
          </FormField>
          <FormField label="Password">
            <Input
              type="password"
              value={newUserPassword}
              onChange={(e) => setNewUserPassword(e.target.value)}
              required
              minLength={4}
            />
          </FormField>
          {addError && <div className="text-error text-body-sm md:col-span-3">{addError}</div>}
          <Button type="submit" className="md:col-span-3 md:w-fit">
            Add Admin
          </Button>
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <div className="p-lg border-b border-surface-border">
          <h3 className="text-headline-sm font-headline-sm text-primary">Existing Admins</h3>
        </div>
        <Table>
          <Thead>
            <tr>
              <Th>Username</Th>
              <Th>Full Name</Th>
              <Th>Status</Th>
              <Th>Created</Th>
            </tr>
          </Thead>
          <Tbody>
            {admins.map((a) => (
              <Tr key={a.id}>
                <Td className="text-primary font-medium">{a.username}</Td>
                <Td className="text-on-surface-variant">{a.fullName}</Td>
                <Td>
                  <Badge tone={a.isActive ? "success" : "neutral"}>{a.isActive ? "Active" : "Inactive"}</Badge>
                </Td>
                <Td className="text-on-surface-variant">{new Date(a.createdAt).toLocaleDateString()}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Card>
    </div>
  );
}
