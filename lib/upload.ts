import { supabase } from "./supabase";
// Files uploaded in the current form; removed if the form is cancelled.
export const fresh: string[] = [];
// Resize + convert to WebP in the browser before upload (web performance).
export async function compress(file: File, max = 1600): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error("compress failed"))), "image/webp", 0.82));
}
export async function uploadImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Images only.");
  if (file.size > 25e6) throw new Error("File too large (25 MB max).");
  const { data: { user } } = await supabase.auth.getUser();
  const path = `${user!.id}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from("media").upload(path, await compress(file), { contentType: "image/webp" });
  if (error) throw error;
  fresh.push(path);
  return path;
}

// Audio / video / image attachments without re-encoding.
export async function uploadMedia(file: File): Promise<string> {
  if (file.type.startsWith("image/")) return uploadImage(file);
  if (!/^(audio|video)\//.test(file.type)) throw new Error("Only image, audio or video files.");
  if (file.size > 50e6) throw new Error("File too large (50 MB max).");
  const { data: { user } } = await supabase.auth.getUser();
  const ext = (file.name.split(".").pop() ?? "bin").replace(/[^a-z0-9]/gi, "").slice(0, 5);
  const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (error) throw error;
  fresh.push(path);
  return path;
}
