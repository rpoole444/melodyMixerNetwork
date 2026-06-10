import Header from "@/components/Header";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";

const ResetPassword = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [complete, setComplete] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password.length < 8) {
      setMessage("Use at least 8 characters.");
      return;
    }
    if (password !== confirmation) {
      setMessage("The passwords do not match.");
      return;
    }

    const token = String(router.query.token || "");
    const email = String(router.query.email || "");
    if (!token || !email) {
      setMessage("This reset link is incomplete. Request a new one.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.resetPassword(token, email, password, confirmation);
      setComplete(true);
      setMessage("Your password has been reset. You can sign in now.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not reset the password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink text-white">
      <Header title="Choose Password" />
      <section className="mx-auto w-full max-w-lg px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-white/10 bg-ink-soft p-5 sm:p-8">
          <p className="hf-kicker">Studio access</p>
          <h1 className="mt-3 text-4xl">Choose a new password.</h1>
          {!complete && (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <label className="block text-sm font-medium text-paper/80">New Password<input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal" /></label>
              <label className="block text-sm font-medium text-paper/80">Confirm Password<input type="password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal" /></label>
              <button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-signal px-4 py-3 font-semibold text-ink disabled:opacity-60">{isSubmitting ? "Resetting..." : "Reset Password"}</button>
            </form>
          )}
          {message && <p className="mt-5 rounded-xl border border-signal/40 bg-signal/10 p-3 text-sm text-[#ffd5c9]">{message}</p>}
          <Link href={complete ? "/" : "/forgot-password"} className="mt-5 inline-block text-sm font-semibold text-[#ff9a82]">{complete ? "Go to sign in" : "Request a new link"}</Link>
        </div>
      </section>
    </main>
  );
};

export default ResetPassword;
