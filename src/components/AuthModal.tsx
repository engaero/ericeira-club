"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Mail, CheckCircle, AlertCircle } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Determina o URL de retorno dinamicamente com base no ambiente (produção na Vercel ou local)
    const redirectUrl =
      typeof window !== "undefined"
        ? window.location.origin
        : "https://ericeira-club.vercel.app";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    setLoading(false);
    if (error) {
      if (error.message.includes("rate limit")) {
        setErrorMsg(
          "Limite temporário de envio de e-mails atingido pelo Supabase. Aguarda alguns minutos antes de tentar novamente ou acede via consola de administração."
        );
      } else {
        setErrorMsg(error.message);
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 font-sans">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200">
        <button
          onClick={handleClose}
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
              <h3 className="text-xl font-black text-stone-900">Link de Acesso Enviado</h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-xs mx-auto">
                Enviámos um link mágico de acesso para <strong className="text-stone-900">{email}</strong>. Clica no link no teu e-mail para entrar automaticamente.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="mt-2 w-full py-3 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black text-stone-900">Entrar no Ericeira Hub</h3>
              <p className="text-xs text-stone-500">
                Acede à tua carteira de créditos, reservas e sessões da comunidade.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="o-teu-email@exemplo.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-stone-200 bg-white text-stone-900 placeholder-stone-400 text-xs focus:outline-none focus:border-stone-900 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl bg-stone-900 hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider disabled:opacity-50 transition shadow-md cursor-pointer"
            >
              {loading ? "A enviar link..." : "Enviar Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}