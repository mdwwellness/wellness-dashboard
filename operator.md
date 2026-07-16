# Operator Checklist

Manual steps that **I (the operator/owner) must do by hand** — things code can't do for me (signups, env vars, deploys, browser smoke tests). Check them off as they're done.

Legend: `[ ]` = todo · `[x]` = done · `[~]` = in progress

> **2026-06-17:** Backend migrated to a fresh deploy — repo `mdwwellness/wellness-backend`,
> live at `https://wellness-backend-1-wya5.onrender.com` (same MongoDB). All four backend
> patches below (therapist media, activity log, payment/completion, services API) are
> deployed there. Frontend `.env.local` `BACKEND_BASE_URL` points at this URL.

---

## Customer payment link — UPI details (added 2026-07-17)

The enquiry funnel is now **pay-first**: payment must clear before a therapist is
assigned. A home-visit customer therefore can't "pay at the clinic" first, so the
drawer's **Request payment** button sends them a WhatsApp memo linking to
`/pay/<token>` — a public page showing the booking, the itemised service, and the
amount, with a UPI button + QR.

Until the two env vars are set, the page still renders correctly (booking, item,
amount) but shows *"Please call us on …"* instead of a pay button. Nothing breaks;
it just can't collect.

- [ ] **Pick the receiving UPI ID** — the clinic VPA payments should land in (e.g. `mydawaiwala@okhdfcbank`)
- [ ] **Local env** — add to `.env.local`:
      `NEXT_PUBLIC_UPI_VPA=<vpa>`
      `NEXT_PUBLIC_UPI_PAYEE_NAME=My Dawai Wala Healthcare Services`
      _The payee name must match what the customer's UPI app will display — the page tells them to check it, so a mismatch reads as a scam._
- [ ] **Vercel env** — add both to Production **and** Preview. They're `NEXT_PUBLIC_*`, so they're inlined at **build** time: redeploy after adding, don't just restart.
- [ ] **Check `NEXT_PUBLIC_APP_URL` is the customer-facing domain** — the pay link is built from it. It must be the domain customers already know from the website and their invoices (`wellness.mydawaiwala.com`), **not** a `*.vercel.app` preview URL. An unfamiliar domain in a payment link is the loudest phishing signal there is, and no amount of page design compensates.
- [ ] **Verify the payee name your VPA resolves to** — send ₹1 to the VPA from your own phone and read the name your UPI app displays. It comes from the bank's records, **not** from our page. The page tells the customer to check that name matches — if it shows a personal name instead of the business, that copy backfires. Fix the VPA registration, or change the name shown on the page to match reality.
- [ ] **Backend deploy (Render)** — `payToken` field + `GET /api/appointments/pay/:token` (public) + `POST /api/appointments/:id/pay-link` (authed). Push WellnessBackend to main → Render auto-deploys. _Until this ships, "Request payment" will error — the token can't be minted._
- [ ] **Smoke test** — open a paid-pending enquiry → Request payment → WhatsApp opens with the memo → open the link on a phone → confirm the payee name in your UPI app is right → pay ₹1 to yourself → tick "Payment received" → reopen the link → it should read "Payment received — thank you".

---

## Therapist profile pic + certificates (added 2026-06-13)

Frontend code is fully built and the production build is green. These steps make it live.

- [ ] **Get UploadThing token** — sign up at https://uploadthing.com (free, 2GB/mo) → API Keys → copy the **V7 Token**
- [ ] **Local env** — add `UPLOADTHING_TOKEN=<token>` to `.env.local`
- [ ] **Vercel env** — add the same `UPLOADTHING_TOKEN` to Vercel project env vars (Production **and** Preview)
- [ ] **Backend patch (Render + Mongoose)** — apply [scripts/THERAPIST_BACKEND_PATCH.md](scripts/THERAPIST_BACKEND_PATCH.md) to WellnessBackend (~10-line model edit + maybe validator), push to main → Render auto-deploys. _Doing this "someday" — until then, uploaded files won't persist to therapist records._
- [ ] **Restart dev** — restart `npm run dev` after the `.env.local` change so the token loads
- [ ] **Smoke test** — add a therapist → upload profile pic + 1–2 certificates → save → reopen the therapist → confirm pic + certs show → click a cert thumbnail → lightbox opens (PDF opens in new tab)

---

## Services catalog page (added 2026-06-13)

The `/dashboard/services` page is built as a **UI shell** — it runs on an
in-session mock store, so adding/editing/deleting services works for review but
**resets on refresh** (nothing is saved yet).

- [ ] **Provide real categories** — replace the placeholder `SERVICE_CATEGORIES` list in [src/lib/constant.ts](src/lib/constant.ts) with the actual service categories
- [ ] **Review the UI** — open `/dashboard/services`, try add / edit / delete, give UX feedback before it's wired to a backend
- [x] **Backend (Render + Mongoose)** — DONE: Service model + `/api/services` CRUD + `SRV-####` counter, deployed to the new backend.
- [x] **Swap data layer** — DONE: `src/data/service/service.ts` now calls `/api/services` (mock store removed; hook signatures unchanged).

---

## Enquiry drawer: activity log + status note (added 2026-06-16)

Frontend is built. Past-date blocking, inline save indicator, status-override
note, and a derived activity timeline all work now. Full persistence + the
multi-user safety net need the backend.

- [ ] **Backend (Render + Mongoose)** — apply [scripts/ENQUIRY_BACKEND_PATCH.md](scripts/ENQUIRY_BACKEND_PATCH.md): add `activityLog[]` + `statusNote` to the Appointment model so the log and override-reasons persist across refresh.
- [ ] **Concurrency guard (recommended)** — the same doc has an optimistic-concurrency check. Without it, two people editing the same lead silently overwrite each other. Apply it, then tell me to wire the 409 "changed by someone else" handling in the drawer.
- [ ] **(Optional) server-side `$push`** — switch to sending only new log entries instead of the whole array (doc section 2). Tell me to update the drawer if you do this.

---

## Enquiry funnel completion: Payment → Ongoing → Completed (added 2026-06-16)

Funnel now continues past "Assigned": record payment (₹ + method) → auto Ongoing
→ Mark completed (blocked until paid). Stepper shows 5 milestones; cancelled
stays an off-ramp. Spec: docs/superpowers/specs/2026-06-16-enquiry-funnel-completion-design.md (local).

- [ ] **Backend (Render + Mongoose)** — apply [scripts/FUNNEL_COMPLETION_BACKEND_PATCH.md](scripts/FUNNEL_COMPLETION_BACKEND_PATCH.md): add `paymentReceived`, `paymentAmount`, `paymentMethod`, `paymentReceivedAt`, `completedAt`. Until then payment detail is session-only (status ongoing/completed already persists).

---

_Add new operator-only tasks below as they come up._
