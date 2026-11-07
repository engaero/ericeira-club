-- =====================================================================
-- Ericeira Hub — 001: segurança, idempotência de pagamentos e RPCs atómicas
-- Correr no SQL Editor do Supabase (ou via `supabase db push`).
-- Assume as tabelas: profiles, providers, events, bookings, provider_payouts.
-- REVER antes de correr em produção e testar primeiro num projeto de staging.
-- =====================================================================

-- ---------- 1. Colunas novas ----------
alter table public.profiles  add column if not exists stripe_customer_id text;
alter table public.providers add column if not exists payout_rate_eur numeric(6,2) not null default 4.00;
alter table public.events    add column if not exists pricing_model text not null default 'credits_allowed';
alter table public.bookings  add column if not exists credits_spent integer not null default 0;
alter table public.bookings  add column if not exists provider_amount_cents integer not null default 0;
alter table public.bookings  add column if not exists refunded boolean not null default false;
alter table public.bookings  add column if not exists stripe_session_id text;
alter table public.bookings  add column if not exists stripe_payment_intent text;

create unique index if not exists bookings_stripe_session_id_key
  on public.bookings (stripe_session_id) where stripe_session_id is not null;

-- Eventos Stripe / chaves de idempotência já processados (sem policies = só service role).
create table if not exists public.stripe_events (
  id           text primary key,
  processed_at timestamptz not null default now()
);
alter table public.stripe_events enable row level security;

-- Backfill do valor devido ao prestador nas reservas antigas (só onde ainda é 0).
update public.bookings b
set provider_amount_cents = case
  when b.payment_method = 'stripe_direct'
    then round(coalesce(b.amount_paid_eur, 0) * 100 * 0.8)
  else round(
    coalesce(nullif(b.credits_spent, 0), e.credits_cost, round(e.price_eur / 5.0), 0)
    * coalesce(p.payout_rate_eur, 4.00) * 100)
  end
from public.events e
left join public.providers p on p.id = e.provider_id
where e.id = b.event_id and b.provider_amount_cents = 0;

-- ---------- 2. Proteger colunas privilegiadas de profiles ----------
-- Um utilizador autenticado não pode alterar admin, saldo, validade ou subscrição.
create or replace function public.protect_profile_privileged_columns()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), '') in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      if coalesce(new.is_admin, false)
         or coalesce(new.credits_balance, 0) <> 0
         or coalesce(new.concierge_tier, 'free') <> 'free' then
        raise exception 'protected_profile_columns' using errcode = '42501';
      end if;
    else
      if new.is_admin               is distinct from old.is_admin
         or new.credits_balance      is distinct from old.credits_balance
         or new.credits_expire_at    is distinct from old.credits_expire_at
         or new.concierge_tier       is distinct from old.concierge_tier
         or new.concierge_valid_until is distinct from old.concierge_valid_until
         or new.stripe_customer_id   is distinct from old.stripe_customer_id then
        raise exception 'protected_profile_columns' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
  before insert or update on public.profiles
  for each row execute function public.protect_profile_privileged_columns();

