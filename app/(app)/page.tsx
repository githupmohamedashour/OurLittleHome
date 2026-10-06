"use client";
import { useEffect, useState } from "react"; import Link from "next/link"; import { supabase } from "@/lib/supabase";
const FEED: [string, string, string, string, string][] = [
  ["memories", "memories", "Memory", "📸", "title"], ["photos", "photos", "Photo", "🖼️", "caption"], ["events", "events", "Event", "🗓️", "title"],
  ["messages", "for-you", "For You message", "❤️", "title"], ["little_things", "little-things", "Little Thing", "✨", "title"],
  ["future_plans", "future", "Future Plan", "🌙", "title"], ["places", "places", "Place", "📍", "name"], ["timeline_items", "timeline", "Timeline item", "🕰️", "title"]];
const TILES = [["/memories", "📸", "Memories"], ["/events", "🗓️", "Events"], ["/open-when", "💌", "Open When"], ["/scheduled", "🔐", "Secret Messages"], ["/future", "🌙", "Future Us"],
  ["/little-things", "✨", "Little Things"], ["/timeline", "🕰️", "Timeline"], ["/photos", "🖼️", "Photo Wall"], ["/places", "📍", "Places"], ["/favorites", "❤️", "Favorites"]];
const ago = (iso: string) => { const m = (Date.now() - +new Date(iso)) / 6e4; return m < 60 ? "Just now" : m < 1440 ? `${Math.floor(m / 60)}h ago` : m < 2880 ? "Yesterday" : `${Math.floor(m / 1440)} days ago`; };
const deep = (route: string, id: string) => ["photos", "for-you"].includes(route) ? "/" + route : `/${route}?open=${id}`;
export default function Home() {
  const [ev, setEv] = useState<any[]>([]); const [feed, setFeed] = useState<any[]>([]); const [lock, setLock] = useState<any[]>([]);
  const [inbox, setInbox] = useState<any[]>([]); const [rem, setRem] = useState<any>(null);
  useEffect(() => { (async () => {
    const today = new Date().toISOString().slice(0, 10);
    setEv((await supabase.from("events").select("*").gte("event_date", today).order("event_date").limit(5)).data ?? []);
    const parts = await Promise.all(FEED.map(async ([table, route, label, icon, col]) => {
      const rows = (await supabase.from(table).select("*").order("created_at", { ascending: false }).limit(4)).data ?? [];
      return rows.map((r: any) => ({ id: r.id, route, label, icon, at: r.created_at, text: r[col] || r.content?.slice(0, 60) || (table === "photos" ? "A new photo" : r.kind || "Untitled") }));
    }));
    setFeed(parts.flat().sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 8));
    const uid = (await supabase.auth.getUser()).data.user?.id;
    setInbox((await supabase.from("messages").select("*").eq("to_user", uid!).order("created_at", { ascending: false }).limit(3)).data ?? []);
    const pool = [...((await supabase.from("memories").select("id,title,description").limit(50)).data ?? []).map(r => ({ ...r, route: "memories" })),
      ...((await supabase.from("little_things").select("id,title,description").limit(50)).data ?? []).map(r => ({ ...r, route: "little-things" }))];
    if (pool.length) setRem(pool[Math.floor(Math.random() * pool.length)]);
    setLock((await supabase.from("locked_teasers").select("*").order("unlock_at").limit(4)).data ?? []);
  })(); }, []);
  const next = ev.find(e => e.is_countdown) ?? ev[0]; const days = next ? Math.ceil((+new Date(next.event_date) - Date.now()) / 864e5) : 0;
  return (<div className="space-y-10">
    <header><h1 className="font-serif text-4xl md:text-5xl">Our Little World</h1>
      <p className="mt-2 opacity-70 italic">“A little place on the internet that belongs only to us.”</p>
      <p className="mt-4 opacity-60">Two people. One story.<br />A thousand little moments still waiting to happen.</p>
      <Link href="/events?new=1" className="btn inline-block mt-5">＋ Add Event</Link></header>
    {next && <Link href={`/events?open=${next.id}`} className="card p-6 block"><p className="font-serif text-xl">Only {days} days until {next.title}.</p></Link>}
    <Sec title="Coming Up" href="/events" empty="Nothing planned yet. Maybe that's where the next adventure begins.">{ev.map(e => <Row key={e.id} href={`/events?open=${e.id}`} a={e.title} b={e.event_date} />)}</Sec>
    <Sec title="Recent Activity" href="/memories" empty="We haven't filled this page yet... Let's give it a memory.">
      {feed.map(i => <Link key={i.label + i.id} href={deep(i.route, i.id)} className="card p-3 flex items-center gap-3">
        <span className="text-xl">{i.icon}</span><span className="min-w-0 flex-1"><span className="block text-xs opacity-50">New {i.label}</span><span className="block truncate">{i.text}</span></span>
        <span className="text-xs opacity-50 shrink-0">{ago(i.at)}</span></Link>)}</Sec>
    <Sec title="From You" href="/for-you" empty="Nothing new yet.">{inbox.map(m => <Row key={m.id} href="/for-you" a={m.title || m.content?.slice(0, 50) || m.kind} b={new Date(m.created_at).toLocaleDateString()} />)}</Sec>
    {rem && <Link href={`/${rem.route}?open=${rem.id}`} className="card p-6 block"><p className="text-xs opacity-50 mb-1">A little reminder</p><p className="font-serif text-xl">{rem.title}</p>{rem.description && <p className="opacity-70 mt-1">{rem.description}</p>}</Link>}
    <Sec title="Waiting for You 🔒" href="/open-when" empty="Nothing waiting yet.">{lock.map(l => <Row key={l.kind + l.id} href={l.kind === "scheduled" ? "/scheduled" : "/open-when"} a="Something is waiting for you." b={"Unlocks " + new Date(l.unlock_at).toLocaleDateString()} />)}</Sec>
    <section><h2 className="font-serif text-2xl mb-3">Wander</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {TILES.map(([h, i, l]) => <Link key={h} href={h} className="card p-4 text-center text-sm hover:opacity-80"><span className="block text-xl">{i}</span>{l}</Link>)}</div></section>
    <p className="text-center font-serif opacity-60">Our story is still being written.</p></div>);
}
const Sec = ({ title, href, empty, children }: any) => <section><Link href={href} className="font-serif text-2xl mb-3 inline-block hover:opacity-70">{title} →</Link>
  <div className="space-y-2">{(children as any[]).length ? children : <p className="opacity-60 italic">{empty}</p>}</div></section>;
const Row = ({ href, a, b }: { href: string; a: string; b?: string }) => <Link href={href} className="card p-4 flex justify-between gap-3"><span className="truncate">{a}</span><span className="opacity-60 text-sm shrink-0">{b}</span></Link>;
