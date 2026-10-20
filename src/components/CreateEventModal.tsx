"use client";

import { useState } from "react";
import { X, MapPin, Euro, Users, Clock, Info } from "lucide-react";

interface Props {
  isOpen: boolean;
  providerId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ isOpen, providerId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [titleEn, setTitleEn] = useState("");
  const [category, setCategory] = useState("yoga");
  const [locationName, setLocationName] = useState("Parque de Santa Marta");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  
  // Tarifa base pretendida pelo instrutor (múltiplos de 5€)
  const [memberBasePrice, setMemberBasePrice] = useState(20);
  const [maxSpots, setMaxSpots] = useState(10);

  if (!isOpen) return null;

  // Cálculos automáticos transparentes para o instrutor
  const creditsCost = Math.max(1, Math.round(memberBasePrice / 5));
  const dropInPriceEur = Math.round(creditsCost * 5 * 1.20); // +20% no bilhete avulso
  const instructorNetEarnings = (creditsCost * 4).toFixed(2); // 4.00€ líquidos por crédito (80%)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/provider/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId,
          titleEn,
          titlePt: titleEn,
          category,
          locationName,
          googleMapsUrl,
          startTime: new Date(startTime).toISOString(),
          durationMinutes,
          priceEur: dropInPriceEur,
          creditsCost,
          maxSpots,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao publicar a aula.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl relative border border-stone-200 my-8">
        <button onClick={onClose} className="absolute top-5 right-5 text-stone-400 hover:text-stone-700 cursor-pointer">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold mb-1">Publicar Nova Sessão / Workshop</h3>
        <p className="text-xs text-stone-500 mb-6">Ficará imediatamente disponível para reservas no calendário da vila.</p>

        {errorMsg && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl mb-4">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Título da Sessão</label>
            <input
              type="text"
              required
              placeholder="ex: Morning Vinyasa Flow & Breathwork"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none bg-white"
              >
                <option value="yoga">Yoga</option>
                <option value="surf">Surf</option>
                <option value="pilates">Pilates</option>
                <option value="breathwork">Breathwork</option>
                <option value="coffee">Workshop Café</option>
                <option value="wine">Prova de Vinhos</option>
                <option value="ple">Português (PLE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Localização</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="ex: Praia da Foz do Lizandro"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Link Google Maps (Opcional)</label>
            <input
              type="url"
              placeholder="https://maps.app.goo.gl/..."
              value={googleMapsUrl}
              onChange={(e) => setGoogleMapsUrl(e.target.value)}
              className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Data e Hora de Início</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Duração (minutos)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">
                Tarifa Base Membro (Múltiplos 5€)
              </label>
              <div className="relative">
                <Euro className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="10"
                  step="5"
                  value={memberBasePrice}
                  onChange={(e) => setMemberBasePrice(parseFloat(e.target.value) || 20)}
                  className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase mb-1">Lotação Máx.</label>
              <div className="relative">
                <Users className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={maxSpots}
                  onChange={(e) => setMaxSpots(parseInt(e.target.value, 10))}
                  className="w-full pl-8 pr-3 py-2 border border-stone-300 rounded-xl focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* CAIXA DE RESUMO FINANCEIRO AUTOMÁTICO PARA O INSTRUTOR */}
          <div className="p-3.5 rounded-2xl bg-sky-50 border border-sky-200 text-xs space-y-1.5 text-sky-950">
            <div className="flex items-center gap-1.5 font-bold">
              <Info className="w-4 h-4 text-sky-700 shrink-0" />
              <span>Resumo Automático de Preços e Comissões:</span>
            </div>
            <p className="text-[11px] text-sky-900">
              • <strong>Custo no Ericeira Pass:</strong> {creditsCost} créditos ({creditsCost * 5}€ valor base)<br />
              • <strong>Preço Bilhete Avulso (+20%):</strong> {dropInPriceEur}€<br />
              • <strong>O teu ganho líquido por aluno (80%):</strong> <span className="font-extrabold underline">{instructorNetEarnings}€</span>
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-teal-700 text-white font-semibold text-sm hover:bg-teal-800 disabled:opacity-50 transition cursor-pointer shadow"
          >
            {loading ? "A publicar..." : "Publicar Sessão na Agenda"}
          </button>
        </form>
      </div>
    </div>
  );
}