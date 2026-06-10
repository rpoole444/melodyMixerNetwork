import Link from "next/link";
import { FormEvent, useState } from "react";
import { useUser } from "@/contexts/UserContext";
import { BRAND } from "@/lib/brand";

const LoginComponent = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, status, error } = useUser();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <section className="hf-panel w-full max-w-md p-6 sm:p-8">
      <div className="mb-6">
        <p className="hf-kicker">Studio Access</p>
        <h2 className="mt-3 font-display text-3xl text-cream">Enter the broadcast studio.</h2>
        <p className="mt-2 text-sm text-paper/55">{BRAND.tagline}. Your shows, library, and station tools live here.</p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block text-sm font-semibold text-paper/80" htmlFor="email">
          Email
          <input
            className="hf-input"
            id="email"
            type="email"
            placeholder="host@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-semibold text-paper/80" htmlFor="password">
          Password
          <input
            className="hf-input"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="rounded-xl border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}

        <div>
          <button
            className="hf-button-primary w-full"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Signing In" : "Sign In"}
          </button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/Registration" className="font-semibold text-signal hover:text-[#ff9a82]">
          Register a host
        </Link>
        <Link href="/forgot-password" className="text-paper/60 hover:text-cream">
          Forgot password?
        </Link>
      </div>
    </section>
  );
};

export default LoginComponent;
