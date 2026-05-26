import { FormEvent, useState } from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import { api, RegistrationInput } from "@/lib/api";

const emptyUser: RegistrationInput = {
  hostName: "",
  description: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
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
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Host Registration" />
      <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">New Host</p>
          <h1 className="mt-3 text-4xl font-semibold">Create the host profile the backend expects.</h1>
          <p className="mt-3 max-w-2xl text-zinc-300">
            This submits Rails-shaped `user` data to `/api/v1/users` and validates the required fields before the request leaves the browser.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-md border border-white/10 bg-zinc-900 p-5 sm:p-8">
          {message && <p className="mb-5 rounded-md border border-emerald-400/40 bg-emerald-950/40 p-3 text-emerald-100">{message}</p>}
          {errors.submit && <p className="mb-5 rounded-md border border-red-400/40 bg-red-950/40 p-3 text-red-100">{errors.submit}</p>}

          <div className="grid gap-5 md:grid-cols-2">
            {[
              ["hostName", "Host Name"],
              ["firstName", "First Name"],
              ["lastName", "Last Name"],
              ["email", "Email"],
              ["phone", "Phone"],
              ["password", "Password"],
              ["confirmPassword", "Confirm Password"],
            ].map(([name, label]) => (
              <label key={name} className="block text-sm font-medium text-zinc-200" htmlFor={name}>
                {label}
                <input
                  id={name}
                  name={name}
                  type={name.toLowerCase().includes("password") ? "password" : name === "email" ? "email" : "text"}
                  value={user[name as keyof RegistrationInput] || ""}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                />
                {errors[name] && <span className="mt-1 block text-xs text-red-200">{errors[name]}</span>}
              </label>
            ))}

            <label className="block text-sm font-medium text-zinc-200 md:col-span-2" htmlFor="description">
              Host Description
              <textarea
                id="description"
                name="description"
                value={user.description}
                onChange={handleChange}
                rows={4}
                className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-6 rounded-md bg-amber-300 px-5 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? "Registering" : "Register Host"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default RegistrationPage;
