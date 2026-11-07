# Ericeira Hub — correções aplicadas sobre a versão enviada (ericeira-hub-code_1)

## Ficheiros alterados
- src/app/page.tsx — `authJson` recebe objetos (não `JSON.stringify`); reserva e checkout enviam só `eventId`
  (o servidor lê preço/título/utilizador); reposta a compra de créditos (`handleBuyCreditPackage` + botão
  "Comprar Créditos" + `PackagesModal`); tratamento de `?payment=success|cancelled`; erros bilingues;
  `google_maps_url` no select.
- src/components/EventDetailModal.tsx — link "Ver no mapa" (só URLs https).
- src/app/api/provider/provider/profile/route.ts — APAGADO (rota antiga sem autenticação).
- src/app/api/provider/events/route.ts — aceita `startTimes[]` (recorrência, máx. 26 sessões, até 1 ano).
- src/components/CreateEventModal.tsx — deixa de escrever direto no Supabase; chama a API (valida, exige
  prestador verificado); mantém a repetição semanal.
- src/app/provider/portal/page.tsx — formulário inline substituído por botão que abre o CreateEventModal.

## Ficheiros acrescentados ao zip (não vinham na tua versão)
- supabase/migrations/001_security_and_payments.sql  → correr PRIMEIRO (sem isto a API falha: chama funções app_*)
- supabase/migrations/002_column_privileges.sql      → só depois de testar tudo
- next.config.ts, .env.example

Ordem: 001 → deploy → webhook Stripe (eventos em .env.example) → testes → 002.
Nenhum build foi executado (sem rede): corre `pnpm install && pnpm build`.
