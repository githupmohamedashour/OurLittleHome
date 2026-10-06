import { supabase } from "./supabase"; import { MODULES } from "./modules";
export const mediaCols = (key: string) => (MODULES.find(m => m.key === key)?.fields ?? []).filter(f => ["image", "images", "media"].includes(f.type)).map(f => f.name);
export const pathsOf = (row: any, cols: string[]): string[] => cols.flatMap(c => [row?.[c]].flat()).filter(Boolean) as string[];
// Deletes a file only if no record anywhere still references it (checked server-side, ignoring RLS).
export async function cleanup(paths: string[]) {
  for (const p of Array.from(new Set(paths))) {
    const { data, error } = await supabase.rpc("media_in_use", { p_path: p });
    if (!error && data === false) await supabase.storage.from("media").remove([p]);
  }
}
