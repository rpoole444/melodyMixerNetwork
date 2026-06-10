import Header from "@/components/Header";
import { api } from "@/lib/api";
import Link from "next/link";
import { FormEvent, useState } from "react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    try {
      await api.requestPasswordReset(email.trim());
      setMessage("Check your email for a password reset link. It will work for four hours.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not send the reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink text-white">
      <Header title="Password Help" />
      <section className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-white/10 bg-ink-soft p-5 sm:p-8">
          <p className="hf-kicker">Studio access</p>
          <h1 className="mt-3 text-4xl">Reset your password.</h1>
          <p className="mt-2 text-paper/50">Enter the email used for your host account.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-paper/80">Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal" /></label>
            {message && <p className="rounded-xl border border-signal/40 bg-signal/10 p-3 text-sm text-[#ffd5c9]">{message}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-signal px-4 py-3 font-semibold text-ink disabled:opacity-60">{isSubmitting ? "Sending..." : "Send Reset Link"}</button>
          </form>
          <Link href="/" className="mt-5 inline-block text-sm text-paper/70 hover:text-white">Back to sign in</Link>
        </div>
      </section>
    </main>
  );
};

export default ForgotPassword;
