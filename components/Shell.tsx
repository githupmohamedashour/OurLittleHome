"use client";
import Link from "next/link"; import { usePathname } from "next/navigation"; import { useState } from "react";
import { MODULES } from "@/lib/modules";
export default function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname(); const [add, setAdd] = useState(false);
  const bottom = [["/","Home"],["/memories","Memories"],["/open-when","Open When"],["/future","Future"],["/settings","More"]];
  return (<div className="md:flex min-h-screen">
    <aside className="hidden md:flex w-60 flex-col gap-1 p-5 border-r" style={{borderColor:"var(--line)"}}>
      <Link href="/" className="font-serif text-xl mb-4">Our Little World</Link>
      {MODULES.map(m => <Link key={m.key} href={"/"+m.key} className={"rounded-lg px-3 py-2 "+(path==="/"+m.key?"card":"opacity-70 hover:opacity-100")}>{m.icon} {m.label}</Link>)}
      <Link href="/for-you" className="rounded-lg px-3 py-2 opacity-70">❤️ For You</Link>
      <Link href="/photos" className="rounded-lg px-3 py-2 opacity-70">🖼️ Photo Wall</Link>
      <Link href="/search" className="rounded-lg px-3 py-2 opacity-70">🔍 Search</Link>
      <Link href="/favorites" className="rounded-lg px-3 py-2 opacity-70">❤️ Favorites</Link>
      <Link href="/settings" className="rounded-lg px-3 py-2 opacity-70 mt-auto">⚙️ Account</Link>
    </aside>
    <main className="flex-1 p-5 md:p-10 pb-28 max-w-4xl fade">{children}</main>
    <button onClick={() => setAdd(!add)} className="btn fixed right-5 bottom-20 md:bottom-8 w-14 h-14 rounded-full text-2xl shadow-lg">＋</button>
    {add && <div className="card fixed right-5 bottom-40 md:bottom-28 p-2 w-52 fade" style={{background:"var(--bg)"}}>
      <Link onClick={() => setAdd(false)} href="/for-you" className="block px-3 py-2 rounded-lg hover:opacity-70">Add Message</Link>
      <Link onClick={() => setAdd(false)} href="/photos" className="block px-3 py-2 rounded-lg hover:opacity-70">Add Photo</Link>
      {MODULES.map(m => <Link key={m.key} onClick={() => setAdd(false)} href={`/${m.key}?new=1`} className="block px-3 py-2 rounded-lg hover:opacity-70">Add {m.label}</Link>)}</div>}
    <nav className="md:hidden fixed bottom-0 inset-x-0 flex justify-around py-3 border-t text-xs" style={{background:"var(--bg)",borderColor:"var(--line)"}}>
      {bottom.map(([h,l]) => <Link key={h} href={h} className={path===h?"font-semibold":"opacity-60"}>{l}</Link>)}</nav>
  </div>);
}
