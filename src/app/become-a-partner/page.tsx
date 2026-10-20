"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AuthModal from "@/components/AuthModal";
import { ArrowLeft, Sparkles, CheckCircle2, User, Send } from "lucide-react";

export default function BecomePartnerPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [type, setType] = useState("instructor");
  const [category, setCategory] = useState("yoga");
  const [bioEn, setBioEn] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [telegramChatId, setTelegramChatId] = useState("");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setCurrentUser(session.user);
      
      // Se já tiver perfil de prestador, encaminha diretamente para o seu portal
      const { data: existing } = await supabase
        .from("providers")
        .select("id")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (existing) {
        router.push("/provider/portal");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/provider/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          name,
          type,
          category,
          bioEn,
          telegramChatId: telegramChatId.trim(),
          email: currentUser.email,
          hourlyRateEur: hourlyRate ? parseFloat(hourlyRate) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redireciona de imediato para o portal do instrutor
      router.push("/provider/portal");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao criar perfil.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans pb-20">
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          setIsAuthOpen(false);
          checkUser();
        }}
      />

      {/* HEADER */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
          </button>
          <span className="text-xs font-bold text-teal-800 bg-teal-50 px-3 py-1 rounded-full uppercase">
            Junta-te à Comunidade
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-10 space-y-8">
        <div className="space-y-2 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-800 border border-teal-200">
            <Sparkles className="w-3.5 h-3.5" /> Instrutores, Terapeutas & Freelancers Locais
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Registar como Parceiro</h1>
          <p className="text-sm text-stone-600">
            Disponibiliza as tuas aulas na agenda comunitária ou integra a bolsa de talento B2B da Ericeira.
          </p>
        </div>

        {!currentUser && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
            <div className="text-xs text-amber-900">
              <strong className="block font-bold">Início de sessão necessário</strong>
              Precisas de entrar com o teu e-mail antes de submeter a tua candidatura.
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition cursor-pointer"
            >
              Entrar Agora
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-red-50 text-red-700 text-xs rounded-2xl border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Nome Profissional / Estúdio
            </label>
            <input
              type="text"
              required
              placeholder="ex: Marta Silva ou Ericeira Sound Journeys"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Tipo de Perfil
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="instructor">Instrutor / Formador (Aulas & Workshops)</option>
                <option value="freelancer">Freelancer Profissional (Bolsa B2B)</option>
                <option value="both">Ambos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Categoria Principal
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="yoga">Yoga & Meditação</option>
                <option value="surf">Surf & Treino Funcional</option>
                <option value="breathwork">Breathwork & Sound Healing</option>
                <option value="coffee">Workshop Café de Especialidade</option>
                <option value="wine">Vinhos & Gastronomia Local</option>
                <option value="ple">Português para Estrangeiros (PLE)</option>
                <option value="photographer">Fotógrafo / Vídeo</option>
                <option value="copywriter">Copywriter / Tradutor</option>
                <option value="marketing">Consultor de Marketing / Digital</option>
              </select>
            </div>
          </div>

          {(type === "freelancer" || type === "both") && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Tarifa Horária Indicativa (€ / hora)
              </label>
              <input
                type="number"
                min="10"
                step="5"
                placeholder="ex: 50"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Biografia / Descrição Resumida (em inglês ou português)
            </label>
            <textarea
              rows={3}
              required
              placeholder="Descreve a tua experiência, formação e onde costumas dar aulas ou trabalhar na vila."
              value={bioEn}
              onChange={(e) => setBioEn(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
              Telegram Chat ID (Para Notificações Imediatas de Reservas)
            </label>
            <input
              type="text"
              placeholder="ex: 987654321 (obtido via @userinfobot)"
              value={telegramChatId}
              onChange={(e) => setTelegramChatId(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Opcional mas recomendado. Recebes um alerta no Telegram sempre que um aluno marcar uma vaga.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow"
          >
            <Send className="w-4 h-4" />
            {loading ? "A registar perfil..." : "Concluir Registo e Ir para o Portal"}
          </button>
        </form>
      </main>
    </div>
  );
}