"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Database, UserCheck, Shield } from "lucide-react";

export default function PrivacyPage() {
  const router = useRouter();

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
          <span className="text-xs bg-stone-100 text-stone-800 px-3 py-1 rounded-full font-bold uppercase">
            RGPD & Privacidade
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Política de Privacidade e Dados</h1>
          <p className="text-sm text-stone-600">Em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD / GDPR).</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8 text-sm leading-relaxed text-stone-700">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-700" /> 1. Dados Recolhidos
            </h2>
            <p>
              O Ericeira Hub recolhe apenas os dados estritamente necessários para a autenticação, gestão de reservas e faturação de serviços:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Identificação e Contacto:</strong> E-mail de autenticação, nome completo e número de telefone/WhatsApp facultados voluntariamente no perfil.</li>
              <li><strong>Dados de Pagamento:</strong> Os dados de cartões bancários e pagamentos são processados de forma encriptada diretamente pela entidade financeira licenciada (Stripe Payments Europe, Ltd.), não tendo o Ericeira Hub acesso aos dados sensíveis de pagamento.</li>
              <li><strong>Dados de Prestadores:</strong> Informações biográficas, área de especialidade e identificadores de contacto (Telegram/E-mail) para notificações de serviço.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-5 h-5 text-teal-700" /> 2. Finalidade e Partilha de Dados
            </h2>
            <p>
              Os dados dos utilizadores destinam-se exclusivamente à gestão de inscrições e emissão de comprovativos de reserva. Quando uma vaga é reservada, apenas o nome e e-mail/contacto do aluno são partilhados com o respetivo instrutor para efeitos de controlo de presenças e eventuais avisos meteorológicos da sessão.
            </p>
            <p>
              Os dados nunca são vendidos nem comercializados com terceiros para fins de marketing não autorizado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-teal-700" /> 3. Direitos do Titular dos Dados
            </h2>
            <p>
              Ao abrigo do RGPD, o utilizador tem o direito de aceder, retificar, exportar ou solicitar a eliminação definitiva da sua conta e dados pessoais. Qualquer pedido pode ser exercido diretamente através do seu painel de perfil ou mediante contacto com a administração da plataforma.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-700" /> 4. Cookies e Tecnologias de Sessão
            </h2>
            <p>
              A plataforma utiliza apenas cookies e identificadores de sessão estritamente técnicos (necessários para manter a sessão iniciada via Supabase e garantir o processamento seguro de compras com a Stripe). Não são utilizados rastreadores de publicidade de terceiros.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}