# MDW Wellness — Kanban

> **Source of truth for the backlog.** You edit this in your editor; I read + update it with file tools as tasks move. Task IDs (`T#`) are stable — tell me "move T3 to In Progress" or "T16 is tested" and I'll update the file. A visual snapshot gets rendered in chat, but **this file is the editable one.**
>
> Not committed to git yet (planning file) — say the word if you want it tracked.

**Columns:** 🚧 Blocked (needs your input) · 🟡 In Progress / Partial · 🧪 Local testing (built — needs your test) · 🔴 Todo · ⏸ Later · 🟢 Done — awaiting your test (committed, unpushed) · ✅ Live (pushed to main)

_Last updated: 2026-07-17 · statuses from this session's work; effort = solo dev + AI, build+test days._

---
****
## 🚧 Blocked — needs your input
- **T32 · Verify the UPI payee name + set the UPI env** — send yourself **₹1** and read the payee name your UPI app displays. It comes from **your bank's records, not from our page** — and the pay page tells the customer *"check the payee reads My Dawai Wala Healthcare Services"*. If your VPA resolves to a personal name, that sentence makes you look **worse**, not better. Then on Vercel: set `NEXT_PUBLIC_UPI_VPA` + `NEXT_PUBLIC_UPI_PAYEE_NAME` (they're `NEXT_PUBLIC_*` = inlined at **build** — redeploy, don't restart), and confirm `NEXT_PUBLIC_APP_URL` is the **customer-facing domain**, not a `*.vercel.app` preview (an unfamiliar domain in a payment link is the loudest phishing signal there is). **Gates the whole payment link.** `~15m`
- **T2 · Remove the package system entirely** — you're sending details. Gates T21 + T23 and resolves the "no progress" issue we found (progress was package-only). `~2–4d`
- **T23 · Session-tiered pricing** — _folded into **T31** (now In Progress)._

## 🟡 In Progress / Partial
- **T1 · Dashboard not updating on changes** — manual refresh button added (unpushed); the "not showing" you saw is the deploy gap (changes committed, not pushed) + no auto-refetch. Next: push, then decide `refetchOnWindowFocus`. `~1d`
- **T12 · Bill-generation automation** — auto-invoice already fires on completion/payment; scope what more "automate" means. `~1–2d`

## 🧪 Local testing — needs your attention
_Built + committed on `main` (unpushed). To exercise end-to-end: **deploy backend → run migration → test on localhost**._

> **Test checklist:** (1) deploy backend (adds `/api/session-rates`) → (2) Services → **Session rates**: set your tiers, save → (3) add/edit a service (name · HSN · original · discounted · description) → (4) **book**: date → therapist day-loads → session count auto-prices → toggle + stack services → breakdown → (5) recommend an add-on with the discount toggle → check the invoice.
>
> ⚠️ **No migration.** The T31 script was **deleted** — it `$unset` **isPackage/packageCount**, which 8 live code paths still read (`appointmentController.ts:436` would collapse every package to 1 session; package invoicing would break). Old services work as-is via the new `originalPrice ?? price` fallback.

- **T31 · Service redesign + global rate setter** _(fe `60acb03` · be `20d9a32`)_ — (1) global **dynamic session-rate table** (Services → Session rates editor); (2) Service = name·HSN·original·discounted·description (session rates off it). Booking prices from the table; add-on discount toggle; invoice flows `quotedPrice`. _(Migration script deleted — see the warning above.)_
- **Booking form rework** _(fe `60acb03`)_ — date-first + therapist **day-load** (availability-sorted, = **T20** salvage); **session-only vs. stackable services**; live price **breakdown**; no-tier guard; read-only Therapist/Customer IDs.
- **T9 · IDs in forms** _(fe `7e46c5c`)_ — auto-filled read-only IDs on the booking form + the ID convention on the enquiry intake. Confirm on localhost.
- **T3/T4/T5 · Executive-lock trio** _(fe + be, uncommitted)_ — backend `updateAppointment` enforces ownership + reasons + **authoritative audit** (actor stamped from the JWT); the enquiry drawer prompts a **reason** on a non-owner edit and a **reason-dropdown** on therapist reassignment. **Test:** as a non-owner exec, edit someone's lead → reason prompt → it appears in the activity trail; reassign a therapist → reason dropdown. Admins edit freely. Typecheck + tests green.

