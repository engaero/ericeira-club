"use client";

import { useState } from "react";
import { X, Send, Briefcase, Mail, Phone, Building, CheckCircle2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  freelancer: any | null;
  onClose: () => void;
}

export default function B2BInquiryModal({ isOpen, freelancer, onClose }: Props) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [estimatedBudget, setEstimatedBudget] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  if (!isOpen || !freelancer) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/b2b/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: freelancer.id,
          clientName,
          clientEmail,
          clientPhone,
          companyName,
          projectDescription,
          estimatedBudgetEur: estimatedBudget,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao enviar pedido de contacto.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSuccess(false);
    setErrorMsg("");
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setCompanyName("");
    setProjectDescription("");
    setEstimatedBudget("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl relative border border-stone-200 my-8">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900">Pedido Enviado!</h3>
            <p className="text-sm text-stone-600 max-w-sm mx-auto">
              O teu pedido de colaboração foi transmitido diretamente para <strong>{freelancer.name}</strong>. Receberás uma resposta brevemente no teu e-mail ou telefone.
            </p>
            <button
              onClick={handleClose}
              className="mt-4 px-6 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 transition cursor-pointer"
            >
              Concluir
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-50 text-teal-800">
                {freelancer.category}
              </span>
              {freelancer.hourly_rate_eur && (
                <span className="text-xs font-semibold text-stone-500">
                  {freelancer.hourly_rate_eur}€ / hora
                </span>
              )}
            </div>

            <h3 className="text-xl font-bold text-stone-900">
              Contactar {freelancer.name}
            </h3>
            <p className="text-xs text-stone-500 mb-6">
              Envia uma proposta de colaboração para trabalho presencial ou remoto na Ericeira.
            </p>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl mb-4 border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    O teu Nome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Duarte Mendes"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Empresa / Marca
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="ex: Surf Camp Ericeira"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    O teu E-mail *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      placeholder="email@exemplo.pt"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="+351 912 345 678"
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Orçamento Estimado (€)
                </label>
                <input
                  type="number"
                  min="20"
                  step="10"
                  placeholder="ex: 250 (deixa em branco se for a combinar)"
                  value={estimatedBudget}
                  onChange={(e) => setEstimatedBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                  Descrição do Projeto / Necessidade *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explica o que precisas: número de fotos, tradução de website, branding para novo espaço, etc."
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2 shadow"
              >
                <Send className="w-4 h-4" />
                {loading ? "A enviar proposta..." : "Enviar Pedido de Contacto"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}