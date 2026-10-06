export default function Modal({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-black/40"><div className="card fade w-full max-w-md max-h-[90vh] overflow-auto p-6" style={{ background: "var(--bg)" }}>{children}</div></div>;
}
