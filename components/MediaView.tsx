"use client";
import { useEffect, useState } from "react"; import { supabase } from "@/lib/supabase";
export default function MediaView({ path }: { path: string }) {
  const [url, setUrl] = useState("");
  useEffect(() => { supabase.storage.from("media").createSignedUrl(path, 3600).then(r => setUrl(r.data?.signedUrl ?? "")); }, [path]);
  if (!url) return <div className="rounded-xl animate-pulse h-24" style={{ background: "var(--line)" }} />;
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  if (["mp3", "m4a", "wav", "ogg", "webm", "aac"].includes(ext)) return <audio controls src={url} className="w-full" />;
  if (["mp4", "mov", "m4v"].includes(ext)) return <video controls src={url} className="w-full rounded-xl max-h-80" />;
  return <img src={url} alt="" loading="lazy" className="w-full rounded-xl object-cover max-h-80" />;
}