-- ---------- 3. Reservar com créditos (atómico, com locks) ----------
create or replace function public.app_book_with_credits(p_event_id uuid, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_event    public.events%rowtype;
  v_profile  public.profiles%rowtype;
  v_cost     integer;
  v_rate     numeric;
  v_existing record;
  v_booking  text;
  v_provider_cents integer;
begin
  select * into v_event from public.events where id = p_event_id for update;
  if not found then raise exception 'event_not_found'; end if;
  if coalesce(v_event.pricing_model, 'credits_allowed') <> 'credits_allowed' then raise exception 'direct_only_event'; end if;
  if v_event.start_time <= now() then raise exception 'event_started'; end if;
  if v_event.booked_spots >= v_event.max_spots then raise exception 'event_full'; end if;

  v_cost := coalesce(v_event.credits_cost, 0);
  if v_cost < 1 then raise exception 'invalid_credits_cost'; end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then raise exception 'profile_not_found'; end if;
  if v_profile.credits_expire_at is not null and v_profile.credits_expire_at < now() then raise exception 'credits_expired'; end if;
  if coalesce(v_profile.credits_balance, 0) < v_cost then raise exception 'insufficient_credits'; end if;

  select coalesce(payout_rate_eur, 4.00) into v_rate from public.providers where id = v_event.provider_id;
  v_provider_cents := round(v_cost * coalesce(v_rate, 4.00) * 100);

  select id, status into v_existing from public.bookings
    where event_id = p_event_id and user_id = p_user_id for update;

  if found then
    if v_existing.status = 'confirmed' then raise exception 'already_booked'; end if;
    -- reativa a reserva anterior (a constraint única event_id+user_id impede nova linha)
    update public.bookings set
      status = 'confirmed', payment_method = 'ericeira_pass_credits', amount_paid_eur = 0,
      commission_eur = 0, credits_spent = v_cost, provider_amount_cents = v_provider_cents,
      refunded = false, stripe_session_id = null, stripe_payment_intent = null
    where id = v_existing.id
    returning id::text into v_booking;
  else
    insert into public.bookings
      (event_id, user_id, payment_method, amount_paid_eur, commission_eur, status,
       credits_spent, provider_amount_cents, refunded)
    values
      (p_event_id, p_user_id, 'ericeira_pass_credits', 0, 0, 'confirmed', v_cost, v_provider_cents, false)
    returning id::text into v_booking;
  end if;

  update public.profiles set credits_balance = coalesce(credits_balance, 0) - v_cost where id = p_user_id;
  update public.events   set booked_spots = booked_spots + 1 where id = p_event_id;

  return jsonb_build_object(
    'booking_id', v_booking,
    'credits_spent', v_cost,
    'credits_balance', coalesce(v_profile.credits_balance, 0) - v_cost
  );
end $$;

-- ---------- 4. Cancelar reserva (reembolso se >= 12h antes) ----------
create or replace function public.app_cancel_booking(p_booking_id text, p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_b      public.bookings%rowtype;
  v_event  public.events%rowtype;
  v_refund boolean;
  v_credits integer;
begin
  select * into v_b from public.bookings
    where id::text = p_booking_id and user_id = p_user_id for update;
  if not found then raise exception 'booking_not_found'; end if;
  if v_b.status <> 'confirmed' then raise exception 'booking_not_active'; end if;

  select * into v_event from public.events where id = v_b.event_id for update;
  v_refund := found and (v_event.start_time - now()) >= interval '12 hours';

  update public.bookings set status = 'cancelled', refunded = v_refund where id = v_b.id;
  update public.events set booked_spots = greatest(booked_spots - 1, 0) where id = v_b.event_id;

  if v_refund and v_b.payment_method = 'ericeira_pass_credits' then
    v_credits := coalesce(nullif(v_b.credits_spent, 0), v_event.credits_cost, 0);
    update public.profiles set credits_balance = coalesce(credits_balance, 0) + v_credits where id = v_b.user_id;
  end if;

  return jsonb_build_object(
    'refunded', v_refund,
    'payment_method', v_b.payment_method,
    'payment_intent', v_b.stripe_payment_intent,
    'amount_paid_eur', v_b.amount_paid_eur
  );
end $$;

-- ---------- 5. Webhook: creditar carteira (idempotente) ----------
create or replace function public.app_credit_wallet(p_key text, p_user_id uuid, p_credits integer, p_days integer)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rows integer; v_balance integer;
begin
  insert into public.stripe_events (id) values (p_key) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return jsonb_build_object('status', 'already_processed'); end if;

  insert into public.profiles (id, credits_balance, credits_expire_at)
  values (p_user_id, p_credits, now() + make_interval(days => p_days))
  on conflict (id) do update set
    credits_balance   = coalesce(public.profiles.credits_balance, 0) + excluded.credits_balance,
    credits_expire_at = greatest(coalesce(public.profiles.credits_expire_at, excluded.credits_expire_at), excluded.credits_expire_at)
  returning credits_balance into v_balance;

  return jsonb_build_object('status', 'credited', 'credits_balance', v_balance);
end $$;

-- ---------- 6. Webhook: compra direta de bilhete (idempotente, com capacidade) ----------
-- Estados devolvidos: created | already_processed | full | duplicate_booking | event_not_found
-- Em full/duplicate_booking/event_not_found NÃO fica registada a chave: o webhook faz reembolso
-- (idempotente via Stripe) e, se falhar, o Stripe volta a tentar.
create or replace function public.app_confirm_direct_booking(
  p_key text, p_session_id text, p_event_id uuid, p_user_id uuid, p_amount_cents integer, p_payment_intent text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_event    public.events%rowtype;
  v_existing record;
  v_booking  text;
  v_commission integer := round(p_amount_cents * 0.20);
begin
  if exists (select 1 from public.stripe_events where id = p_key) then
    return jsonb_build_object('status', 'already_processed');
  end if;

  select * into v_event from public.events where id = p_event_id for update;
  if not found then return jsonb_build_object('status', 'event_not_found'); end if;

  -- outra entrega concorrente do mesmo pagamento já criou a reserva
  if exists (select 1 from public.bookings where stripe_session_id = p_session_id) then
    insert into public.stripe_events (id) values (p_key) on conflict do nothing;
    return jsonb_build_object('status', 'already_processed');
  end if;

  select id, status into v_existing from public.bookings
    where event_id = p_event_id and user_id = p_user_id for update;
  if found and v_existing.status = 'confirmed' then return jsonb_build_object('status', 'duplicate_booking'); end if;
  if v_event.booked_spots >= v_event.max_spots then return jsonb_build_object('status', 'full'); end if;

  if found then
    update public.bookings set
      status = 'confirmed', payment_method = 'stripe_direct', amount_paid_eur = p_amount_cents / 100.0,
      commission_eur = v_commission / 100.0, credits_spent = 0,
      provider_amount_cents = p_amount_cents - v_commission, refunded = false,
      stripe_session_id = p_session_id, stripe_payment_intent = p_payment_intent
    where id = v_existing.id returning id::text into v_booking;
  else
    insert into public.bookings
      (event_id, user_id, payment_method, amount_paid_eur, commission_eur, status,
       credits_spent, provider_amount_cents, refunded, stripe_session_id, stripe_payment_intent)
    values
      (p_event_id, p_user_id, 'stripe_direct', p_amount_cents / 100.0, v_commission / 100.0, 'confirmed',
       0, p_amount_cents - v_commission, false, p_session_id, p_payment_intent)
    returning id::text into v_booking;
  end if;

  update public.events set booked_spots = booked_spots + 1 where id = p_event_id;
  insert into public.stripe_events (id) values (p_key) on conflict do nothing;

  return jsonb_build_object('status', 'created', 'booking_id', v_booking);
end $$;

-- ---------- 7. Webhook: acesso Concierge (idempotente) ----------
create or replace function public.app_set_concierge(
  p_key text, p_user_id uuid, p_tier text, p_valid_until timestamptz, p_force boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_rows integer;
begin
  insert into public.stripe_events (id) values (p_key) on conflict do nothing;
  get diagnostics v_rows = row_count;
  if v_rows = 0 then return jsonb_build_object('status', 'already_processed'); end if;

  insert into public.profiles (id, concierge_tier, concierge_valid_until)
  values (p_user_id, p_tier, p_valid_until)
  on conflict (id) do update set
    concierge_tier = excluded.concierge_tier,
    concierge_valid_until = case
      when p_force then excluded.concierge_valid_until
      else greatest(coalesce(public.profiles.concierge_valid_until, excluded.concierge_valid_until), excluded.concierge_valid_until)
    end;

  return jsonb_build_object('status', 'updated');
end $$;

-- ---------- 8. Saldos de prestadores (só sessões já realizadas) ----------
create or replace function public.app_provider_balances()
returns table (provider_id text, earned_cents bigint, paid_cents bigint)
language sql stable security definer set search_path = public as $$
  select p.id::text,
         coalesce(e.earned, 0)::bigint,
         coalesce(po.paid, 0)::bigint
  from public.providers p
  left join lateral (
    select sum(b.provider_amount_cents) as earned
    from public.bookings b join public.events ev on ev.id = b.event_id
    where ev.provider_id = p.id and ev.start_time <= now()
      and (b.status = 'confirmed' or (b.status = 'cancelled' and not b.refunded))
  ) e on true
  left join lateral (
    select round(sum(amount_eur) * 100) as paid
    from public.provider_payouts
    where provider_id = p.id and coalesce(status, 'paid') = 'paid'
  ) po on true;
$$;

-- ---------- 9. Registar pagamento a prestador (valida contra o saldo) ----------
create or replace function public.app_record_payout(
  p_provider_id text, p_amount_cents integer, p_period_start timestamptz,
  p_period_end timestamptz, p_reference text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_provider public.providers%rowtype; v_balance bigint; v_payout jsonb;
begin
  select * into v_provider from public.providers where id::text = p_provider_id for update;
  if not found then raise exception 'provider_not_found'; end if;

  select (earned_cents - paid_cents) into v_balance from public.app_provider_balances() where provider_id = p_provider_id;
  if p_amount_cents <= 0 or p_amount_cents > coalesce(v_balance, 0) then raise exception 'amount_exceeds_balance'; end if;

  insert into public.provider_payouts (provider_id, amount_eur, period_start, period_end, bank_reference, status)
  values (v_provider.id, p_amount_cents / 100.0, p_period_start, p_period_end, p_reference, 'paid');

  return jsonb_build_object('status', 'recorded', 'amount_cents', p_amount_cents);
end $$;

-- ---------- 10. Permissões: estas funções só podem ser chamadas pelo servidor ----------
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname in ('app_book_with_credits','app_cancel_booking','app_credit_wallet',
                        'app_confirm_direct_booking','app_set_concierge','app_provider_balances',
                        'app_record_payout',
                        -- RPCs antigas que aceitavam p_user_id do cliente: deixam de ser invocáveis
                        'book_with_credits','cancel_booking_and_refund')
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;
