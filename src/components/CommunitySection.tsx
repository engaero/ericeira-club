"use client";

import { useState } from "react";
import { HeartPulse, CheckCircle2, Lock, Briefcase } from "lucide-react";
import B2BInquiryModal from "@/components/B2BInquiryModal";
import { useLanguage } from "@/context/LanguageContext";

interface Props {
  guides: any[];
  freelancers: any[];
  isConciergeActive: boolean;
  onSubscribe: () => void;
}

export default function CommunitySection({
  guides,
  freelancers,
  isConciergeActive,
  onSubscribe,
}: Props) {
  const { lang, t } = useLanguage();
  const [selectedFreelancer, setSelectedFreelancer] = useState<any | null>(null);

  return (
    <>
      <B2BInquiryModal
        isOpen={Boolean(selectedFreelancer)}
        freelancer={selectedFreelancer}
        onClose={() => setSelectedFreelancer(null)}
      />

      {/* PILAR 2: CONCIERGE FAMILIAR & SAÚDE */}
      <section id="concierge" className="bg-white rounded-3xl p-8 border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-6">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              <HeartPulse className="w-3.5 h-3.5 text-teal-700" /> {t("sec2_badge")}
            </span>
            <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight">{t("sec2_title")}</h2>
            <p className="text-stone-600 text-sm max-w-2xl">{t("sec2_desc")}</p>
          </div>

          {isConciergeActive ? (
            <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {t("sub_active")}
            </span>
          ) : (
            <button
              onClick={onSubscribe}
              className="px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition shrink-0 cursor-pointer shadow-xs"
            >
              {t("btn_subscribe_concierge")}
            </button>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {guides.map((g) => (
            <div
              key={g.id}
              className="p-6 rounded-2xl bg-stone-50/70 border border-stone-200/90 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                  {g.category.replace("_", " ")}
                </span>
                <h3 className="text-lg font-bold text-stone-900 leading-snug">{g.title_en}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">{g.summary_public}</p>
              </div>

              <div
                onClick={() => {
                  window.location.href = `/guides/${g.slug}`;
                }}
                className="p-3.5 rounded-xl bg-white border border-stone-200/80 flex items-center justify-between text-xs text-stone-500 cursor-pointer hover:border-teal-600 transition shadow-2xs"
              >
                <span className="flex items-center gap-1.5 font-medium text-stone-700">
                  <Lock className="w-4 h-4 text-amber-600" />{" "}
                  {isConciergeActive ? t("unlocked_guide") : t("locked_guide")}
                </span>
                <span className="text-teal-700 font-bold hover:underline">{t("open_guide")}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PILAR 3: TALENTO LOCAL B2B */}
      <section id="b2b" className="space-y-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 mb-2">
            <Briefcase className="w-3.5 h-3.5 text-teal-700" /> {t("sec3_badge")}
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-stone-900">
            {t("sec3_title")}
          </h2>
          <p className="text-stone-600 text-sm max-w-2xl">{t("sec3_desc")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {freelancers.map((f) => (
            <div
              key={f.id}
              className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-xs flex flex-col justify-between gap-5 hover:shadow-md transition-all duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    {f.category}
                  </span>
                  <span className="text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" /> {t("verified_local")}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-stone-900">{f.name}</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {lang === "pt" ? (f.bio_pt || f.bio_en) : (f.bio_en || f.bio_pt)}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs font-extrabold text-stone-900">
                  {f.hourly_rate_eur ? `${f.hourly_rate_eur}€ / ${t("per_hour")}` : t("on_request")}
                </span>
                <button
                  onClick={() => setSelectedFreelancer(f)}
                  className="text-xs font-bold text-teal-700 hover:text-teal-900 hover:underline cursor-pointer"
                >
                  {t("btn_inquiry")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER GLOBAL E LINKS LEGAIS */}
      <footer className="pt-10 border-t border-stone-200 space-y-4 text-xs text-stone-500">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{t("footer_copy")}</p>
          <div className="flex items-center gap-6">
            <a href="/become-a-partner" className="text-stone-600 hover:text-stone-900 font-semibold transition">
              {t("footer_partner")}
            </a>
            <a href="/provider/portal" className="text-teal-700 font-bold hover:underline">
              {t("footer_portal")}
            </a>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-[11px] text-stone-400">
          <div className="flex items-center gap-4">
            <a href="/terms" className="hover:text-stone-600 hover:underline">
              {t("footer_terms")}
            </a>
            <a href="/privacy" className="hover:text-stone-600 hover:underline">
              {t("footer_privacy")}
            </a>
            <a
              href="https://www.livroreclamacoes.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-stone-600 hover:underline"
            >
              {t("footer_complaints")}
            </a>
          </div>
          <span>Ericeira, Mafra — Portugal</span>
        </div>
      </footer>
    </>
  );
}