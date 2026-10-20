"use client";

import { useState } from "react";
import { X, Check, Sparkles, CreditCard } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage: (packageId: string) => void;
}

export default function PackagesModal({ isOpen, onClose, onSelectPackage }: Props) {
  const { lang } = useLanguage();
  const [selected, setSelected] = useState("pack_35");

  if (!isOpen) return null;

  const packages = [
    {
      id: "pack_12",
      name: lang === "pt" ? "Pack Iniciante" : "Starter Pack",
      credits: 12,
      price: 59,
      dropInEquivalent: 72, // 3 aulas avulso de 24€ = 72€
      badge: null,
      desc: lang === "pt" 
        ? "Dá para 3 aulas de 20€ (4 créditos cada). Evitas a sobretaxa de bilhete avulso e poupas 13€." 
        : "Covers 3 standard classes (4 credits each). Skip drop-in fees and save 13€.",
    },
    {
      id: "pack_35",
      name: "Ericeira Pass",
      credits: 35,
      price: 165,
      dropInEquivalent: 210, // Equivalente avulso = 210€
      badge: lang === "pt" ? "Mais Popular • Poupa 45€" : "Most Popular • Save 45€",
      desc: lang === "pt" 
        ? "Dá para 7 a 9 aulas na vila. Uma aula de 24€ avulso fica-te por apenas 18,80€." 
        : "Covers 7 to 9 classes. A 24€ drop-in class costs you just 18.80€.",
    },
    {
      id: "pack_70",
      name: lang === "pt" ? "Pack Comunidade / Pro" : "Community Pro",
      credits: 70,
      price: 315,
      dropInEquivalent: 420, // Equivalente avulso = 420€
      badge: lang === "pt" ? "Máxima Poupança • Poupa 105€" : "Best Value • Save 105€",
      desc: lang === "pt" 
        ? "Apenas 4,50€/crédito. Uma aula de 24€ avulso sai-te a 18,00€. Ideal para residentes." 
        : "Just 4.50€/credit. A 24€ drop-in class costs you 18.00€. Ideal for locals.",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200 my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-8">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {lang === "pt" ? "Zero Taxas Avulso • Poupança até 25%" : "Zero Drop-in Fees • Save up to 25%"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-stone-900">
            {lang === "pt" ? "Escolhe o teu Pacote de Créditos" : "Choose Your Credit Pack"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
            {lang === "pt"
              ? "Com créditos pagas a tarifa de membro e evitas os +20% das compras avulso. Válidos em todas as modalidades durante 6 meses."
              : "With credits you unlock member rates and skip the +20% single-ticket fee. Valid across all activities for 6 months."}
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {packages.map((pkg) => {
            const isSel = selected === pkg.id;
            return (
              <div
                key={pkg.id}
                onClick={() => setSelected(pkg.id)}
                className={`rounded-2xl p-5 border-2 cursor-pointer transition-all flex flex-col justify-between relative ${
                  isSel
                    ? "border-sky-600 bg-sky-50/40 shadow-md"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                {pkg.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-stone-950 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                    {pkg.badge}
                  </span>
                )}

                <div className="space-y-3">
                  <div className="pt-1">
                    <h3 className="font-extrabold text-stone-900 text-base">{pkg.name}</h3>
                    <p className="text-[11px] text-stone-500 leading-tight mt-1">{pkg.desc}</p>
                  </div>

                  <div>
                    <span className="text-2xl font-black text-stone-900">{pkg.price}€</span>
                    <span className="text-xs text-stone-400 block line-through">
                      {pkg.dropInEquivalent}€ {lang === "pt" ? "em avulso" : "drop-in"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-stone-100 text-xs text-stone-700 space-y-1.5 font-medium">
                    <div className="flex items-center gap-1.5 text-teal-800">
                      <Check className="w-3.5 h-3.5 shrink-0" />
                      <span>{pkg.credits} {lang === "pt" ? "Créditos" : "Credits"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                      <Check className="w-3 h-3 shrink-0" />
                      <span>{lang === "pt" ? "Válido 6 meses" : "Valid 6 months"}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-center">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSel ? "border-sky-600 bg-sky-600 text-white" : "border-stone-300"
                  }`}>
                    {isSel && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            onSelectPackage(selected);
            onClose();
          }}
          className="w-full py-3.5 rounded-2xl bg-blue-950 hover:bg-blue-900 text-white font-extrabold text-sm transition shadow-lg cursor-pointer flex items-center justify-center gap-2"
        >
          <CreditCard className="w-4 h-4" />
          {lang === "pt" ? "Continuar para Pagamento Seguro" : "Proceed to Secure Checkout"}
        </button>
      </div>
    </div>
  );
}