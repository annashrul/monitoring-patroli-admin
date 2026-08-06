import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { getErrorMessage } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Shield } from "lucide-react";

export default function Login() {
  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedUser = await login(username.trim(), password);
      if (loggedUser.role !== "admin") {
        logout();
        setError("Akun ini bukan admin. Web admin hanya untuk role admin.");
        return;
      }
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login gagal. Periksa koneksi ke server."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brutal-bg flex items-center justify-center p-5">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brutal-accent shadow-lg mb-4">
            <Shield className="w-7 h-7 text-brutal-black" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Patroli Satpam</h1>
          <p className="text-sm text-brutal-muted">Masuk ke dashboard admin</p>
        </div>

        <Card className="shadow-lg border-brutal-zinc">
          <CardContent className="p-6">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  autoFocus
                  placeholder="Masukkan username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Masukkan password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Memproses..." : "Masuk"}
              </Button>
            </form>

            <p className="text-center text-xs text-brutal-muted mt-6">
              Sistem Monitoring Patroli Satpam v1.0
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
