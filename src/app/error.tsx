"use client";

import { useEffect } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { lang } = useLanguage();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center font-sans">
      <h2 className="text-xl font-black text-stone-900">
        {lang === "pt" ? "Algo correu mal." : "Something went wrong."}
      </h2>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-orange-600 text-white text-xs font-bold uppercase tracking-wider transition cursor-pointer"
      >
        {lang === "pt" ? "Tentar novamente" : "Try again"}
      </button>
    </div>
  );
}
