"use client";
import { useEffect, useState, useCallback } from "react"; import { supabase } from "@/lib/supabase";
import { uploadMedia, fresh } from "@/lib/upload"; import { cleanup } from "@/lib/storage"; import MediaView from "@/components/MediaView"; import Modal from "@/components/Modal";
const KINDS = ["message", "photo", "voice", "video", "note", "appreciation", "question"];
export default function ForYou() {
  const [rows, setRows] = useState<any[]>([]); const [people, setPeople] = useState<any[]>([]); const [me, setMe] = useState("");
  const [form, setForm] = useState<any>(null); const [del, setDel] = useState<any>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => setRows((await supabase.from("messages").select("*").order("created_at", { ascending: false })).data ?? []), []);
  useEffect(() => { supabase.auth.getUser().then(r => setMe(r.data.user?.id ?? "")); supabase.from("profiles").select("id,username").then(r => setPeople(r.data ?? [])); load(); }, [load]);
  const name = (id: string) => people.find(p => p.id === id)?.username ?? "";
  const other = people.find(p => p.id !== me)?.id ?? "";
  async function save(e: React.FormEvent) { e.preventDefault(); setErr("");
    if (!form.content?.trim() && !form.attachment_path) return setErr("Write something or attach a file.");
    const row = { kind: form.kind ?? "message", to_user: form.to_user ?? other, title: form.title || null, content: form.content || null, attachment_path: form.attachment_path || null };
    const { error } = form.id ? await supabase.from("messages").update(row).eq("id", form.id) : await supabase.from("messages").insert(row);
    if (error) return setErr(error.message); const old = form.id ? rows.find(x => x.id === form.id)?.attachment_path : null; setForm(null); await cleanup([...(old && old !== row.attachment_path ? [old] : []), ...fresh.splice(0).filter(p => p !== row.attachment_path)]); load(); }
  async function remove() { const p = del.attachment_path; await supabase.from("messages").delete().eq("id", del.id); setDel(null); if (p) await cleanup([p]); load(); }
  return (<div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="font-serif text-3xl">❤️ For You</h1><button className="btn" onClick={() => setForm({})}>＋ Add</button></div>
    {!rows.length && <p className="italic opacity-60 py-10 text-center">Nothing here yet. Something I wanted you to know today...</p>}
    <div className="space-y-4">{rows.map(r => (<article key={r.id} className={"card p-5 fade " + (r.to_user === me ? "ring-1" : "")} style={{ ["--tw-ring-color" as any]: "var(--accent)" }}>
      <p className="font-serif text-2xl">For {name(r.to_user)}</p>
      <p className="text-xs opacity-50 mb-2">From {name(r.created_by)} · {r.kind} · {new Date(r.created_at).toLocaleDateString()}</p>
      {r.title && <h3 className="font-medium">{r.title}</h3>}
      {r.content && <p className="whitespace-pre-wrap opacity-90 my-2">{r.content}</p>}
      {r.attachment_path && <MediaView path={r.attachment_path} />}
      {r.created_by === me && <div className="mt-3 flex gap-4 text-sm opacity-70"><button onClick={() => setForm(r)}>Edit</button><button onClick={() => setDel(r)}>Delete</button></div>}</article>))}</div>
    {form && <Modal><form onSubmit={save} className="space-y-3"><h2 className="font-serif text-2xl">{form.id ? "Edit" : "Leave something"}</h2>
      <label className="block text-sm">Type<select className="inp" value={form.kind ?? "message"} onChange={e => setForm({ ...form, kind: e.target.value })}>{KINDS.map(k => <option key={k}>{k}</option>)}</select></label>
      <label className="block text-sm">To<select className="inp" value={form.to_user ?? other} onChange={e => setForm({ ...form, to_user: e.target.value })}>{people.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}</select></label>
      <label className="block text-sm">Title<input className="inp" maxLength={120} value={form.title ?? ""} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block text-sm">Message<textarea className="inp" rows={5} value={form.content ?? ""} onChange={e => setForm({ ...form, content: e.target.value })} /></label>
      <label className="block text-sm">Photo, voice note or video<input className="inp" type="file" accept="image/*,audio/*,video/*" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); setErr("");
        try { setForm((x: any) => ({ ...x, attachment_path: "" })); const p = await uploadMedia(f); setForm((x: any) => ({ ...x, attachment_path: p })); } catch (x: any) { setErr(x.message); } setBusy(false); }} /></label>
      {busy && <p className="text-sm opacity-60">Uploading...</p>}{err && <p className="text-red-600 text-sm">{err}</p>}
      <div className="flex gap-3 justify-end"><button type="button" onClick={() => { setForm(null); cleanup(fresh.splice(0)); }}>Cancel</button><button className="btn" disabled={busy}>Save</button></div></form></Modal>}
    {del && <Modal><p className="font-serif text-xl">Are you sure you want to let this memory go?</p>
      <div className="flex gap-3 justify-end mt-5"><button onClick={() => setDel(null)}>Cancel</button><button className="btn" onClick={remove}>Delete</button></div></Modal>}
  </div>);
}
