"use client";
import { useState } from "react"; import Link from "next/link"; import { supabase } from "@/lib/supabase";
// table, route, title column, text columns, date column
const T: [string, string, string, string[], string?][] = [
  ["memories", "memories", "title", ["title", "description", "location"], "memory_date"],
  ["events", "events", "title", ["title", "description", "location", "category"], "event_date"],
  ["open_when", "open-when", "title", ["title", "message"], undefined],
  ["timeline_items", "timeline", "title", ["title", "description", "location"], "item_date"],
  ["future_plans", "future", "title", ["title", "description", "category"], undefined],
  ["little_things", "little-things", "title", ["title", "description", "category"], undefined],
  ["places", "places", "name", ["name", "description", "location"], "visited_on"],
  ["messages", "for-you", "title", ["title", "content"], undefined],
];
export default function Search() {
  const [q, setQ] = useState(""); const [res, setRes] = useState<any[] | null>(null);
  async function run(e: React.FormEvent) { e.preventDefault();
    const term = q.trim().replace(/[,()%*\\]/g, " ").trim(); if (!term) return setRes(null);
    const people = (await supabase.from("profiles").select("id").ilike("username", `%${term}%`)).data ?? [];
    const out: any[] = [];
    await Promise.all(T.map(async ([table, route, tcol, cols, dcol]) => {
      const parts = cols.map(c => `${c}.ilike.%${term}%`);
      if (table === "memories") parts.push(`tags.cs.{${term}}`);
      if (dcol && /^\d{4}(-\d{2}(-\d{2})?)?$/.test(term) && term.length === 10) parts.push(`${dcol}.eq.${term}`);
      if (people.length) parts.push(`created_by.in.(${people.map(p => p.id).join(",")})`);
      const { data } = await supabase.from(table).select("*").or(parts.join(",")).limit(20);
      (data ?? []).forEach(r => out.push({ route, table, id: r.id, title: r[tcol] ?? r.content?.slice(0, 60) ?? "Untitled" }));
    })); setRes(out); }
  return (<div className="space-y-6"><h1 className="font-serif text-3xl">🔍 Search</h1>
    <form onSubmit={run} className="flex gap-3"><input className="inp" placeholder="Title, description, tag, date (YYYY-MM-DD) or name" value={q} onChange={e => setQ(e.target.value)} /><button className="btn">Search</button></form>
    {res && !res.length && <p className="italic opacity-60 text-center py-8">Nothing found. Maybe that's a memory still to be made.</p>}
    <div className="space-y-2">{res?.map(r => <Link key={r.table + r.id} href={"/" + r.route + "?open=" + r.id} className="card p-4 flex justify-between"><span>{r.title}</span><span className="text-sm opacity-50">{r.route}</span></Link>)}</div></div>);
}