### Pay-first enquiry funnel _(branch `feat/enquiry-pay-first-funnel` on **both** repos — fe `6797a0e` · be `f4edca5`)_
> ⚠️ **Deploy order: backend FIRST.** Until `f4edca5` is live on Render, "Request payment" can't mint a token and errors. Then **T32** (env + payee-name check), then redeploy the frontend.

- **T14 · Pay-before-assignment** ✅ — the drawer is now the client-approved flow: reach out → **3. Confirm booking** (Online consultation | Home visit; fee pre-fills from the Services catalogue, editable) → **4. Payment** → **5. Assign therapist** (locked until paid). The old gate was **backwards** — it demanded the physio assignment before payment. Rides on the existing `typeOfappointment` + `quotedPrice`, so **no new backend field** for the funnel itself. Consult-slot / physio-assignment / completion sections **deleted** — the enquiry's job now ends at step 5. `~3d` _(the "needs a payment gateway" note was wrong: UPI deep-link + QR covers it; see T34 for the gateway upgrade)_
- **Therapist availability grid** — rows = therapists, cols = time slots, free/busy from existing appointments; one click sets therapist + time. **Searchable by name OR specialization**, and each name pops its full specialization/bio list — the exec never opens the Therapists page mid-booking. Collapses to a summary once assigned; changing it **warns first, admins included** (they previously got *no* confirmation — a stray click silently moved a customer's visit).
- **Customer payment link** — pay-first **breaks pay-at-clinic** (a home-visit customer has no clinic to pay at before being assigned), which `docs/payment-hub-options.md` assumed. "Request payment" mints a `payToken` and opens WhatsApp with a memo linking to a public **`/pay/<token>`** page: itemised, brand + legal name + real phone, a **dynamic UPI QR** (amount + booking ref baked in per the NPCI spec) and the payee VPA in plain text so a cautious customer can verify where the money goes. Backend adds `payToken` (random, server-minted, **never** derived from the sequential `enquiryId`) + `GET /api/appointments/pay/:token` (public, rate-limited, field-limited — no phone/email/notes/trail) + `POST /:id/pay-link` (authed, idempotent).
- **Appointments · Advance payment column** — Paid/Pending off the existing `paymentReceived`. No backend change.
- **wa.me country-code fix** — every WhatsApp link app-wide sent a **bare 10-digit number**, so chats opened misrouted. Was 3 copies of the same broken line (enquiry drawer ×2, invoice drawer); now one tested helper (`src/lib/whatsapp.ts`).
- **T21 · Remove package selection from the enquiry drawer** ✅ — done earlier (`6e362d6`); zero package refs remain in the drawer.

**Test:** deploy backend → T32 → redeploy FE → enquiry → reach out → confirm **Online consultation** (fee pre-fills ₹500) → Request payment → check the WhatsApp memo + the `/pay` page on a phone → record payment → **therapist unlocks** → pick a free cell → confirm → appears on **Appointments as Paid**. Repeat for **Home visit**. Then open an **old** enquiry and confirm it still opens cleanly.

### T35 · Guard edits to a paid invoice _(FE-only — testable without any deploy)_
- **T35** ✅ — a paid invoice was fully editable in silence: Edit → change the price → Save, no warning, while the customer holds a PDF saying otherwise. Now **two gates**: clicking **Edit** on a paid invoice confirms first ("{customer} has a copy showing {total}…"), and **Save** shows an itemised diff of exactly what's moving (`Home Visit Consultation ₹1,200 → ₹800`, `Payment Paid → Pending`) before it writes. **Changed nothing → saves silently, no dialog** — that's what stops the confirm becoming reflex noise. Diff logic is a pure, unit-tested helper (`invoices/invoice-diff.ts`, 10 tests), so the drawer just renders it. Unpaid and voided invoices behave exactly as before. Spec: `docs/superpowers/specs/2026-07-17-invoice-paid-edit-guard-design.md`.
  **⚠️ Scope, deliberately:** this covers the **invoice drawer only**. It does **not** stop the appointment auto-sync from re-pricing a paid invoice — see the two 💰 items in the parking lot. Don't read this as "paid invoices are safe now".
  **Test:** paid invoice → Edit → prompt → Cancel (stays read-only) → Edit anyway → change a price → Save → diff appears → "Keep it as it is" (writes nothing) → Save again → "Yes, change it" (writes). Then: Edit anyway → change nothing → Save → **no dialog**. Then an unpaid invoice → Edit + Save with no dialogs at all.

### T36 · Freeze a paid invoice's money on appointment auto-sync _(backend — needs deploy)_ _(be `1c2164f`)_
- **T36** ✅ — the real money bug behind T35's scope note. `syncInvoiceFromAppointment` ran on **every** `PUT /api/appointments/:id` and re-derived `line_items`/`total`/`advance_paid`/`payment_status` from the appointment with no paid-check, then regenerated the PDF — so editing a fee in the **enquiry** drawer after payment silently re-priced a settled invoice and re-issued the customer's copy, warning nobody. Now: once the **stored** `payment_status` is `paid`, money + billing identity are **frozen**; non-money **facts still sync** (the pay-first funnel assigns the therapist *after* payment, so a paid invoice must still pick up its doctor); the PDF re-issues only when a field it shows actually changed (kills the no-op churn/UploadThing hammering too). A **voided** invoice is skipped entirely. Verified against a real local Docker Mongo — 10 assertions (paid keeps amount + therapist still syncs; pending re-prices; voided untouched; no-op paid sync doesn't re-issue the PDF). **Deploy with the rest of the backend branch.** Still open: the **drawer's** own `updateInvoice` `PUT` has no server-side guard — see the parking lot.

### T19 · New-enquiry notification — colored toast + sound _(FE-only — testable now)_ _(fe `b452a97` + `89ef705`)_
- **T19** ✅ (fully) — the window-focus peek used to flag fresh bookings with a `fixed bottom-right … bg-background text-sm` div: low-contrast, off in the corner, "almost invisible". Now a **sonner `toast.info`** via the root Toaster (`top-right richColors`) — colored (blue on light-blue, verified in-browser), top-right, **Reload** action, deduped by a stable id.
  - **Sound** (`89ef705`): a two-note **WebAudio** chime (no asset) fires with the toast, plus a **persisted mute toggle** (speaker icon in the Enquiries header). All best-effort — a blocked AudioContext or unavailable storage fails silently. Browser-verified: beep drives WebAudio (1 ctx, 2 oscillators); mute persists + suppresses; survives reload.
  - ⚠️ **Platform caveat (not fixable in code):** browsers gate audio behind a recent user gesture, so a beep on a **cold tab-focus** may be muted until the executive clicks something. Muting is always reliable; unmuting (a click) primes audio for the session.

## 🧩 Off-backlog extras — built alongside the numbered tasks (not in the original T1–T31)
- ✅ **Codebase blueprint** — `BLUEPRINT.md` (entity map + change-checklists) + **Graphify** cross-repo knowledge graph (blast-radius queries), wired as an MCP.
- ✅ **This Kanban** + a live **visual board**, hosted 3 ways — claude.ai artifact · GitHub Pages · Render static site — auto-syncing on push.
- 🧪 **Booking dialog scroll fix** — caps the dialog to the viewport so it scrolls as services stack. _(uncommitted)_
- 🧪 **Services table** — split into separate **Original / Discounted** columns, with an old-price fallback so pre-migration services show real numbers. _(uncommitted)_
- 🧪 **Settings → user management** — admin-gated **Edit** (name·email·phone·role) + **Delete** in the row menu; self-delete blocked, **last-admin protected**, a role change forces re-login, list auto-refreshes. Delete works now (FE-only); **Edit** adds a backend route (`PATCH /admin/update-user`) → needs deploy. _(uncommitted)_
- 🧪 **Appointments table cleanup** — de-duped the add-on badge (Name vs. the Add-ons column), **Package → Session** column (dropped the stale package-progress bar), and moved **Status** to the front so it's visible without scrolling. _(uncommitted, FE-only — testable now)_
- 🛠 **Delete-all-appointments script** — `scripts/delete-all-appointments.ts` (backend) wipes test bookings for a clean end-to-end run; dry-run by default, `--apply` to delete. _(you run it against your DB)_
- 🎨 **Analytics view** — **spec'd** (`docs/superpowers/specs/2026-07-17-analytics-view-design.md`): a 2-zone page (owner business-health + exec operational), **7 blocks**, service-reframed from the pharmacy reference (dropped MRP/PTR/purchases/expiry; renamed Sales→Revenue, Orders→Bookings; added collected-vs-pending + funnel + therapist load). Needs a **new correct `/api/analytics`** endpoint (the existing `/api/metrics` is buggy). **Parked for build** behind the Enquiries sign-off. Feeds **T15**.

## 🅿️ Parking lot — found mid-page, deliberately NOT acted on
_Rule (2026-07-17): **one page at a time**. New findings land here untouched. **Only production money/data bugs interrupt.** Current lock: **Enquiries** — pay-first funnel built + committed; the lock lifts once **T32** is done and you've tested. Strongest next candidate: the public booking form validation below (it's the front door that feeds this whole funnel)._
_(T35 was taken on Invoices out of order, at your direction. The two 💰 items below came out of it and are the real money bugs — they're parked, not fixed.)_

- **Next.js 16: migrate `middleware.ts` → `proxy.ts`** — framework deprecation notice, **not an error** (middleware.ts still works; the prod deploy is green). One codemod does it: `npx @next/codemod@canary middleware-to-proxy .` (renames the file + `middleware()`→`proxy()`). Trivial + safe, but not Enquiries and not a money/data bug → parked. Also worth pairing with removing the stray `vite` / `@tanstack/react-router` / `@tanstack/react-start` deps (the deploy-fail root cause, currently neutralised by `vercel.json`). (Framework maintenance · found 2026-07-17)

- **`updateInvoice` has no server-side guard** — it checks the role but not `voided` or `payment_status`, so the invoice-drawer paid-edit guard (**T35**) *and* the existing "voided → Edit disabled" lock are **frontend-only and bypassable via the API**. The auto-sync path is now guarded server-side (**T36**), but the drawer's own `PUT` still isn't. Add the `paid`/`voided` check in the controller. (Invoices · found 2026-07-17)

- **Therapist grid's busy cells come from the *deduped* appointments list** — `dedupePackageAppointments` collapses rows sharing phone + `packageServiceId`, so two future sessions of the same customer's package could hide a busy cell → the grid shows **free** where the therapist is booked → double-booking. Narrow (needs same customer, same package, two future slots) and packages are on their way out via T2, but it's a real correctness hole in a money path. Fix = feed the grid an un-deduped source. (Enquiries · found 2026-07-17)

- **Customers drawer still renders the retired funnel fields** — `customer-detail-drawer.tsx` shows Consult slot / Consult done / Physio slot / Assignment confirmed. Right for old records (it's their history), permanently "—" for anything booked pay-first. Cosmetic drift, not wrong. (Customers · found 2026-07-17)

- **Public booking form has no phone/email validation** — `mdw-wellness.vercel.app` ("Book your session") accepts a 14-digit phone (`76457658756876`) and an unvalidated email. This is the **front door**: every public enquiry starts here, and customers are *derived* by bucketing appointments on **phone** (`deriveCustomers`), so junk phones mint junk customers and typos split one person into two. The backend doesn't guard it either — `bookingService.createBooking` only checks `typeof phonenumber === "number"`, not length/shape. Fix on **both** ends: 10-digit/E.164 + email-format checks on the form, and validation in `POST /api/appointments/public`. **Different repo** (public site, not the dashboard). _Strongest parked item — good candidate for next after Enquiries._ (Public site · found 2026-07-17)

- **Appointment drawer can't set sessions or price after booking** — miss the session count at booking and there's no field to fix it (`appointments-detail-page.tsx` has no `sessionNumber`/`quotedPrice`). This is now a **dead end**: the new ₹0 guard refuses to invoice an unpriced booking, so the record has no price, no invoice, and no UI to repair it. Fix = require sessions at booking **and/or** make sessions + price editable in the drawer. _Workaround today: raise a manual invoice._ (Appointments · found 2026-07-17)

## 🔴 Todo
**Access / lead ownership** — ✅ **built → 🧪 Local testing**
- **T3** ✅ · Lead ownership lock — a non-owner exec editing another's lead gets a warning + must give a reason (soft lock; admins free), logged.
- **T4** ✅ · Therapist-assignment lock — reassigning an existing therapist needs a reason (dropdown) + verbose audit; role-gated.
- **T5** ✅ · Can't edit another exec's lead — sonner warning + reason flow (with T3).

**Booking / visit**
- **T8 · Booking updates the existing appointment on therapist change** (not a new row). `~1d`
- **T10 · Visit: charge + full diagnosis + completion.** `~2d`
- **T6 · Last doctor pre-recommended** for returning patients. `~1.5d`
- **T7 · Returning customers show previous doctor** on the customers page. `~1d`

**Enquiry / scheduling**
- **T20** ✅ · ~~Category → therapist flow~~ — salvage **done**: booking form is date-first + the therapist dropdown shows each therapist's **bookings on that day**, sorted most-available first.
- **T21** ✅ · ~~Remove package selection from the enquiry drawer~~ — **done** (`6e362d6`); see the pay-first block in 🧪.
- **T22 · Therapist slot range vs customer single time.** `~1.5d`
- **T33 · Sweep legacy in-flight leads** — leads assigned under the **old** flow but never paid (`physioAssignmentConfirmed: true`, `paymentReceived: false`) now show an **empty step 5**: their therapist + `physioSlot` are still in Mongo, but the drawer no longer surfaces them, so nothing is lost — it just has to be re-run pay-first. Arguably correct (unpaid-yet-assigned is exactly what pay-first forbids), but someone must work through them. **Count first**, then decide whether to migrate or redo by hand. `~0.5d`

**Services / UI**
- **T16** ✅ · ~~Remove average price~~ — **done** this session (Services page; FE-only, testable now).
- **T17 · "Has recommend price" checkbox** (two prices) — `recommendedPrice` field already exists. `~0.75d`
- **T18 · Email optional** on forms. `~0.25d`
- **T19** ✅ · ~~Sonner sound on new enquiry~~ — done: colored top-right toast (`b452a97`) + WebAudio chime & mute toggle (`89ef705`). See 🧪.
- **T15 · Revenue page** (reuse the old one). `~1.5d`

**Online consultation**
- **T13 · Assign therapist for a video call + completion.** `~2d` — _assignment itself is now covered by the pay-first funnel; what's left is the **video call** (link/room) + the completion step._
- **T14** ✅ · ~~Pay-before-assignment~~ — **built** this session, see 🧪.

**Integrations (WhatsApp — external approval risk)**
- **T24 · Home-visit start/end OTP** (WhatsApp, Urban-style). `~3d` + WhatsApp approval
- **T25 · Recommended-service OTP** — therapist enters the OTP before the add is applied. `~2d` + WhatsApp approval

**Therapist experience**
- **T26 · "Not carrying equipment" flag** on the upcoming session. `~1d`
- **T27 · Therapist sees the same status/progression as the exec.** `~2d`
- **T28 · Therapist sees a "performed" summary.** `~2d`

**Automation**
- **T11 · Booking automation.** `~2–3d`

## ⏸ Later
- **T34 · Razorpay auto-reconciliation** — the exec still eyeballs the bank statement and ticks "Payment received" by hand. That was *annoying* under pay-at-clinic; under **pay-first it's on the critical path of every booking** — an unmatched credit blocks a therapist assignment. Razorpay payment links + a webhook would tick it automatically. The ladder is **static QR → payment page (where we are now) → gateway**; the page fixed *correctness* (right amount, attached booking ref, an artefact the customer can re-open), not *reconciliation*. Do this when volume makes the daily statement-matching hurt. `~3d` + merchant account/KYC + ~2%/txn
- **T29 · Daily summary note + summary history.** `~2d`
- **T30 · Therapist payment history.** `~2d`

## 🟢 Done — committed, NOT pushed (awaiting your test / deploy)
- **All-IDs surfaces** — Booking/Customer/Therapist ID + status via one shared `RecordIds` on the appointment + enquiry drawers, the table (Booking ID column), and the invoice PDF — `2013c25` / `bb9f647`
- **createBooking funnel** — one creation path for the dashboard + public endpoints — `bb9f647`
- **Invoice PDF redesign** — wellness blue, mdw logo, all IDs, "Rs." amounts — `bb9f647`
- **customer_id / therapist_id / address wiring** (incl. sync + manual invoices) — `bb9f647`
- **Dashboard fixes** — manual refresh, Booking IDs (not raw `_id`), newest-first, metrics extracted, dead code removed — `2013c25`
- **Reuse refactor** — one `AppointmentStatusBadge` + one `RefreshButton`, repointed everywhere — `2013c25`
- **requireRole + validation hardening; CLAUDE.md coding rules** — `bb9f647`
- **Vitest set up + dashboard-metrics tests (3 passing)** — `2013c25`

## ✅ Live (pushed to main — `origin/main`)
- Booking form overhaul (customer autofill, services picker, cleaner fields) — `f7fd1b5`
- Soft-cancel + save-to-bottom, "Booked on" sort column, dash-free activity logs — `9eca9ae`
- Invoice line-items table, void flow, adaptive enquiry funnel, visit UI — `67f6408`
