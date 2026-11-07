-- =====================================================================
-- Ericeira Hub — 002: esconder colunas sensíveis dos clientes (anon/authenticated)
-- ATENÇÃO: depois disto, `select *` em providers/concierge_guides feito a partir do browser
-- deixa de funcionar (é intencional). O código desta versão já lê estes dados via API (service role).
-- Colunas novas criadas no futuro precisam de GRANT SELECT explícito.
-- =====================================================================

do $$
declare cols text;
begin
  -- providers: só colunas públicas ficam legíveis a partir do browser
  select string_agg(quote_ident(column_name), ', ') into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'providers'
    and column_name not in ('telegram_chat_id','iban','bank_account_holder','tax_id','tax_name',
                            'email','hourly_rate_eur','payout_rate_eur');
  execute 'revoke select on public.providers from anon, authenticated';
  execute format('grant select (%s) on public.providers to anon, authenticated', cols);

  -- concierge_guides: o conteúdo privado só sai pela API, depois de validar a subscrição
  select string_agg(quote_ident(column_name), ', ') into cols
  from information_schema.columns
  where table_schema = 'public' and table_name = 'concierge_guides'
    and column_name <> 'content_private_markdown';
  execute 'revoke select on public.concierge_guides from anon, authenticated';
  execute format('grant select (%s) on public.concierge_guides to anon, authenticated', cols);
end $$;

-- Checklist manual (não automatizável sem ver as tuas policies):
--  1. events: INSERT/UPDATE/DELETE só via API (service role) → remover policies de escrita para authenticated.
--  2. bookings: sem INSERT/UPDATE/DELETE para authenticated; SELECT só das próprias reservas
--     (user_id = auth.uid()) e das reservas dos eventos do próprio prestador.
--  3. profiles: SELECT/UPDATE apenas da própria linha (id = auth.uid()).
--  4. provider_payouts, b2b_inquiries, stripe_events: RLS ativa e sem policies para anon/authenticated.
