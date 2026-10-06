"use client";
import { useState } from "react";
export default function Login() {
  const [u, setU] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  async function go(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: u, password: p }) }).catch(() => null);
    if (r?.ok) { window.location.href = "/"; return; }
    setBusy(false); setErr("Wrong username or password.");
  }
  return (<main className="min-h-screen grid place-items-center p-6">
    <div className="w-full max-w-sm space-y-5">
      <h1 className="font-serif text-4xl text-center fade">Our Little World</h1>
      <div className="fade text-center text-sm leading-relaxed space-y-1 px-2" style={{ animationDelay: "250ms" }}>
        <p className="opacity-90">Hey… you&apos;ve found our little corner of the internet. ❤️</p>
        <p className="opacity-70">This place is private — made for <span className="font-serif">Mohamed &amp; Manar</span>, and no one else.</p>
        <p className="opacity-60 italic">If you&apos;re not one of us, you&apos;ve probably taken a wrong turn. Please leave this little world to its two inhabitants. ✨</p>
      </div>
      <form onSubmit={go} className="card fade p-7 space-y-4" style={{ animationDelay: "500ms" }}>
        <input className="inp" placeholder="Username" autoComplete="username" value={u} onChange={e => setU(e.target.value)} required />
        <input className="inp" type="password" placeholder="Password" autoComplete="current-password" value={p} onChange={e => setP(e.target.value)} required />
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button className="btn w-full" disabled={busy}>{busy ? "..." : "Enter"}</button>
      </form></div></main>);
}
