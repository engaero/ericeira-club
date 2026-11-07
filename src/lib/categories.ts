// Categorias organizadas pelos 4 eixos estratégicos do Hub (fonte única para UI e validação).
export const CATEGORY_TABS = [
  { id: "all", label_pt: "Todas as Experiências", label_en: "All Sessions" },
  { id: "corpo_mente", label_pt: "🧘 Corpo & Mente", label_en: "🧘 Body & Mind" },
  { id: "artes_oficinas", label_pt: "🎨 Artes & Oficinas", label_en: "🎨 Arts & Crafts" },
  { id: "sabor_tradicao", label_pt: "🍷 Sabor & Tradição", label_en: "🍷 Taste & Wine" },
  { id: "comunidade_linguas", label_pt: "💬 Línguas & Social", label_en: "💬 Languages & Social" },
];

export const CATEGORY_MAPPING: Record<string, string[]> = {
  corpo_mente: ["wellness", "surf", "breathwork", "yoga"],
  artes_oficinas: ["crafts", "ceramics"],
  sabor_tradicao: ["wine", "coffee"],
  comunidade_linguas: ["ple", "social"],
};

export const CATEGORY_LABELS_MAP: Record<string, { pt: string; en: string; emoji: string }> = {
  wellness: { pt: "Wellness & Gelo", en: "Wellness & Ice", emoji: "🧊" },
  surf: { pt: "Treino Surf", en: "Surf Conditioning", emoji: "🏄" },
  breathwork: { pt: "Respiração & Foco", en: "Breathwork & Focus", emoji: "🌬️" },
  yoga: { pt: "Yoga", en: "Yoga", emoji: "🧘" },
  crafts: { pt: "Oficinas Manuais", en: "Crafts & Workshops", emoji: "🏺" },
  ceramics: { pt: "Cerâmica Manual", en: "Pottery & Ceramics", emoji: "🏺" },
  wine: { pt: "Vinho & Degustação", en: "Wine & Tasting", emoji: "🍷" },
  coffee: { pt: "Café Especial", en: "Specialty Coffee", emoji: "☕" },
  ple: { pt: "Português para Estrangeiros", en: "Portuguese for Expats", emoji: "🇵🇹" },
  social: { pt: "Encontros Comunitários", en: "Social Gatherings", emoji: "💬" },
};

export const CATEGORY_COVERS: Record<string, string> = {
  wellness: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  surf: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=800&q=80",
  breathwork: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80",
  crafts: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
  ceramics: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
  wine: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=800&q=80",
  coffee: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80",
  ple: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
  social: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=800&q=80",
};

/** Categorias que um prestador pode escolher ao criar uma sessão. */
export const EVENT_CATEGORIES = Object.keys(CATEGORY_LABELS_MAP);