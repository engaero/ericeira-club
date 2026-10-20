"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "pt" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  pt: {
    nav_wellness: "Bem-Estar & Cultura",
    nav_concierge: "Concierge Familiar",
    nav_b2b: "Talento Local B2B",
    btn_login: "Entrar",
    btn_logout: "Terminar Sessão",
    credits: "Créditos",
    my_profile: "O Meu Perfil",

    hero_badge: "Hub Comunitário de Integração • Ericeira & Mafra",
    hero_title: "A tua vida na Ericeira, sem barreiras nem isolamento.",
    hero_desc: "Uma agenda unificada para treinares e viveres a vila, apoio bilingue na integração familiar e médica, e uma rede verificada de talento local.",
    hero_f1: "✓ Zero mensalidades obrigatórias",
    hero_f2: "✓ Instrutores 100% locais",
    hero_f3: "✓ Cancelamento flexível 12h",

    pass_badge: "Passe Comunitário",
    pass_sub: "Pack de 10 Aulas",
    pass_title: "Ericeira Pass",
    pass_desc: "Liberdade total: faz Surf à segunda, Yoga à quarta e Café de especialidade ao sábado com a mesma carteira.",
    pass_save: "18€ / sessão (poupa até 30%)",
    pass_validity: "10 Créditos • Válido por 6 meses",
    btn_buy_pass: "Comprar Passe (180€)",

    sec1_badge: "Pilar 1 • Comunidade & Corpo",
    sec1_title: "Agenda Unificada de Bem-Estar & Cultura",
    sec1_desc: "Aulas avulso com instrutores locais independentes. Reserva instantânea por créditos ou pagamento direto.",
    cat_all: "Todas as Aulas",
    search_placeholder: "Pesquisar por aula, instrutor ou local...",
    all_locations: "Todas as localizações",
    all_dates: "Todas as datas",
    date_today: "Hoje",
    date_tomorrow: "Amanhã",
    date_week: "Próximos 7 dias",
    showing_sessions: "A mostrar sessões disponíveis",
    btn_clear_filters: "Limpar filtros",
    spots_left: "vagas",
    sold_out: "Esgotado",
    dropin: "avulso",
    or_credits: "ou crédito Pass",
    cancel_guarantee: "Cancelamento gratuito até 12h antes",
    btn_book: "Reservar Aula",

    sec2_badge: "Concierge Familiar Bilingue",
    sec2_title: "2. Saúde, Escolas & Burocracia em Mafra",
    sec2_desc: "Apoio administrativo e guias verificados para famílias expatriadas e novos residentes na Ericeira.",
    btn_subscribe_concierge: "Subscrever Concierge Familiar (49€/mês)",
    sub_active: "Subscrição Ativa",
    locked_guide: "Acesso Reservado a Subscritores",
    unlocked_guide: "Acesso Liberado",
    open_guide: "Abrir Guia →",

    sec3_badge: "Rede de Coworking & Negócios Locais",
    sec3_title: "3. Freelancers Locais Verificados (B2B)",
    sec3_desc: "Disponíveis para colaboração presencial nos coworks ou no teu negócio na Ericeira.",
    verified_local: "Verificado Local",
    btn_inquiry: "Pedir Contacto →",
    per_hour: "hora",
    on_request: "Sob Consulta",

    footer_copy: "© 2026 Ericeira Hub — Marketplace Comunitário & Bilheteira Hiperlocal.",
    footer_partner: "Tornar-se Parceiro / Instrutor",
    footer_portal: "Área de Instrutor →",
    footer_terms: "Termos e Condições",
    footer_privacy: "Política de Privacidade (RGPD)",
    footer_complaints: "Livro de Reclamações Eletrónico ↗"
  },
  en: {
    nav_wellness: "Wellness & Culture",
    nav_concierge: "Family Concierge",
    nav_b2b: "Local Talent B2B",
    btn_login: "Sign In",
    btn_logout: "Sign Out",
    credits: "Credits",
    my_profile: "My Profile",

    hero_badge: "Ericeira & Mafra Community Integration Hub",
    hero_title: "Your life in Ericeira, connected and supported.",
    hero_desc: "One unified calendar for drop-in classes, bilingual healthcare & school navigation, and coworker B2B connections.",
    hero_f1: "✓ No mandatory monthly commitments",
    hero_f2: "✓ 100% verified local teachers",
    hero_f3: "✓ Flexible 12h cancellation",

    pass_badge: "Community Pass",
    pass_sub: "10-Class Pack",
    pass_title: "Ericeira Pass",
    pass_desc: "Total freedom: Surf on Monday, Yoga on Wednesday, and Specialty Coffee on Saturday with the same wallet.",
    pass_save: "18€ / session (save up to 30%)",
    pass_validity: "10 Credits • Valid for 6 months",
    btn_buy_pass: "Buy Pass (180€)",

    sec1_badge: "Pillar 1 • Community & Movement",
    sec1_title: "Unified Wellness & Culture Calendar",
    sec1_desc: "Drop-in sessions with independent local instructors. Instant booking via credits or direct checkout.",
    cat_all: "All Classes",
    search_placeholder: "Search class, teacher, or beach...",
    all_locations: "All locations",
    all_dates: "All dates",
    date_today: "Today",
    date_tomorrow: "Tomorrow",
    date_week: "Next 7 days",
    showing_sessions: "Showing available sessions",
    btn_clear_filters: "Clear filters",
    spots_left: "spots left",
    sold_out: "Sold Out",
    dropin: "drop-in",
    or_credits: "or Pass credit",
    cancel_guarantee: "Free cancellation up to 12h prior",
    btn_book: "Book Session",

    sec2_badge: "Bilingual Family Concierge",
    sec2_title: "2. Healthcare, Schools & Bureaucracy in Mafra",
    sec2_desc: "Administrative navigation & step-by-step verified guides for expat and relocated families.",
    btn_subscribe_concierge: "Subscribe Family Concierge (49€/mo)",
    sub_active: "Active Membership",
    locked_guide: "Members-Only Access",
    unlocked_guide: "Full Access Granted",
    open_guide: "Open Guide →",

    sec3_badge: "Coworking & Local Business Network",
    sec3_title: "3. Verified Local Freelancers (B2B)",
    sec3_desc: "Available for in-person collaboration across Ericeira coworks or local businesses.",
    verified_local: "Verified Local",
    btn_inquiry: "Request Inquiry →",
    per_hour: "hour",
    on_request: "On Request",

    footer_copy: "© 2026 Ericeira Hub — Hyperlocal Community Marketplace.",
    footer_partner: "Become a Partner / Instructor",
    footer_portal: "Instructor Area →",
    footer_terms: "Terms & Conditions",
    footer_privacy: "Privacy Policy (GDPR)",
    footer_complaints: "Electronic Complaints Book ↗"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("pt");

  useEffect(() => {
    const saved = localStorage.getItem("ericeira_lang") as Language;
    if (saved && (saved === "pt" || saved === "en")) {
      setLangState(saved);
    }
  }, []);

  function setLang(newLang: Language) {
    setLangState(newLang);
    localStorage.setItem("ericeira_lang", newLang);
  }

  function t(key: string): string {
    return translations[lang][key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}