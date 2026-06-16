# Operator Checklist

Manual steps that **I (the operator/owner) must do by hand** — things code can't do for me (signups, env vars, deploys, browser smoke tests). Check them off as they're done.

Legend: `[ ]` = todo · `[x]` = done · `[~]` = in progress

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
- [ ] **Backend (Render + Mongoose)** — apply [scripts/SERVICES_BACKEND_PATCH.md](scripts/SERVICES_BACKEND_PATCH.md): Service model, atomic `SRV-####` counter, CRUD endpoints. Push → Render deploys. _("someday" task_
- [ ] **Swap data layer** — after backend is live, tell me to replace the mock hooks in `src/data/service/service.ts` with real API calls (signatures already match, page won't change)

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
