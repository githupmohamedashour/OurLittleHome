import "./globals.css";
export const metadata = { title: "Our Little World" };
export default function R({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="font-sans antialiased">{children}</body></html>;
}
