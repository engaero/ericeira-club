"use client";

import { useState } from "react";
import { X, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { CREDIT_PACKS } from "@/lib/pricing";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectPackage?: (packageId: string) => void;
  onSelectPack?: (packageId: string) => void;
}

export default function PackagesModal({
  isOpen,
  onClose,
  onSelectPackage,
  onSelectPack,
}: Props) {
  const { lang } = useLanguage();
  const [selectedPackId, setSelectedPackId] = useState<string>("pack_35");

  if (!isOpen) return null;

  const packs = Object.values(CREDIT_PACKS);

  function handleConfirm() {
    if (onSelectPackage) {
      onSelectPackage(selectedPackId);
    } else if (onSelectPack) {
      onSelectPack(selectedPackId);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 overflow-hidden shadow-2xl border border-stone-200 relative my-6 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-xl hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-2 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>{lang === "pt" ? "Ericeira Pass Oficial" : "Official Ericeira Pass"}</span>
          </div>
          <h3 className="text-2xl font-black text-stone-900 tracking-tight">
            {lang === "pt" ? "Escolhe o teu Pacote de Créditos" : "Choose Your Credit Pack"}
          </h3>
          <p className="text-xs text-stone-500 leading-relaxed">
            {lang === "pt"
              ? "Usa créditos para reservar aulas em múltiplos estúdios e instrutores na Ericeira sem subscrições fixas."
              : "Use credits across verified studios and hosts in Ericeira with complete flexibility."}
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
          {packs.map((pack) => {
            const isSelected = selectedPackId === pack.id;
            return (
              <div
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? "border-stone-900 bg-stone-50/70 shadow-sm ring-2 ring-stone-900"
                    : "border-stone-200 hover:border-stone-300 bg-white"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-stone-900">{pack.name}</span>
                    {pack.popular && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-orange-100 text-orange-900 border border-orange-200">
                        {lang === "pt" ? "Mais Popular" : "Best Value"}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    {pack.credits} {lang === "pt" ? "créditos" : "credits"} • ~{Math.round(pack.credits / 3)}{" "}
                    {lang === "pt" ? "sessões estimadas" : "estimated sessions"}
                  </p>
                  {pack.savingsEur > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      {lang === "pt"
                        ? `Poupança real de ${pack.savingsEur} € face ao valor avulso`
                        : `Real savings of ${pack.savingsEur} € vs drop-in rate`}
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-stone-900">{pack.priceEur} €</div>
                  {pack.savingsEur > 0 && (
                    <span className="text-[11px] text-stone-400 line-through block">
                      {pack.originalValueEur} €
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-6 mt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {lang === "pt"
                ? "Pagamento seguro Stripe • Créditos válidos por 90 dias"
                : "Secure Stripe checkout • Credits valid for 90 days"}
            </span>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{lang === "pt" ? "Continuar para Pagamento" : "Proceed to Checkout"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}