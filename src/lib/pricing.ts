/**
 * Tabela única de preços, créditos e regras financeiras do Ericeira Hub.
 * Preço de referência: 1 crédito = 5,00 € (valor base das sessões comunitárias).
 */

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  amountCents: number;
  priceEur: number;
  originalValueEur: number;
  savingsEur: number;
  popular?: boolean;
}

/** Valor de referência de 1 crédito em euros. */
export const BASE_CREDIT_VALUE_EUR = 5.0;
export const CREDIT_VALUE_EUR = 5.0;

/** Comissão da plataforma nas compras diretas (20%). */
export const PLATFORM_COMMISSION_RATE = 0.2;

/** Validade dos créditos após cada compra (90 dias). */
export const CREDITS_VALIDITY_DAYS = 90;

export const CREDIT_PACKS: Record<string, CreditPack> = {
  pack_12: {
    id: "pack_12",
    name: "Pack Inicial (12 Créditos)",
    credits: 12,
    amountCents: 5900,
    priceEur: 59,
    originalValueEur: 60, // 12 * 5€ = 60€
    savingsEur: 1,
  },
  pack_35: {
    id: "pack_35",
    name: "Ericeira Pass (35 Créditos)",
    credits: 35,
    amountCents: 15500,
    priceEur: 155,
    originalValueEur: 175, // 35 * 5€ = 175€
    savingsEur: 20,
    popular: true,
  },
  pack_70: {
    id: "pack_70",
    name: "Community Club (70 Créditos)",
    credits: 70,
    amountCents: 29500,
    priceEur: 295,
    originalValueEur: 350, // 70 * 5€ = 350€
    savingsEur: 55,
  },
};

export type PackId = keyof typeof CREDIT_PACKS;

export function isPackId(value: unknown): value is PackId {
  return typeof value === "string" && value in CREDIT_PACKS;
}

/**
 * Calcula créditos sugeridos para uma aula com base no valor em Euros.
 * Cada 5 € equivale a 1 crédito.
 */
export function suggestedCreditsForPrice(priceEur: number): number {
  if (!priceEur || priceEur <= 0) return 1;
  return Math.max(1, Math.round(priceEur / BASE_CREDIT_VALUE_EUR));
}