"use client";
import { useEffect, useState } from "react"; import { supabase } from "@/lib/supabase"; import Img from "@/components/Img";
const T: Record<string, [string, string, string]> = { memory: ["memories", "title", "Memory"], event: ["events", "title", "Event"],
  open_when: ["open_when", "title", "Open When"], photo: ["photos", "caption", "Photo"], future_plan: ["future_plans", "title", "Future plan"] };
export default function Favorites() {
  const [items, setItems] = useState<any[]>([]); const [done, setDone] = useState(false);
  useEffect(() => { (async () => {
    const uid = (await supabase.auth.getUser()).data.user?.id ?? "";
    const favs = (await supabase.from("favorites").select("*").eq("created_by", uid).order("created_at", { ascending: false })).data ?? []; const out: any[] = [];
    for (const [type, [table, field, label]] of Object.entries(T)) {
      const ids = favs.filter(f => f.item_type === type).map(f => f.item_id); if (!ids.length) continue;
      const rows = (await supabase.from(table).select("*").in("id", ids)).data ?? [];
      rows.forEach(r => out.push({ ...r, label, text: r[field], img: type === "photo" ? r.path : null }));
    } setItems(out); setDone(true); })(); }, []);
  return (<div className="space-y-6"><h1 className="font-serif text-3xl">❤️ Favorites</h1>
    {done && !items.length && <p className="italic opacity-60 py-10 text-center">Nothing saved yet. Tap the heart on anything you want to keep close.</p>}
    <div className="grid gap-3 md:grid-cols-2">{items.map(i => <div key={i.label + i.id} className="card p-4">
      <p className="text-xs opacity-50 mb-1">{i.label}</p>{i.img && <Img path={i.img} className="mb-2" />}<p className="font-serif text-lg">{i.text}</p></div>)}</div></div>);
}
