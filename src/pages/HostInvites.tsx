import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { api, HostInvitationRecord } from "@/lib/api";
import { FormEvent, useEffect, useState } from "react";

const HostInvites = () => {
  const { user } = useUser();
  const [invitations, setInvitations] = useState<HostInvitationRecord[]>([]);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") return;
    loadInvitations();
  }, [user?.role]);

  const loadInvitations = async () => {
    setMessage("Loading invites...");

    try {
      setInvitations(await api.listHostInvitations());
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load invites.");
    }
  };

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const invitation = await api.createHostInvitation({
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        expiresAt: expiresAt || undefined,
      });
      setInvitations((current) => [invitation, ...current]);
      setEmail("");
      setNotes("");
      setExpiresAt("");
      setMessage(`Invite created: ${invitation.code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create invite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInvite = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setMessage(`Copied invite code ${code}.`);
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <Header title="Host Invites" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {user?.role !== "admin" ? (
          <div className="rounded-md border border-amber-300/40 bg-amber-950/30 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Admin Area</p>
            <h1 className="mt-3 text-3xl font-semibold">Host invites are for admins.</h1>
            <p className="mt-3 max-w-2xl text-zinc-300">Registration is invite-only while the station is in private alpha.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-300">Private Alpha</p>
                <h1 className="mt-3 text-4xl font-semibold">Invite trusted hosts.</h1>
                <p className="mt-3 max-w-3xl text-zinc-300">
                  Create one-time invite codes for local musicians, DJs, and music lovers you want testing the show builder.
                </p>
              </div>
              <button type="button" onClick={loadInvitations} className="w-fit rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300">
                Refresh Invites
              </button>
            </div>

            {message && <p className="mt-6 rounded-md border border-amber-300/40 bg-amber-950/40 p-3 text-sm text-amber-100">{message}</p>}

            <form onSubmit={createInvitation} className="mt-8 grid gap-4 rounded-md border border-white/10 bg-zinc-900 p-5 md:grid-cols-3">
              <label className="block text-sm font-medium text-zinc-200" htmlFor="invite-email">
                Email Restriction
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Optional"
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="invite-expires">
                Expires At
                <input
                  id="invite-expires"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                />
              </label>
              <label className="block text-sm font-medium text-zinc-200" htmlFor="invite-notes">
                Notes
                <input
                  id="invite-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Show idea, host name, or context"
                  className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-3 text-white outline-none focus:border-amber-300"
                />
              </label>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-md bg-amber-300 px-4 py-3 font-semibold text-zinc-950 hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70 md:col-span-3"
              >
                {isSubmitting ? "Creating Invite" : "Create Invite Code"}
              </button>
            </form>

            <section className="mt-8 rounded-md border border-white/10 bg-zinc-900">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-xl font-semibold">Invite Codes</h2>
                <p className="mt-1 text-sm text-zinc-400">Active codes can be used once. Email-restricted codes must match the registration email.</p>
              </div>
              <div className="divide-y divide-white/10">
                {invitations.length === 0 ? (
                  <p className="p-5 text-sm text-zinc-400">No invites yet.</p>
                ) : (
                  invitations.map((invitation) => (
                    <article key={invitation.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                      <div>
                        <p className="font-mono text-2xl font-semibold text-amber-200">{invitation.code}</p>
                        <p className="mt-2 text-sm text-zinc-400">
                          {invitation.email || "Any email"} - {invitation.status}
                          {invitation.expires_at ? ` - expires ${new Date(invitation.expires_at).toLocaleString()}` : ""}
                        </p>
                        {invitation.notes && <p className="mt-2 text-sm text-zinc-300">{invitation.notes}</p>}
                        {invitation.used_by && <p className="mt-2 text-sm text-zinc-400">Used by {invitation.used_by}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => copyInvite(invitation.code)}
                        disabled={invitation.status !== "active"}
                        className="h-fit rounded-md border border-white/15 px-4 py-3 font-semibold text-white hover:border-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Copy Code
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default HostInvites;
