import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MessageCircle, LoaderCircle } from "lucide-react";

import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from || "/";

  if (user) {
    navigate(from, { replace: true });
  }

  function validate() {
    const next = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Welcome back!");
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not sign in. Is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-jet px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Navbar />
        </div>

        <div className="card-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-text-primary">Sign in</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Welcome back — your conversations are waiting.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-text-primary">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-text-primary">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-rose">{errors.password}</p>}
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            New to ChatConnect?{" "}
            <Link to="/register" className="font-medium text-cerulean hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
