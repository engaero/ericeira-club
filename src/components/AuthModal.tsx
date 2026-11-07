"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/context/LanguageContext";
import { X, Mail, CheckCircle, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const COPY = {
  pt: {
    title: "Entrar no Ericeira Hub",
    subtitle: "Acede à tua carteira de créditos, reservas e sessões da comunidade.",
    emailLabel: "E-mail",
    placeholder: "o-teu-email@exemplo.com",
    submit: "Enviar Magic Link",
    sending: "A enviar link...",
    sentTitle: "Link de Acesso Enviado",
    sentBody: "Enviámos um link mágico de acesso para",
    sentBody2: "Clica no link no teu e-mail para entrar automaticamente.",
    done: "Concluir",
    close: "Fechar",
    rateLimit: "Atingiste o limite temporário de envios de e-mail. Aguarda alguns minutos e tenta novamente.",
    generic: "Não foi possível enviar o link. Verifica o e-mail e tenta novamente.",
  },
  en: {
    title: "Sign in to Ericeira Hub",
    subtitle: "Access your credit wallet, bookings and community sessions.",
    emailLabel: "Email",
    placeholder: "your-email@example.com",
    submit: "Send Magic Link",
    sending: "Sending link...",
    sentTitle: "Access Link Sent",
    sentBody: "We sent a magic sign-in link to",
    sentBody2: "Click the link in your email to sign in automatically.",
    done: "Done",
    close: "Close",
    rateLimit: "Email sending limit reached temporarily. Please wait a few minutes and try again.",
    generic: "Could not send the link. Check your email address and try again.",
  },
} as const;

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const { lang } = useLanguage();
  const t = COPY[lang === "en" ? "en" : "pt"];

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Quando o utilizador volta pelo magic link (noutro separador) a sessão passa a existir:
  // avisamos quem abriu o modal, que decide o que fazer (recarregar, continuar o fluxo, etc.).
  useEffect(() => {
    if (!isOpen) return;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) onSuccess();
    });
    return () => subscription.unsubscribe();
  }, [isOpen, onSuccess]);

  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });

    setLoading(false);
    if (error) {
      // Nunca mostramos a mensagem crua do Supabase ao utilizador.
      console.error("[Auth] signInWithOtp:", error.message);
      setErrorMsg(/rate limit/i.test(error.message) ? t.rateLimit : t.generic);
    } else {
      setSubmitted(true);
    }
  }

  function handleClose() {
    setErrorMsg("");
    setSubmitted(false);
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans"
    >
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200">
        <button
          onClick={handleClose}
          aria-label={t.close}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 p-1 rounded-xl hover:bg-stone-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black text-stone-900">{t.sentTitle}</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
                {t.sentBody} <strong className="text-stone-900">{email}</strong>. {t.sentBody2}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 w-full py-3 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              {t.done}
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-stone-900">{t.title}</h3>
              <p className="text-xs text-stone-500">{t.subtitle}</p>
            </div>

            {errorMsg && (
              <div role="alert" className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="auth-email" className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                {t.emailLabel}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-900 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider disabled:opacity-50 transition shadow-md cursor-pointer"
            >
              {loading ? t.sending : t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
