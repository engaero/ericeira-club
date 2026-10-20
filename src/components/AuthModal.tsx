"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { X, Mail, CheckCircle } from "lucide-react";

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

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "http://localhost:3000",
      },
    });

    setLoading(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative border border-stone-200">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-stone-400 hover:text-stone-700"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-teal-600 mx-auto" />
            <h3 className="text-xl font-bold">Link de acesso enviado</h3>
            <p className="text-sm text-stone-600">
              Enviámos um link mágico para <strong>{email}</strong>. Clica no link do teu e-mail para entrar automaticamente.
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <h3 className="text-xl font-bold">Entrar no Ericeira Hub</h3>
              <p className="text-sm text-stone-500">
                Acede à tua carteira de créditos e reservas de bem-estar.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="o-teu-email@exemplo.pt"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 disabled:opacity-50 transition"
            >
              {loading ? "A enviar..." : "Enviar Magic Link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}