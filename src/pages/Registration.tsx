import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import { api, RegistrationInput } from "@/lib/api";
import { BRAND } from "@/lib/brand";

const emptyUser: RegistrationInput = {
  hostName: "",
  description: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  inviteCode: "",
};

const RegistrationPage = () => {
  const [user, setUser] = useState<RegistrationInput>(emptyUser);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUser((current) => ({ ...current, [name]: value }));
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};

    if (!user.hostName.trim()) nextErrors.hostName = "Host name is required.";
    if (!user.firstName.trim()) nextErrors.firstName = "First name is required.";
    if (!user.lastName.trim()) nextErrors.lastName = "Last name is required.";
    if (!user.email.includes("@")) nextErrors.email = "Enter a valid email.";
    if (!user.inviteCode.trim()) nextErrors.inviteCode = "Invite code is required.";
    if (user.password.length < 6) nextErrors.password = "Password must be at least 6 characters.";
    if (user.password !== user.confirmPassword) nextErrors.confirmPassword = "Passwords do not match.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      await api.register(user);
      setMessage("Host registration saved. Redirecting to sign in.");
      setTimeout(() => router.push("/"), 1200);
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : "Registration failed." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-ink text-white">
      <Header title="Host Registration" />
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="hf-kicker">New voice on the dial</p>
          <h1 className="mt-3 text-5xl">Create your Human Frequency profile.</h1>
          <p className="mt-3 max-w-2xl text-paper/70">
            {BRAND.name} is invite-only while the host community takes shape. Use the code sent by a station admin.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-white/10 bg-ink-soft p-5 sm:p-8">
          {message && <p className="mb-5 rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-3 text-emerald-100">{message}</p>}
          {errors.submit && <p className="mb-5 rounded-xl border border-red-400/40 bg-red-950/40 p-3 text-red-100">{errors.submit}</p>}

          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["hostName", "Host Name"],
              ["firstName", "First Name"],
              ["lastName", "Last Name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["inviteCode", "Invite Code"],
              ["password", "Password"],
              ["confirmPassword", "Confirm Password"],
            ].map(([name, label]) => (
              <label key={name} className="block text-sm font-medium text-paper/80" htmlFor={name}>
                {label}
                <input
                  id={name}
                  name={name}
                  type={name.toLowerCase().includes("password") ? "password" : name === "email" ? "email" : "text"}
                  value={user[name as keyof RegistrationInput] || ""}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal"
                />
                {errors[name] && <span className="mt-1 block text-xs text-red-200">{errors[name]}</span>}
              </label>
            ))}

            <label className="block text-sm font-medium text-paper/80 md:col-span-2" htmlFor="description">
              Host Description
              <textarea
                id="description"
                name="description"
                value={user.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white outline-none focus:border-signal"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 rounded-xl bg-signal px-5 py-3 font-semibold text-ink hover:bg-[#ff7658] disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Registering" : "Register Host"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default RegistrationPage;
