"use client";
import { useEffect, useState } from "react"; import { supabase } from "@/lib/supabase";
export type FavType = "memory" | "event" | "open_when" | "photo" | "future_plan";
// Favorites belong to the signed-in user only: every query is scoped by created_by = their id (and RLS enforces it).
export default function FavButton({ type, id, me }: { type: FavType; id: string; me: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => { if (!me) return; setOn(false);
    supabase.from("favorites").select("id").eq("item_type", type).eq("item_id", id).eq("created_by", me).maybeSingle().then(r => setOn(!!r.data)); }, [type, id, me]);
  async function toggle() {
    if (!me) return;
    const { error } = on ? await supabase.from("favorites").delete().eq("item_type", type).eq("item_id", id).eq("created_by", me)
      : await supabase.from("favorites").insert({ item_type: type, item_id: id, created_by: me });
    if (!error) setOn(!on);
  }
  return <button onClick={toggle} aria-label="Favorite" className={on ? "" : "opacity-40"}>{on ? "❤️" : "🤍"}</button>;
}
