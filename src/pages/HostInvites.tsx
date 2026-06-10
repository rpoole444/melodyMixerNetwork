import Header from "@/components/Header";
import { useUser } from "@/contexts/UserContext";
import { api, HostInvitationRecord, StationHostRecord } from "@/lib/api";
import { formatStationDateTime, STATION_TIME_LABEL, stationInputToIso } from "@/lib/stationTime";
import { BRAND } from "@/lib/brand";
import { FormEvent, useEffect, useMemo, useState } from "react";

const HostInvites = () => {
  const { user } = useUser();
  const [hosts, setHosts] = useState<StationHostRecord[]>([]);
  const [invitations, setInvitations] = useState<HostInvitationRecord[]>([]);
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadTeam = async () => {
    setMessage("Loading the host team...");
    try {
      const [nextHosts, nextInvitations] = await Promise.all([api.listStationHosts(), api.listHostInvitations()]);
      setHosts(nextHosts);
      setInvitations(nextInvitations);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load the host team.");
    }
  };

  useEffect(() => {
    if (user?.role === "admin") loadTeam();
  }, [user?.role]);

  const activeHosts = useMemo(() => hosts.filter((host) => host.account_status === "active").length, [hosts]);

  const createInvitation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyId(0);
    try {
      const invitation = await api.createHostInvitation({
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        expiresAt: expiresAt ? stationInputToIso(expiresAt) : undefined,
      });
      setInvitations((current) => [invitation, ...current]);
      setEmail("");
      setNotes("");
      setExpiresAt("");
      setMessage(`Invite ready for ${invitation.email || "your new host"}: ${invitation.code}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not create the invitation.");
    } finally {
      setBusyId(null);
    }
  };

  const updateHostStatus = async (host: StationHostRecord) => {
    const nextStatus = host.account_status === "active" ? "suspended" : "active";
    setBusyId(host.id);
    try {
      const updated = await api.setHostStatus(host.id, nextStatus);
      setHosts((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(nextStatus === "active" ? `${host.host_name || host.first_name} can sign in again.` : `${host.host_name || host.first_name}'s access is paused. Their work is preserved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update host access.");
    } finally {
      setBusyId(null);
    }
  };

  const revokeInvite = async (invitation: HostInvitationRecord) => {
    setBusyId(-invitation.id);
    try {
      const updated = await api.revokeHostInvitation(invitation.id);
      setInvitations((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setMessage(`Invite ${invitation.code} was revoked.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not revoke the invitation.");
    } finally {
      setBusyId(null);
    }
  };

  const copyInviteMessage = async (invitation: HostInvitationRecord) => {
    const registrationUrl = `${window.location.origin}/Registration`;
    const recipient = invitation.email ? `Hi,\n\n` : "";
    const note = invitation.notes ? `\n\nShow idea / station note:\n${invitation.notes}` : "";
    const expiration = invitation.expires_at ? `\n\nThis code expires ${formatStationDateTime(invitation.expires_at)}.` : "";
    const message = `${recipient}You’re invited to host a show on ${BRAND.name} — ${BRAND.tagline.toLowerCase()}, presented by Alpine Groove Guide.\n\nRegister here: ${registrationUrl}\nInvite code: ${invitation.code}${expiration}${note}`;

    await navigator.clipboard.writeText(message);
    setMessage(`Invite message copied for ${invitation.email || "your new host"}. Paste it into your email or text app.`);
  };

  return (
    <main className="min-h-screen bg-ink text-white">
      <Header title="Host Team" />
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        {user?.role !== "admin" ? (
          <div className="rounded-xl border border-signal/40 bg-signal/30 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-signal">Admin Area</p>
            <h1 className="mt-3 text-3xl font-semibold">Host management is for station admins.</h1>
          </div>
        ) : (
          <>
            <div>
              <p className="hf-kicker">Human Frequency people</p>
              <h1 className="mt-3 text-5xl">Build a trusted host circle.</h1>
              <p className="mt-3 max-w-2xl text-paper/60">Invite musicians, selectors, bandleaders, and listeners with something worth sharing.</p>
              <p className="mt-3 max-w-3xl text-paper/70">Invite musicians and selectors, see what they have created, and pause access without deleting their work.</p>
            </div>

            {message && <p className="mt-6 rounded-xl border border-signal/40 bg-signal/10 p-3 text-sm text-[#ffd5c9]">{message}</p>}

            <section className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-ink-soft p-5"><p className="text-sm text-paper/50">Active Hosts</p><p className="mt-2 text-3xl font-semibold">{activeHosts}</p></div>
              <div className="rounded-xl border border-white/10 bg-ink-soft p-5"><p className="text-sm text-paper/50">Paused Hosts</p><p className="mt-2 text-3xl font-semibold">{hosts.length - activeHosts}</p></div>
              <div className="rounded-xl border border-white/10 bg-ink-soft p-5"><p className="text-sm text-paper/50">Open Invites</p><p className="mt-2 text-3xl font-semibold">{invitations.filter((invite) => invite.status === "active").length}</p></div>
            </section>

            <section className="mt-8 rounded-xl border border-white/10 bg-ink-soft">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-xl font-semibold">Registered Host Accounts</h2>
                <p className="mt-1 max-w-3xl text-sm text-paper/50">These are people who previously registered in this development database. They are not pending invitations. Pausing access blocks sign-in while preserving their shows and uploads.</p>
              </div>
              <div className="divide-y divide-white/10">
                {hosts.length === 0 ? <p className="p-5 text-sm text-paper/50">No hosts have joined yet.</p> : hosts.map((host) => (
                  <article key={host.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold">{host.host_name || `${host.first_name} ${host.last_name}`}</h3>
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${host.account_status === "active" ? "bg-emerald-400/15 text-emerald-200" : "bg-red-400/15 text-red-200"}`}>{host.account_status === "active" ? "Active" : "Paused"}</span>
                      </div>
                      <p className="mt-1 text-sm text-paper/50">{host.email}</p>
                      <p className="mt-2 text-sm text-paper/70">{host.shows_count} shows · {host.audio_count} audio uploads</p>
                      <p className="mt-1 text-xs text-paper/35">Registered {formatStationDateTime(host.joined_at)}</p>
                    </div>
                    <button type="button" disabled={busyId === host.id} onClick={() => updateHostStatus(host)} className="rounded-xl border border-white/15 px-4 py-3 font-semibold hover:border-signal disabled:opacity-50">
                      {host.account_status === "active" ? "Pause Access" : "Restore Access"}
                    </button>
                  </article>
                ))}
              </div>
            </section>

            <form onSubmit={createInvitation} className="mt-8 rounded-xl border border-white/10 bg-ink-soft p-5">
              <h2 className="text-xl font-semibold">Invite A New Host</h2>
              <div className="mt-2 rounded-xl border border-signal/30 bg-signal/25 p-3 text-sm text-[#ffd5c9]">
                Creating an invite does not send an email. It creates a one-time code for you to copy into your own email or text message.
              </div>
              <p className="mt-3 text-sm text-paper/50">Email is recommended so the code only works for the right person.</p>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <label className="text-sm font-medium text-paper/80">Host Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="host@example.com" className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white" /></label>
                <label className="text-sm font-medium text-paper/80">Invite Expires ({STATION_TIME_LABEL})<input type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white" /></label>
                <label className="text-sm font-medium text-paper/80">Show Idea Or Note<input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Late-night soul, local jazz..." className="mt-2 w-full rounded-xl border border-paper/15 bg-ink px-3 py-3 text-white" /></label>
              </div>
              <button type="submit" disabled={busyId === 0} className="mt-4 w-full rounded-xl bg-signal px-4 py-3 font-semibold text-ink hover:bg-[#ff7658] disabled:opacity-60">{busyId === 0 ? "Creating Invite..." : "Create Invite"}</button>
            </form>

            <section className="mt-8 rounded-xl border border-white/10 bg-ink-soft">
              <div className="border-b border-white/10 p-5">
                <h2 className="text-xl font-semibold">Invitation Codes</h2>
                <p className="mt-1 text-sm text-paper/50">Use “Copy Invite Message” to copy the registration link, code, expiration, and your note.</p>
              </div>
              <div className="divide-y divide-white/10">
                {invitations.map((invitation) => (
                  <article key={invitation.id} className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                    <div><p className="font-mono text-xl font-semibold text-[#ff9a82]">{invitation.code}</p><p className="mt-1 text-sm text-paper/50">{invitation.email || "Any email"} · {invitation.status}{invitation.expires_at ? ` · expires ${formatStationDateTime(invitation.expires_at)}` : ""}</p>{invitation.notes && <p className="mt-2 text-sm text-paper/70">{invitation.notes}</p>}</div>
                    {invitation.status === "active" && (
                      <div className="grid gap-2 sm:grid-cols-3">
                        <button type="button" onClick={() => copyInviteMessage(invitation)} className="min-h-11 rounded-xl bg-signal px-3 py-2 text-sm font-semibold text-ink hover:bg-[#ff7658]">Copy Invite Message</button>
                        <button type="button" onClick={() => navigator.clipboard.writeText(invitation.code)} className="min-h-11 rounded-xl border border-white/15 px-3 py-2 text-sm font-semibold">Copy Code Only</button>
                        <button type="button" disabled={busyId === -invitation.id} onClick={() => revokeInvite(invitation)} className="min-h-11 rounded-xl border border-red-400/30 px-3 py-2 text-sm font-semibold text-red-200">Revoke</button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
};

export default HostInvites;
