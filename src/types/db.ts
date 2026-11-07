/**
 * Tipos manuais das tabelas usadas. Substituir por `supabase gen types typescript` quando possível:
 *   pnpm dlx supabase gen types typescript --project-id <id> > src/types/database.ts
 */
export type PricingModel = "credits_allowed" | "direct_only";

export interface ProviderRow {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  type: string;
  category: string;
  bio_pt: string | null;
  bio_en: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
  telegram_chat_id: string | null;
  email: string | null;
  hourly_rate_eur: number | null;
  payout_rate_eur: number | null;
  iban: string | null;
  bank_account_holder: string | null;
  tax_id: string | null;
  tax_name: string | null;
  verified: boolean;
  created_at: string;
}

export interface PublicProvider {
  id: string;
  name: string;
  bio_pt: string | null;
  bio_en: string | null;
  avatar_url: string | null;
  instagram_handle: string | null;
}

export interface EventRow {
  id: string;
  provider_id: string;
  title_pt: string | null;
  title_en: string | null;
  description_pt: string | null;
  description_en: string | null;
  category: string;
  pricing_model: PricingModel | null;
  price_eur: number;
  credits_cost: number | null;
  max_spots: number;
  booked_spots: number;
  duration_minutes: number;
  start_time: string;
  location_name: string | null;
  google_maps_url: string | null;
  what_to_bring: string | null;
  image_url?: string | null;
  level?: string | null;
  providers?: PublicProvider | null;
}

export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  credits_balance: number | null;
  credits_expire_at: string | null;
  concierge_tier: string | null;
  concierge_valid_until: string | null;
  is_admin: boolean | null;
}

export interface BookingRow {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  payment_method: string;
  created_at: string;
}