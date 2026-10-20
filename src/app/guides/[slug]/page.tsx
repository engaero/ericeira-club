"use client";

import { useEffect, useState, use, Suspense } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import { Lock, ArrowLeft, CheckCircle2 } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

function GuideContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const router = useRouter();

  const [guide, setGuide] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();
        setUserProfile(profile);
      }

      const { data: guideData } = await supabase
        .from("concierge_guides")
        .select("*")
        .eq("slug", slug)
        .single();

      if (guideData) {
        setGuide(guideData);
      }
      setLoading(false);
    }

    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
        A carregar guia...
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center gap-4 text-stone-700 font-sans">
        <p>Guia não encontrado.</p>
        <button onClick={() => router.push("/")} className="text-teal-700 font-semibold hover:underline">
          Voltar à página inicial
        </button>
      </div>
    );
  }

  const hasAccess = userProfile?.concierge_tier && userProfile.concierge_tier !== "free";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button 
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>
          <span className="text-xs uppercase tracking-wider font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full">
            {guide.category.replace("_", " ")}
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-8">
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900">{guide.title_en}</h1>
          <p className="text-lg text-stone-600 bg-white p-5 rounded-2xl border border-stone-200">
            {guide.summary_public}
          </p>
        </div>

        {hasAccess ? (
          <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4 max-w-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" /> Acesso de Membro Ativo
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
              <h3 className="text-2xl font-bold">Conteúdo Exclusivo para Membros</h3>
              <p className="text-sm text-stone-600">
                Acede a contactos diretos de médicos e escolas, instruções de matrícula em Mafra, procedimentos burocráticos e suporte bilingue via WhatsApp.
              </p>
            </div>

            <div className="pt-2">
              <button 
                onClick={async () => {
                  if (!currentUser) {
                    alert("Por favor volta à página inicial e entra com o teu e-mail.");
                    return;
                  }
                  const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: currentUser.id,
                      userEmail: currentUser.email,
                      itemType: "concierge_subscription",
                    }),
                  });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                }}
                className="px-6 py-3 rounded-xl bg-stone-900 text-white font-semibold text-sm hover:bg-stone-800 transition shadow cursor-pointer"
              >
                Subscrever Concierge Familiar (49€/mês)
              </button>
              <p className="text-xs text-stone-400 mt-2">Cancela a qualquer momento sem compromisso.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function GuideDetailPage(props: PageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-stone-50 flex items-center justify-center text-stone-500 font-sans">
        A carregar guia...
      </div>
    }>
      <GuideContent {...props} />
    </Suspense>
  );
}