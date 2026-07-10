import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Icon } from "../components/ui/Icon";
import { Input, Label } from "../components/ui/FormField";
import { Button } from "../components/ui/Button";

export function Login() {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await login(username, password);
      const redirect = searchParams.get("redirect");
      const isSafeRedirect = !!redirect && redirect.startsWith("/") && !redirect.startsWith("//");
      navigate(isSafeRedirect ? redirect : "/");
    } catch (err: any) {
      setError(err.response?.data?.error || "Login failed");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background px-md">
      <div className="w-full max-w-[380px] bg-surface-container-lowest border border-surface-border rounded-xl shadow-sm p-xl">
        <div className="flex items-center gap-md mb-lg">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center border border-surface-border shrink-0">
            <Icon name="diamond" filled className="text-primary text-[20px]" />
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-bold text-primary">Knouz</h1>
            <p className="text-body-sm font-body-sm text-on-surface-variant">Artisan Utility</p>
          </div>
        </div>

        <p className="text-body-sm font-body-sm text-on-surface-variant mb-lg">
          Default login: <b className="text-primary">admin</b> / <b className="text-primary">0000</b> — change
          this after first login.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-md">
          <div>
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <div className="text-error text-body-sm">{error}</div>}
          <Button type="submit" variant="primary" className="w-full mt-sm">
            Log in
          </Button>
        </form>
      </div>
    </div>
  );
}
