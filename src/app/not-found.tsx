import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center font-sans">
      <h2 className="text-xl font-black text-stone-900">404 — Página não encontrada / Page not found</h2>
      <Link href="/" className="text-teal-700 font-semibold hover:underline">
        Ericeira Hub
      </Link>
    </div>
  );
}
