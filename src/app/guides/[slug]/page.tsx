"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { authFetch, authJson } from "@/lib/apiClient";
import { useLanguage } from "@/context/LanguageContext";

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface Guide {
  title_en: string;
  title_pt?: string | null;
  summary_public?: string | null;
  summary_pt?: string | null;
  category: string;
  content_private_markdown?: string;
}

const COPY = {
  pt: {
    loading: "A carregar guia...",
    notFound: "Guia não encontrado.",
    back: "Voltar ao Hub",
    backHome: "Voltar à página inicial",
    active: "Acesso de Membro Ativo",
    lockedTitle: "Conteúdo Exclusivo para Membros",
    lockedBody:
      "Acede a contactos diretos de médicos e escolas, instruções de matrícula em Mafra, procedimentos burocráticos e suporte bilingue via WhatsApp.",
    subscribe: "Subscrever Concierge Familiar (49€/mês)",
    cancelAnytime: "Cancela a qualquer momento sem compromisso.",
    signInFirst: "Entra primeiro com o teu e-mail (botão «Entrar» no topo da página).",
    error: "Não foi possível iniciar o pagamento. Tenta novamente.",
  },
  en: {
    loading: "Loading guide...",
    notFound: "Guide not found.",
    back: "Back to Hub",
    backHome: "Back to home page",
    active: "Active Member Access",
    lockedTitle: "Members-Only Content",
    lockedBody:
      "Get direct contacts for doctors and schools, enrolment instructions in Mafra, bureaucracy walkthroughs and bilingual WhatsApp support.",
    subscribe: "Subscribe to Family Concierge (€49/month)",
    cancelAnytime: "Cancel anytime, no strings attached.",
    signInFirst: "Please sign in first with your email (“Sign In” button at the top of the page).",
    error: "Could not start the payment. Please try again.",
  },
} as const;

function GuideContent({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { lang } = useLanguage();
  const t = COPY[lang === "en" ? "en" : "pt"];

  const [guide, setGuide] = useState<Guide | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // O servidor decide se este utilizador tem acesso e só então envia o conteúdo privado.
        const res = await authFetch(`/api/guides/${encodeURIComponent(slug)}`);
        if (res.ok) {
          const json = await res.json();
          setGuide(json.guide);
          setHasAccess(Boolean(json.hasAccess));
          setIsAuthenticated(Boolean(json.isAuthenticated));
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [slug]);

  async function handleSubscribe() {
    setNotice(null);
    if (!isAuthenticated) {
      setNotice(t.signInFirst);
      return;
    }
    try {
      const data = await authJson<{ url?: string }>("/api/checkout", {
        body: { itemType: "concierge_subscription" },
      });
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setNotice(err instanceof Error && err.message ? err.message : t.error);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
        {t.loading}
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 text-stone-700 font-sans">
        <p>{t.notFound}</p>
        <button onClick={() => router.push("/")} className="text-teal-700 font-semibold hover:underline cursor-pointer">
          {t.backHome}
        </button>
      </div>
    );
  }

  const title = lang === "pt" ? guide.title_pt || guide.title_en : guide.title_en || guide.title_pt;
  const summary = lang === "pt" ? guide.summary_pt || guide.summary_public : guide.summary_public || guide.summary_pt;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> {t.back}
          </button>
          <span className="text-xs uppercase tracking-wider font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full">
            {guide.category.replaceAll("_", " ")}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900">{title}</h1>
          {summary && (
            <p className="text-lg text-stone-600 bg-white p-5 rounded-2xl border border-stone-200">{summary}</p>
          )}
        </div>

        {hasAccess && guide.content_private_markdown ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4 max-w-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t.active}
            </div>
            <div className="pt-4 text-stone-800 leading-relaxed whitespace-pre-wrap">
              <ReactMarkdown>{guide.content_private_markdown}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 md:p-12 rounded-3xl border-2 border-dashed border-stone-300 text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>

            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-2xl font-bold">{t.lockedTitle}</h3>
              <p className="text-sm text-stone-600">{t.lockedBody}</p>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSubscribe}
                className="px-6 py-3 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition shadow cursor-pointer"
              >
                {t.subscribe}
              </button>
              <p className="text-xs text-stone-400 mt-2">{t.cancelAnytime}</p>
              {notice && (
                <p role="alert" className="text-xs text-red-700 mt-3">
                  {notice}
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GuideDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
          …
        </div>
      }
    >
      <GuideContent {...props} />
    </Suspense>
  );
}
