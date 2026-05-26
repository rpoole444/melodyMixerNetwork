import Link from "next/link";
import { FormEvent, useState } from "react";
import { useUser } from "@/contexts/UserContext";

const LoginComponent = () => {
  const [email, setEmail] = useState("demo@melody.test");
  const [password, setPassword] = useState("demo123");
  const { login, loginDemo, status, error } = useUser();

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <section className="w-full max-w-md rounded-md border border-white/10 bg-zinc-950/90 p-6 shadow-2xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-300">Host Access</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Sign in to the station desk</h2>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <label className="block text-sm font-medium text-zinc-200" htmlFor="email">
          Email
          <input
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-amber-300"
            id="email"
            type="email"
            placeholder="host@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>

        <label className="block text-sm font-medium text-zinc-200" htmlFor="password">
          Password
          <input
            className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-3 text-white outline-none focus:border-amber-300"
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="rounded-md border border-red-400/40 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
            type="submit"
            disabled={status === "loading"}
          >
            {status === "loading" ? "Signing In" : "Sign In"}
          </button>
          <button
            className="rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300"
            type="button"
            onClick={loginDemo}
          >
            Demo Mode
          </button>
        </div>
      </form>

      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/Registration" className="font-semibold text-amber-200 hover:text-amber-100">
          Register a host
        </Link>
        <Link href="/forgot-password" className="text-zinc-300 hover:text-white">
          Forgot password?
        </Link>
      </div>
    </section>
  );
};

export default LoginComponent;
