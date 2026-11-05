# Ericeira Hub — Engineering & Architecture Rules

This document defines the strict operational and architectural rules that must be inspected and respected before any code changes, refactors, or feature implementations are suggested or executed on the Ericeira Hub codebase.

---

## 1. Architectural Integrity & Existing Routes

1.1. **Respect Real Routes Before Creating New Ones**
* Always check the existing directory structure before proposing new routes.
* Do not invent routes (e.g. `/login`) when modal components (`AuthModal.tsx`) already handle the authentication lifecycle in-place.
* The host registration flow belongs exclusively to `/become-a-partner` (`src/app/become-a-partner/page.tsx`), supported by `src/app/api/provider/register/route.ts`. Never replace this with mailto links or ad-hoc forms.
* The operational dashboard for verified hosts is `/provider/portal`. Unverified visitors must be routed to `/become-a-partner`.

1.2. **Preserve Established Modular Components**
* Never overwrite or destroy core UI sections (`WellnessSection.tsx`, `CommunitySection.tsx`, `PackagesModal.tsx`, `EventDetailModal.tsx`, `AuthModal.tsx`).
* Refactors must retain the "Ericeira Pass" presentation, its tiered cards, calculation breakdowns, and Stripe checkout hooks.

---

## 2. TypeScript & Compilation Rigor

2.1. **Strict Component Prop Contracts**
* Check existing interfaces before referencing or mounting components.
* Example: `AuthModal` requires `isOpen: boolean`, `onClose: () => void`, and `onSuccess: () => void`. Never omit required callbacks.
* Always import Next.js built-ins (`Link` from `"next/link"`, `Image` from `"next/image"`, hooks from `"next/navigation"`) when referenced in JSX.

2.2. **Zero-Error Build Mandate**
* No solution is complete unless it is verified to pass `pnpm run build` without TypeScript (`TSxxxx`) or linting failures.

---

## 3. Bilingualism & Internationalization (PT / EN)

3.1. **Synchronous Language Context Adherence**
* All user-facing text, category pills, buttons, error messages, and modal titles must adapt to `lang` from `useLanguage()`.
* Every category tab and badge must resolve using bilingual dictionaries (e.g., `CATEGORY_TABS` with `label_pt` and `label_en`, `CATEGORY_LABELS_MAP`).

3.2. **Database Fallback Pattern**
* For dynamic content stored in Supabase:
  * Portuguese: `item.title_pt || item.title_en`
  * English: `item.title_en || item.title_pt`

---

## 4. Business & Transactional Logic

4.1. **The Dual Billing Model (`pricing_model`)**
* `credits_allowed`: Regular studio sessions that accept Ericeira Pass credits or single ticket checkout.
* `direct_only`: Premium workshops, culinary tastings, or high-ticket crafts that bypass credit redemption and accept direct Euro checkout only.
* Never show credit booking buttons on `direct_only` events.

4.2. **Atomicity & Concurrency**
* Credit bookings must execute through atomic procedures (`book_with_credits` RPC) with pessimistic row locking (`FOR UPDATE`) to prevent double-booking and negative balances.
* Direct Euro payments must rely on Stripe Webhook settlement confirmation (`src/app/api/webhooks/stripe/route.ts`), not client-side redirects alone.

---

## 5. UI/UX & Visual Standards

5.1. **High-Contrast Input Accessibility**
* All form elements (`<input>`, `<select>`, `<textarea>`) must explicitly declare dark text (`text-stone-900`), visible backgrounds (`bg-white`), and muted placeholders (`placeholder-stone-400`). Transparent or color-inherited inputs are forbidden.

5.2. **Visual Consistency**
* Maintain the warm natural palette (`#FDFBF7`, `stone-900`, `orange-600`, `amber-400`).
* Avoid arbitrary emoji clutter in system headers.
* Keep beach weather spots accurate and localized to the Ericeira World Surfing Reserve (Ribeira d'Ilhas, Foz do Lizandro, Pescadores, Coxos).