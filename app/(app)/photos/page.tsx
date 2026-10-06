"use client";
import { useEffect, useState, useCallback } from "react"; import { supabase } from "@/lib/supabase";
import { uploadImage } from "@/lib/upload"; import { cleanup } from "@/lib/storage"; import Img from "@/components/Img"; import FavButton from "@/components/FavButton"; import Modal from "@/components/Modal";
export default function Photos() {
  const [rows, setRows] = useState<any[]>([]); const [people, setPeople] = useState<any[]>([]); const [me, setMe] = useState("");
  const [who, setWho] = useState(""); const [month, setMonth] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const [cap, setCap] = useState<any>(null); const [del, setDel] = useState<any>(null);
  const load = useCallback(async () => setRows((await supabase.from("photos").select("*").order("created_at", { ascending: false })).data ?? []), []);
  useEffect(() => { supabase.auth.getUser().then(r => setMe(r.data.user?.id ?? "")); supabase.from("profiles").select("id,username").then(r => setPeople(r.data ?? [])); load(); }, [load]);
  async function add(files: FileList | null) {
    if (!files) return; setBusy(true); setErr("");
    try { for (const f of Array.from(files)) { const path = await uploadImage(f);
      const { error } = await supabase.from("photos").insert({ path, taken_at: new Date(f.lastModified).toISOString().slice(0, 10) }); if (error) { await cleanup([path]); throw error; } } }
    catch (e: any) { setErr(e.message); } setBusy(false); load();
  }
  async function remove() { const p = del.path; await supabase.from("photos").delete().eq("id", del.id); setDel(null); await cleanup([p]); load(); }
  async function saveCap() { await supabase.from("photos").update({ caption: cap.caption }).eq("id", cap.id); setCap(null); load(); }
  const shown = rows.filter(r => (!who || r.created_by === who) && (!month || (r.taken_at ?? "").startsWith(month)));
  const name = (id: string) => people.find(p => p.id === id)?.username ?? "";
  return (<div className="space-y-6">
    <div className="flex items-center justify-between"><h1 className="font-serif text-3xl">🖼️ Photo Wall</h1>
      <label className="btn cursor-pointer">{busy ? "Uploading..." : "＋ Add Photo"}<input type="file" accept="image/*" multiple hidden onChange={e => add(e.target.files)} /></label></div>
    <div className="flex gap-3"><select className="inp" value={who} onChange={e => setWho(e.target.value)}><option value="">Everyone</option>{people.map(p => <option key={p.id} value={p.id}>{p.username}</option>)}</select>
      <input className="inp" type="month" value={month} onChange={e => setMonth(e.target.value)} /></div>
    {err && <p className="text-red-600 text-sm">{err}</p>}
    {!shown.length && <p className="italic opacity-60 py-10 text-center">No photos yet. Let's give the wall its first one.</p>}
    <div className="columns-2 md:columns-3 gap-3 [&>*]:mb-3">{shown.map(r => (<figure key={r.id} className="card p-2 break-inside-avoid">
      <Img path={r.path} />
      <figcaption className="px-1 pt-2 text-sm flex items-start justify-between gap-2">
        <span className="opacity-80">{r.caption || <i className="opacity-40">{name(r.created_by)}</i>}</span>
        <span className="flex gap-2 shrink-0"><FavButton type="photo" id={r.id} me={me} />
          {r.created_by === me && <><button onClick={() => setCap(r)}>✏️</button><button onClick={() => setDel(r)}>🗑️</button></>}</span></figcaption></figure>))}</div>
    {cap && <Modal><h2 className="font-serif text-xl mb-3">Caption</h2><input className="inp" value={cap.caption ?? ""} maxLength={200} onChange={e => setCap({ ...cap, caption: e.target.value })} />
      <div className="flex gap-3 justify-end mt-4"><button onClick={() => setCap(null)}>Cancel</button><button className="btn" onClick={saveCap}>Save</button></div></Modal>}
    {del && <Modal><p className="font-serif text-xl">Are you sure you want to let this memory go?</p>
      <div className="flex gap-3 justify-end mt-5"><button onClick={() => setDel(null)}>Cancel</button><button className="btn" onClick={remove}>Delete</button></div></Modal>}
  </div>);
}
