"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase"; import { uploadImage } from "@/lib/upload"; import Img from "@/components/Img"; import MediaView from "@/components/MediaView"; import { uploadMedia, fresh } from "@/lib/upload"; import { cleanup, pathsOf, mediaCols } from "@/lib/storage"; import Modal from "@/components/Modal"; import FavButton, { FavType } from "@/components/FavButton"; import { MODULES } from "@/lib/modules";
export default function Module() {
  const { module } = useParams<{ module: string }>(); const sp = useSearchParams();
  const m = MODULES.find(x => x.key === module);
  const [rows, setRows] = useState<any[]>([]); const [me, setMe] = useState(""); const [q, setQ] = useState("");
  const FAV: Record<string, FavType> = { memories: "memory", events: "event", open_when: "open_when", future_plans: "future_plan" };
  const [people, setPeople] = useState<any[]>([]); const [tag, setTag] = useState(""); const [who, setWho] = useState(""); const [from, setFrom] = useState(""); const [to, setTo] = useState(""); const [view, setView] = useState<any>(null);
  const [form, setForm] = useState<any | null>(null); const [del, setDel] = useState<any | null>(null); const [err, setErr] = useState("");
  const load = useCallback(async () => { if (!m) return;
    setRows((await supabase.from(m.table).select("*").order("created_at", { ascending: false })).data ?? []); }, [m]);
  useEffect(() => { supabase.auth.getUser().then(r => setMe(r.data.user?.id ?? "")); supabase.from("profiles").select("id,username").then(r => setPeople(r.data ?? [])); load(); if (sp.get("new")) setForm({}); }, [load, sp]);
  useEffect(() => { const id = sp.get("open"); if (id) setView(rows.find(r => r.id === id) ?? null); }, [rows, sp]);
  if (!m) return <p>Not found.</p>;
  const cols = mediaCols(m.key); const other = people.find(p => p.id !== me)?.id ?? ""; const nameOf = (id: string) => people.find(p => p.id === id)?.username ?? "";
  const dcol = m.date && m.date !== "unlock_at" ? m.date : null; const tags = Array.from(new Set(rows.flatMap(r => r.tags ?? [])));
  const shown = rows.filter(r => JSON.stringify(r).toLowerCase().includes(q.toLowerCase()) && (!tag || (r.tags ?? []).includes(tag)) && (!who || r.created_by === who)
    && (!dcol || ((!from || (r[dcol] ?? "") >= from) && (!to || (r[dcol] ?? "") <= to))));
  const ordered = m.key === "timeline" ? [...shown].sort((a, b) => (a.item_date ?? "").localeCompare(b.item_date ?? "")) : shown;
  async function save(e: React.FormEvent) { e.preventDefault(); setErr("");
    const row: any = {}; for (const f of m!.fields) { const v = form[f.name];
      if (f.required && !String(v ?? "").trim()) return setErr(f.label + " is required.");
      row[f.name] = f.type === "person" ? (v || other) : f.type === "number" ? (v === "" || v == null ? null : Number(v)) : f.type === "bool" ? !!v : f.type === "images" ? (Array.isArray(v) ? v : []) : f.type === "tags" ? (Array.isArray(v) ? v : String(v ?? "").split(",").map(s => s.trim()).filter(Boolean))
        : f.type === "datetime" ? (v ? new Date(v).toISOString() : null) : (v === "" ? null : v ?? null); }
    const { error } = form.id ? await supabase.from(m!.table).update(row).eq("id", form.id) : await supabase.from(m!.table).insert(row);
    if (error) return setErr(error.message);
    const kept = pathsOf(row, cols); const old = form.id ? pathsOf(rows.find(x => x.id === form.id), cols).filter(p => !kept.includes(p)) : [];
    setForm(null); await cleanup([...old, ...fresh.splice(0).filter(p => !kept.includes(p))]); load(); }
  async function remove() { const gone = pathsOf(del, cols); await supabase.from(m!.table).delete().eq("id", del.id); setDel(null); await cleanup(gone); load(); }
  const locked = (r: any) => r.unlock_at && new Date(r.unlock_at) > new Date();
  return (<div className="space-y-6">
    <div className="flex items-center justify-between gap-3"><h1 className="font-serif text-3xl">{m.icon} {m.label}</h1>
      <button className="btn" onClick={() => setForm({})}>＋ Add</button></div>
    <input className="inp" placeholder="Search..." value={q} onChange={e => setQ(e.target.value)} />
    <div className="flex flex-wrap gap-2 text-sm"><select className="inp !w-auto" value={who} onChange={e => setWho(e.target.value)}><option value="">Everyone</option>{people.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}</select>
      {tags.length > 0 && <select className="inp !w-auto" value={tag} onChange={e => setTag(e.target.value)}><option value="">All tags</option>{tags.map((t: any) => <option key={t}>{t}</option>)}</select>}
      {dcol && <><input className="inp !w-auto" type="date" value={from} onChange={e => setFrom(e.target.value)} /><input className="inp !w-auto" type="date" value={to} onChange={e => setTo(e.target.value)} /></>}</div>
    {!shown.length && <p className="italic opacity-60 py-10 text-center">{m.empty}</p>}
    <div className={m.key === "timeline" ? "timeline-wrap" : "grid gap-3 md:grid-cols-2"}>{ordered.map((r, i) => (<article key={r.id} style={{ animationDelay: `${i * 60}ms` }} className={"card p-5 fade " + (m.key === "timeline" ? "tl " : "") + (r.unlock_at && !locked(r) ? "unlock" : "")}>
      {locked(r) ? <><p className="text-2xl">🔒</p><p className="font-serif">Something is waiting for you.</p>
        <p className="text-sm opacity-60">Unlocks {new Date(r.unlock_at).toLocaleString()}</p>{r.to_user && <p className="text-sm mt-1">For {nameOf(r.to_user)}</p>}</> : <>
      {m.key === "timeline" && r.item_date && <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{new Date(r.item_date).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>}
      <h3 className="font-serif text-xl">{r[m.title]}{r.is_demo && <span className="ml-2 text-xs opacity-50">demo</span>}</h3>
      {m.fields.filter(f => f.type === "image" || f.type === "images").flatMap(f => [r[f.name]].flat().filter(Boolean)).map((p: string) => <Img key={p} path={p} className="mb-3 max-h-64" />)}
      {m.fields.filter(f => f.type === "media").map(f => r[f.name] && <div key={f.name} className="mb-3"><MediaView path={r[f.name]} /></div>)}
      {m.table === "scheduled_messages" && <p className="text-sm">For {nameOf(r.to_user)}</p>}
      {m.key !== "timeline" && m.date && r[m.date] && <p className="text-sm opacity-60">{new Date(r[m.date]).toLocaleDateString()}</p>}
      {m.fields.filter(f => f.type !== "image" && f.type !== "images" && f.type !== "media" && f.type !== "bool" && f.type !== "person" && f.type !== "number" && f.name !== m.title && f.name !== m.date && r[f.name] && !f.name.includes("date") && f.name !== "unlock_at")
        .map(f => <p key={f.name} className="mt-1 text-sm opacity-80 whitespace-pre-wrap">{Array.isArray(r[f.name]) ? r[f.name].map((t: string) => "#" + t).join(" ") : String(r[f.name])}</p>)}</>}
      <div className="mt-3 flex gap-4 text-sm opacity-70 items-center">{FAV[m.table] && !locked(r) && <FavButton type={FAV[m.table]} id={r.id} me={me} />}
      {r.created_by === me && <>
        <button onClick={() => setForm({ ...r, unlock_at: r.unlock_at?.slice(0, 16), tags: r.tags?.join(", ") })}>Edit</button>
        <button onClick={() => setDel(r)}>Delete</button></>}{!locked(r) && <button onClick={() => setView(r)}>View</button>}</div></article>))}</div>
    {form && <Modal><form onSubmit={save} className="space-y-3"><h2 className="font-serif text-2xl">{form.id ? "Edit" : "Add"} {m.label}</h2>
      {m.fields.map(f => <label key={f.name} className="block text-sm">{f.label}
        {f.type === "person" ? <select className="inp" value={form[f.name] ?? other} onChange={e => setForm({ ...form, [f.name]: e.target.value })}>{people.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}</select>
        : f.type === "bool" ? <input type="checkbox" className="ml-2" checked={!!form[f.name]} onChange={e => setForm({ ...form, [f.name]: e.target.checked })} />
        : f.type === "media" ? <><input className="inp" type="file" accept="image/*,audio/*,video/*" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setErr(""); try { const p = await uploadMedia(file); setForm((x: any) => ({ ...x, [f.name]: p })); } catch (x: any) { setErr(x.message); } }} />{form[f.name] && <span className="text-xs opacity-60">Attached ✓</span>}</>
        : f.type === "image" || f.type === "images" ? <input className="inp" type="file" accept="image/*" multiple={f.type === "images"} onChange={async e => { setErr(""); try { const paths = await Promise.all(Array.from(e.target.files ?? []).map(uploadImage)); setForm((x: any) => ({ ...x, [f.name]: f.type === "images" ? [...(x[f.name] ?? []), ...paths] : paths[0] })); } catch (x: any) { setErr(x.message); } }} />
        : f.type === "textarea" ? <textarea className="inp" rows={4} value={form[f.name] ?? ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} />
        : f.type === "select" ? <select className="inp" value={form[f.name] ?? ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })}><option value="">—</option>{f.options!.map(o => <option key={o}>{o}</option>)}</select>
        : <input className="inp" type={f.type === "date" ? "date" : f.type === "datetime" ? "datetime-local" : f.type === "number" ? "number" : "text"} step="any" value={form[f.name] ?? ""} onChange={e => setForm({ ...form, [f.name]: e.target.value })} />}</label>)}
      {err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setForm(null); cleanup(fresh.splice(0)); }}>Cancel</button><button className="btn">Save</button></div></form></Modal>}
    {view && <Modal><h2 className="font-serif text-2xl">{view[m.title]}</h2>
      {m.date && view[m.date] && <p className="text-sm opacity-60 mb-3">{new Date(view[m.date]).toLocaleDateString()}</p>}
      <div className="space-y-3">{m.fields.filter(f => f.type === "image" || f.type === "images").flatMap(f => [view[f.name]].flat().filter(Boolean)).map((p: string) => <Img key={p} path={p} />)}
        {m.fields.filter(f => f.type === "media" && view[f.name]).map(f => <MediaView key={f.name} path={view[f.name]} />)}
        {m.fields.filter(f => ["text", "textarea", "select"].includes(f.type) && f.name !== m.title && view[f.name]).map(f => <p key={f.name} className="whitespace-pre-wrap"><span className="opacity-50 text-xs block">{f.label}</span>{view[f.name]}</p>)}
        {m.table === "places" && view.latitude != null && view.longitude != null && <iframe title="map" className="w-full h-56 rounded-xl border-0" loading="lazy" src={`https://www.openstreetmap.org/export/embed.html?bbox=${view.longitude - 0.01}%2C${view.latitude - 0.01}%2C${view.longitude + 0.01}%2C${view.latitude + 0.01}&layer=mapnik&marker=${view.latitude}%2C${view.longitude}`} />}
        {m.table === "places" && (view.location || view.name) && <a className="underline text-sm" target="_blank" rel="noreferrer" href={"https://www.openstreetmap.org/search?query=" + encodeURIComponent(view.location || view.name)}>📍 Open on map</a>}
        {m.table === "open_when" || m.table === "scheduled_messages" ? <p className="font-serif opacity-70">❤️ This was written for you.</p> : null}</div>
      <div className="flex justify-end mt-5"><button className="btn" onClick={() => setView(null)}>Close</button></div></Modal>}
    {del && <Modal><p className="font-serif text-xl">Are you sure you want to let this memory go?</p>
      <div className="flex gap-3 justify-end mt-5"><button onClick={() => setDel(null)}>Cancel</button><button className="btn" onClick={remove}>Delete</button></div></Modal>}
  </div>);
}
