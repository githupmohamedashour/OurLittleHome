"use client";
import { useEffect, useState } from "react"; import { supabase } from "@/lib/supabase"; import { uploadImage } from "@/lib/upload"; import { cleanup } from "@/lib/storage"; import Img from "@/components/Img";
export default function Settings() {
  const [p, setP] = useState<any>({}); const [pw, setPw] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { supabase.auth.getUser().then(async r => setP((await supabase.from("profiles").select("*").eq("id", r.data.user!.id).single()).data ?? {})); }, []);
  async function saveProfile() { const { error } = await supabase.from("profiles").update({ username: p.username, bio: p.bio, favorite_color: p.favorite_color, birthday: p.birthday || null }).eq("id", p.id); setMsg(error ? error.message : "Saved."); }
  async function changePw() { if (pw.length < 8) return setMsg("Use at least 8 characters."); const { error } = await supabase.auth.updateUser({ password: pw }); setMsg(error ? error.message : "Password updated."); setPw(""); }
  const f = (k: string, l: string, t = "text") => <label className="block text-sm">{l}<input className="inp" type={t} value={p[k] ?? ""} onChange={e => setP({ ...p, [k]: e.target.value })} /></label>;
  return (<div className="space-y-5 max-w-md"><h1 className="font-serif text-3xl">Account</h1>
    {p.avatar_url && <div className="w-24"><Img path={p.avatar_url} className="rounded-full aspect-square" /></div>}
    <label className="block text-sm">Profile picture<input className="inp" type="file" accept="image/*" onChange={async e => { const file = e.target.files?.[0]; if (!file) return; try { const path = await uploadImage(file); await supabase.from("profiles").update({ avatar_url: path }).eq("id", p.id); const old = p.avatar_url; setP({ ...p, avatar_url: path }); if (old) await cleanup([old]); } catch (x: any) { setMsg(x.message); } }} /></label>
    <p className="text-xs opacity-50">Joined {p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</p>
    {f("username", "Username")}{f("bio", "Short bio")}{f("favorite_color", "Favorite color")}{f("birthday", "Birthday", "date")}
    <button className="btn" onClick={saveProfile}>Save profile</button>
    <label className="block text-sm">New password<input className="inp" type="password" value={pw} onChange={e => setPw(e.target.value)} /></label>
    <button className="btn" onClick={changePw}>Change password</button>
    {msg && <p className="text-sm opacity-70">{msg}</p>}
    <button className="underline text-sm block" onClick={async () => { if (!confirm("Remove all demo/sample content for both of you?")) return; const { error } = await supabase.rpc("remove_demo_content"); setMsg(error ? error.message : "Demo content removed."); }}>Remove demo content</button>
    <button className="underline text-sm" onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}>Log out</button></div>);
}
