"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Globe } from "lucide-react";

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-full text-xs font-semibold border border-stone-200">
      <Globe className="w-3.5 h-3.5 text-stone-500 ml-1.5 mr-0.5" />
      <button
        onClick={() => setLang("pt")}
        className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
          lang === "pt"
            ? "bg-white text-stone-900 shadow-xs"
            : "text-stone-500 hover:text-stone-900"
        }`}
      >
        PT
      </button>
      <button
        onClick={() => setLang("en")}
        className={`px-2 py-0.5 rounded-full transition cursor-pointer ${
          lang === "en"
            ? "bg-white text-stone-900 shadow-xs"
            : "text-stone-500 hover:text-stone-900"
        }`}
      >
        EN
      </button>
    </div>
  );
}