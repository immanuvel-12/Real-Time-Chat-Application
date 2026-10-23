import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

import Navbar from "../components/Navbar.jsx";
import { useAuth } from "../hooks/useAuth.js";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    navigate("/", { replace: true });
  }

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!/^[a-zA-Z0-9_.-]{2,30}$/.test(form.username.trim())) {
      next.username = "2–30 characters; letters, numbers, dots, dashes, underscores.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) next.password = "At least 8 characters.";
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast.success("Account created — welcome!");
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  const fields = [
    { id: "username", label: "Username", type: "text", autoComplete: "username", key: "username" },
    { id: "email", label: "Email", type: "email", autoComplete: "email", key: "email" },
    { id: "password", label: "Password", type: "password", autoComplete: "new-password", key: "password" },
    {
      id: "confirmPassword",
      label: "Confirm password",
      type: "password",
      autoComplete: "new-password",
      key: "confirmPassword",
    },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-jet px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Navbar />
        </div>

        <div className="card-surface p-6 sm:p-8">
          <h1 className="text-xl font-bold text-text-primary">Create your account</h1>
          <p className="mt-1 text-sm text-text-secondary">Join ChatConnect and start chatting in seconds.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {fields.map((f) => (
              <div key={f.id}>
                <label htmlFor={f.id} className="mb-1.5 block text-sm font-medium text-text-primary">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  className="input-field"
                  placeholder={f.key === "confirmPassword" ? "••••••••" : f.key === "password" ? "••••••••" : ""}
                />
                {errors[f.key] && <p className="mt-1 text-xs text-rose">{errors[f.key]}</p>}
              </div>
            ))}

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-cerulean hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
