"use client";
import { useEffect, useState } from "react"; import { supabase } from "@/lib/supabase";
export default function Img({ path, className = "" }: { path: string; className?: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => { supabase.storage.from("media").createSignedUrl(path, 3600).then(r => setUrl(r.data?.signedUrl ?? "")); }, [path]);
  return url ? <img src={url} alt="" loading="lazy" className={"w-full object-cover rounded-xl fade " + className} />
    : <div className={"rounded-xl animate-pulse " + className} style={{ background: "var(--line)", minHeight: 120 }} />;
}
