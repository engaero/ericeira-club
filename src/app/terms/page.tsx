"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, Scale, AlertTriangle, FileText } from "lucide-react";

export default function TermsPage() {
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
            Termos Legais
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 pt-10 space-y-10">
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Termos e Condições Gerais</h1>
          <p className="text-sm text-stone-600">Última atualização: Outubro de 2026</p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-8 text-sm leading-relaxed text-stone-700">
          
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-700" /> 1. Natureza do Serviço e Intermediação
            </h2>
            <p>
              O <strong>Ericeira Hub</strong> atua exclusivamente como intermediário tecnológico e facilitador de agendamentos e cobranças, ligando utilizadores particulares e empresas a prestadores de serviços, instrutores independentes e profissionais freelancers sediados na região da Ericeira e concelho de Mafra.
            </p>
            <p>
              O contrato de prestação de serviços relativo a aulas, treinos ou workshops é celebrado diretamente entre o cliente e o respetivo prestador verificado.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" /> 2. Atividades Físicas e Responsabilidade Civil
            </h2>
            <p>
              O cliente reconhece que a prática de atividades desportivas (incluindo surf, yoga, pilates e treinos funcionais) envolve riscos físicos inerentes. 
            </p>
            <p>
              É da exclusiva responsabilidade de cada instrutor e escola manter em vigor os seguros obrigatórios por lei em Portugal (Seguro de Acidentes Pessoais e Responsabilidade Civil para Animação Turística e Atividade Física). O Ericeira Hub não assume qualquer responsabilidade direta por lesões, acidentes ou perdas materiais ocorridas no decurso das sessões.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-teal-700" /> 3. Isenção em Matéria de Saúde, Fiscalidade e Ensino
            </h2>
            <p>
              Os guias, resumos informativos e orientações disponibilizados no âmbito do <strong>Concierge Familiar</strong> têm caráter puramente informativo, administrativo e de navegação bilingue de serviços locais:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Não constituem aconselhamento médico, diagnóstico ou ato clínico. Qualquer decisão terapêutica deve ser discutida diretamente com profissionais de saúde habilitados (ex: Cintramédica ou SNS).</li>
              <li>Não constituem consulta jurídica, parecer vinculativo ou procuradoria ilícita. Aconselhamentos fiscais ou legais específicos devem ser realizados com advogados ou contabilistas certificados inscritos nas respetivas ordens profissionais.</li>
              <li>As colocações e matrículas escolares dependem exclusivamente dos critérios oficiais do Ministério da Educação e da gestão dos agrupamentos escolares do concelho de Mafra.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-700" /> 4. Política de Créditos e Cancelamentos
            </h2>
            <p>
              Os cancelamentos de reservas com reposição integral de créditos no <em>Ericeira Pass</em> devem ser efetuados com um mínimo de <strong>12 horas de antecedência</strong> em relação ao horário de início da sessão agendada. Cancelamentos efetuados com menos de 12 horas não conferem direito a estorno ou reposição de créditos, salvaguardando a vaga reservada ao instrutor.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-stone-900">5. Resolução Alternativa de Litígios e Reclamações</h2>
            <p>
              Em caso de litígio de consumo no território português, o consumidor pode recorrer a uma entidade de Resolução Alternativa de Litígios de Consumo (ex: CNIACC - Centro Nacional de Informação e Arbitragem de Conflitos de Consumo) ou apresentar reclamação no Livro de Reclamações Eletrónico oficial disponível em <em>www.livroreclamacoes.pt</em>.
            </p>
          </section>

        </div>
      </main>
    </div>
  );
}