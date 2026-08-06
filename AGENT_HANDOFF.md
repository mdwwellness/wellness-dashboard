# MDW Wellness — Agent Handoff Context

**Last updated:** 2026-07-17  
**Purpose:** Onboard a new agent on invoice/appointment/enquiry MVP work.  
**Do not treat planning markdown in repo root as source of truth without cross-checking code.**

---

## 0. READ FIRST — the enquiry funnel changed on 2026-07-17

**§4, §5 and §11 below describe the RETIRED funnel.** They are kept for context on
old records, but do not build against them. What actually ships now:

**Old (retired):** reach out → consult slot → physio assignment → payment → completion.
Payment was gated on `physioAssignmentConfirmed` — i.e. **assign, then pay**.

**New (client-approved, built on branch `feat/enquiry-pay-first-funnel`):**

```
1. Lead info  →  2. Executive reach-out  →  3. Confirm booking
   →  4. Payment (THE GATE)  →  5. Assign therapist  →  enquiry done
```

- **Payment now gates the therapist**, not the reverse. The old order was backwards.
- **The enquiry's job ENDS at step 5.** Sessions, courses, follow-ups = Appointments work.
- **No session count, no package, no therapy-type in the drawer.** (`T21`, `6e362d6`)

### Field semantics that CHANGED (this is what will bite you)

| Field | Was | **Is now** |
|-------|-----|------------|
| `typeOfappointment` | vague "consultation"/"appointment" | **the confirmed booking type**: `consultation` = Online consultation, `appointment` = Home visit. Set at step 3. Reused deliberately — the Mongoose schema is strict, so a new `bookingType` field would be **silently dropped**. |
| `quotedPrice` | booking price | **the agreed fee**, pre-filled from the Services catalogue at step 3, editable. Step 5 refuses to confirm without it — an unpriced record generates **no invoice** (`47964ee`). |
| `slot` | "session 1 copied from `physioSlot` on payment" | **written directly at step 5** on the enquiry's own record (same row, no duplicate). `physioSlot` is no longer written at all. |
| `physioSlot`, `physioAssignmentConfirmed`, `consultationSlot`, `consultationCompleted` | the funnel | **legacy — read-only history.** Still in the schema and still on old records so they open cleanly; nothing writes them. Do **not** revive them. |
| `payToken` | — | **NEW.** Random, server-minted token behind the public `/pay/<token>` page. Never derive it from `enquiryId` (sequential = enumerable). |

⚠️ **`slot.date` is a `Date` backend-side but the pickers speak `"yyyy-MM-dd"`.** It
arrives as a full ISO string. Compare via `toDayKey()` (`src/components/pages/enquiries/booking.ts`)
or every slot looks free and you'll ship a double-booking.

### New endpoints (see §8)
- `POST /api/appointments/:id/pay-link` — authed, idempotent, mints `payToken`
- `GET  /api/appointments/pay/:token` — **public**, rate-limited, field-limited

### Where to start
`KANBAN.md` → the **🧪 Pay-first enquiry funnel** block has the full change list,
the deploy order (**backend first**), and the test walk-through. **T32 is blocking.**

---

## 1. Project overview

**MDW Wellness** is a therapy + vitals wellness business dashboard. This workspace is the **staff dashboard** (Next.js). It talks to a separate **Node/Express + MongoDB backend**.

Core flows in scope:

| Flow | Page | Who uses it |
|------|------|-------------|
| Enquiry funnel | `/dashboard/enquiries` | Executive / customer care |
| Appointments / visits | `/dashboard/appointments` | Therapist + staff |
| Invoices | `/dashboard/invoices` | Staff |
| Customers | `/dashboard/customers` | Staff |
| Services catalogue | `/dashboard/services` | Admin |

**Business rule (therapy):** One customer buys a **session package** (e.g. 6 sessions). Therapist visits happen over time. **Add-ons** recommended mid-visit stack on the **same appointment row**, not new rows. **Invoices** should update when package payment, add-ons, or session progress changes.

---

## 2. Connected repositories

| Repo | Local path | GitHub remote | Default branch |
|------|------------|---------------|----------------|
| **Frontend (dashboard)** | `C:\workspace\backend-mdw\WellnessFrontend` | `git@github.com-new:mdwwellness/wellness-dashboard.git` | `main` |
| **Backend (API)** | `C:\workspace\WellnessBackend` | `git@github.com:mdwwellness/wellness-backend.git` | `main` |

**Important:** These are **sibling folders**, not a monorepo. Frontend env points backend via `BACKEND_BASE_URL` / `BACKEND_BASE_URL_LOCAL`.

**Production frontend:** `wellness-dash.vercel.app` (user screenshots reference this).

**Backend:** Merged to `main` via PR #1 (`c42e78c`). Must be deployed separately (e.g. Render) with env vars.

---

## 3. Environment & local dev

### Frontend (`WellnessFrontend/.env.local`)

- `BACKEND_BASE_URL_LOCAL=http://localhost:10000` (local)
- `BACKEND_BASE_URL` (production API URL on Vercel)
- `UPLOADTHING_TOKEN` — therapist file uploads (frontend UploadThing route)

### Backend (`WellnessBackend/.env`)

- `DATABASE_URL` — MongoDB
- `PORT=10000` (local)
- **`UPLOADTHING_TOKEN`** — **required for invoice PDF upload** (must be on backend, not only frontend)
- See `WellnessBackend/.env.example`

### Run locally

```bash
# Backend
cd C:\workspace\WellnessBackend && npm run dev   # port 10000

# Frontend
cd C:\workspace\backend-mdw\WellnessFrontend && bun run dev   # port 3000
```

**Restart backend** after model/schema changes — Mongoose loads schemas at startup.

---

## 4. Architecture (single collection model)

**Enquiries and appointments share one MongoDB collection:** `AppointmentBooking`.

- `status: "enquiry"` → shown on **Enquiries** page
- `status !== "enquiry"` → shown on **Appointments** page (filtered in frontend query)
- `appointmentKind: "recommended"` → **legacy** separate rows; **filtered out** of appointments list

### Key appointment fields (therapy package)

| Field | Meaning |
|-------|---------|
| `service` | **Offering from website** — `"Home Therapy"`, `"Online Consultation"`, `"Vitals Check"` |
| `packageServiceId` | Catalogue `serviceId` for session package (e.g. `SRV-0003`) |
| `sessionNumber` | Current session index (1, 2, 3…) |
| `sessionsCompleted` | How many sessions done on **this row** (single-row model) |
| `packageOriginId` | Links to enquiry / first record `_id` |
| `recommendedServices[]` | Stacked add-ons on this visit |
| `paymentReceived` / `paymentAmount` | Payment (set in enquiry drawer step 4 — now **the gate** for assigning a therapist) |
| `physioSlot` | ⚠️ **RETIRED 2026-07-17** — legacy history only; nothing writes it. See §0. |
| `slot` | Active visit date/time. ⚠️ **Since 2026-07-17 written directly at step 5**, not copied from `physioSlot`. See §0. |
| `payToken` | Token behind the public `/pay/<token>` page (§0) |

### Add-on subdocument (`recommendedServices[]`)

```ts
{
  serviceId, serviceName, category, quotedPrice,
  status: "pending" | "confirmed",
  recommendedAt, recommendedBy, confirmedAt, confirmedBy,
  paymentCollected?, paymentCollectedAt?  // added in uncommitted work
}
```

Only **confirmed** add-ons go on invoice line items.

---

## 5. What was completed (committed & pushed)

### Frontend `main` — last pushed commits

| Commit | Summary |
|--------|---------|
| `477ebbc` | Enquiry: package picker at payment, auto session 1 from physio slot |
| `7be0004` | Invoice MVP UI, stacked add-ons, package progress column |

### Backend `main` — merged PR #1

| Area | Files |
|------|-------|
| Customers | `models/customerModel.ts`, `controllers/customerController.ts`, `routes/customerRoutes.ts` — `CUST-####` |
| Invoices | `models/invoiceModel.ts`, `controllers/invoiceController.ts`, `lib/invoiceGeneration.ts`, `lib/invoicePdf.ts` |
| Recommendations API | `POST /api/appointments/:id/recommendations`, `.../confirm` |
| Package fields | `packageServiceId`, `sessionNumber`, `packageOriginId` on appointment model |

### Features shipped (in production code on `main`)

- [x] Invoices list + create drawer + customer search + PDF regenerate
- [x] ~~Enquiry funnel drawer (reach → consult → physio → payment → completion)~~ ⚠️ **superseded 2026-07-17 — see §0**
- [x] ~~Package picker in enquiry Step 4~~ ⚠️ **removed** (`6e362d6`, T21)
- [x] ~~Payment received → sets `packageServiceId`, copies physio slot → `slot`, `sessionNumber: 1`~~ ⚠️ **superseded — see §0**
- [x] Therapist add-ons via `recommendedServices[]` (not new appointment row)
- [x] Legacy `appointmentKind: "recommended"` rows hidden from appointments table
- [x] Invoice PDF with MDW branding + UploadThing (unique filename to avoid 409)
- [x] Multiple enquiries per same phone allowed

---

## 6. Work in progress — **NOT committed** (critical for next agent)

User requested **single-row package model**: no duplicate rows per session; same row updates; add-ons stay on same row; invoice syncs dynamically.

### Uncommitted frontend changes

| File | Change |
|------|--------|
| `src/lib/package-progress.ts` | Progress from `sessionsCompleted` on one row; `dedupePackageAppointments()` |
| `src/components/pages/appointment/visit-sections.tsx` | **NEW** — Package block + add-ons block + per-section payment |
| `src/components/pages/appointment/appointments-detail-page.tsx` | Drawer uses `VisitSections`; removed `BookNextSessionBlock` |
| `src/components/pages/appointment/work-checklist.tsx` | Session complete bumps `sessionsCompleted`; no payment checkbox |
| `src/components/pages/appointment/appointments-details-page.tsx` | `compact` mode hides duplicate package/time fields |
| `src/data/appointment/appointment.ts` | Dedupe package rows in query |
| `src/type/schema.ts` | `sessionsCompleted`, add-on `paymentCollected` |
| `src/components/pages/enquiries/enquiry-detail-drawer.tsx` | `sessionsCompleted: 0` on payment |
| **Deleted** | `book-next-session.tsx` (was creating duplicate rows) |

### Uncommitted backend changes

| File | Change |
|------|--------|
| `models/appointmentsBookingModel.ts` | `sessionsCompleted`, add-on `paymentCollected` |
| `lib/invoiceGeneration.ts` | `syncInvoiceFromAppointment()`, package visit line items, invoice on payment |
| `controllers/appointmentController.ts` | Call `syncInvoiceFromAppointment` on update + add-on confirm |

### Intended UX (uncommitted)

```
ONE appointment row per customer+package
├── Package section: progress 2/6, visit date, package payment status
├── Add-ons section: only when needed; each add-on has confirm + payment status
├── Details form (compact when package exists)
└── Visit checklist: Arrived → Performed → This session completed
    └── On complete: sessionsCompleted++, clear add-ons, reschedule same row OR mark package done
```

### Known gap in uncommitted work

- **Duplicate DB rows** (e.g. tomal Session 1 + Session 2) are **hidden** via dedupe, not deleted
- `recommend-service.tsx` still exists but is **replaced by** `visit-sections.tsx` in drawer (orphan file — safe to delete after verify)
- Invoice PDF may not auto-regenerate on sync (line items update in DB; PDF regenerate may still be manual)
- WhatsApp add-on YES/NO consent not built (MVP: "Customer confirmed" button)

---

## 7. Folders & files to read first

### Frontend — start here

```
src/type/schema.ts                    # Zod types — enquiry = appointment
src/constant/index.ts                 # base_url, roles
src/lib/package-progress.ts           # Package progress + dedupe logic
src/data/appointment/appointment.ts   # React Query + filters + cache patch

# Enquiry funnel
src/components/pages/enquiries/enquiry-detail-drawer.tsx
src/components/pages/enquiries/EnquiriesPage.tsx
src/components/pages/enquiries/stage.ts

# Appointments / visits
src/components/pages/appointment/visit-sections.tsx      # NEW (uncommitted)
src/components/pages/appointment/appointments-detail-page.tsx  # drawer shell
src/components/pages/appointment/work-checklist.tsx
src/components/pages/appointment/appoitmentstable.tsx
src/components/pages/appointment/AppointmentBookingpage.tsx

# Invoices
src/components/pages/invoices/
src/actions/invoices/
src/data/invoice/

# Actions → backend
src/actions/appointments/add-appointment-recommendation.ts
src/actions/appointments/confirm-appointment-recommendation.ts
```

### Backend — start here

```
server.ts
models/appointmentsBookingModel.ts
models/invoiceModel.ts
models/customerModel.ts
models/serviceModel.ts
controllers/appointmentController.ts
controllers/invoiceController.ts
lib/invoiceGeneration.ts
lib/invoicePdf.ts
lib/uploadthing.ts
routes/appointmentBookingRoutes.ts
routes/invoiceRoutes.ts
```

### Planning docs (read for business intent — **not committed**, may be stale)

```
mdw_business_flow.md          # Business source-of-truth (founder intent)
mdw-invoice-mvp-spec.md       # Invoice MVP spec
invoice-mvp-conflicts.md      # Resolved/open conflicts
gap-analysis.md               # Phase 1 gap analysis
discussion.md                 # Design discussions
02_resolution.md              # Decision log
docs/payment-hub-options.md   # Payment gateway options
```

### Backend docs

```
WellnessBackend/docs/README.md
WellnessBackend/docs/models.md (if present)
```

### Prior agent transcript (full conversation)

```
C:\Users\manjeet\.cursor\projects\c-workspace-backend-mdw-WellnessFrontend\agent-transcripts\151e3426-3b6a-466f-9b0c-4d7687fae499\151e3426-3b6a-466f-9b0c-4d7687fae499.jsonl
```

---

## 8. API endpoints (backend)

| Method | Path | Purpose |
|--------|------|---------|
| GET/POST | `/api/appointments` | List / create |
| PUT | `/api/appointments/:id` | Update (triggers invoice sync in uncommitted code) |
| POST | `/api/appointments/:id/recommendations` | Stack add-on |
| POST | `/api/appointments/:id/recommendations/confirm` | Confirm add-on |
| POST | `/api/appointments/:id/pay-link` | **NEW** — mint/return `payToken` (authed, idempotent) |
| GET | `/api/appointments/pay/:token` | **NEW** — **PUBLIC**, rate-limited, field-limited payment summary. Add nothing to this response without asking: anyone with the link can read it |
| GET/POST | `/api/customers` | Customer records |
| GET/POST/PATCH | `/api/invoices` | Invoice CRUD |
| POST | `/api/invoices/:id/pdf?regenerate=true` | PDF generation |

Auth: JWT via `fetchWithAuth` in frontend actions.

---

## 9. Tasks completed (this agent session)

1. Invoice MVP (UI + backend + PDF)
2. Customer `CUST-####` IDs
3. Stacked therapist add-ons (`recommendedServices[]`) — no new row
4. Package progress UI (`2 of 6 completed`)
5. Enquiry drawer: package at payment + auto session 1 (Option A)
6. Committed & pushed frontend `main`; backend merged PR #1 to `main`
7. **Started** single-row refactor (uncommitted): `sessionsCompleted`, `visit-sections.tsx`, invoice sync, dedupe table

---

## 10. Tasks to review / finish (priority order)

### P0 — Must verify before calling MVP done

- [ ] **Commit & deploy uncommitted single-row work** (frontend + backend) after QA
- [ ] **End-to-end test:** enquiry → payment → session 1 on appointments → complete session → progress 1/6 → schedule next date on **same row** → add-on → confirm → invoice line items update
- [ ] **Deploy backend `main`** to Render (or prod) with `UPLOADTHING_TOKEN`
- [ ] **Restart / redeploy** after deploy so new schema fields load
- [ ] **Clean legacy data:** delete duplicate session rows (tomal Session 1+2), old `appointmentKind: "recommended"` rows

### P1 — UX polish (user explicitly asked)

- [ ] Confirm drawer is not cluttered: package block first, add-ons on demand, payment per section
- [ ] Remove or delete orphan `recommend-service.tsx` if fully replaced by `visit-sections.tsx`
- [ ] Hide therapy start/end time for package visits (compact mode) — verify in prod build
- [ ] Table: one row per customer+package — verify dedupe logic with real data

### P2 — MVP gaps from original plan

- [ ] Coupon / discount on invoices
- [ ] Enquiry picker when creating manual invoice
- [ ] Auto-assign package rules (currently manual in enquiry Step 4)
- [ ] WhatsApp add-on consent (YES/NO) vs manual confirm button
- [ ] Invoice PDF auto-regenerate when `syncInvoiceFromAppointment` updates line items
- [ ] `customer_packages` collection (long-term; currently package on appointment row)

### P3 — Therapist / KPI / other

- [ ] Phase 1 therapist dashboard KPI filtering
- [ ] Payment capture unified in work checklist vs per-section (decision made: per-section — verify)
- [ ] Vitals subscription flow (separate from therapy MVP)

---

## 11. Decisions already made (do not re-debate without user)

| Decision | Choice |
|----------|--------|
| Package catalogue | Reuse `Service` where `isPackage: true` + `packageUnit: "sessions"` |
| ~~Package at payment~~ | ⚠️ **Superseded 2026-07-17** — no package in the drawer at all (T21 / §0) |
| ~~Session 1 scheduling~~ | ⚠️ **Superseded 2026-07-17** — no session count in the drawer; step 5 writes `slot` directly (§0) |
| **Enquiry funnel order** | **Pay → then assign.** Payment gates the therapist. The enquiry ends at step 5 (§0) |
| **Booking type storage** | Reuse `typeOfappointment` (strict Mongoose drops unknown fields); labels live in `enquiries/booking.ts` |
| **Customer payment** | Public `/pay/<token>` page + dynamic UPI QR. Reconciliation stays **manual** until T34 (Razorpay) |
| Add-ons | Stack on `recommendedServices[]`, same visit, same row |
| Session 2+ | **User latest:** update **same row** (not new appointment row) |
| Add-on billing | Only `status: "confirmed"` on invoice |
| Package progress | `sessionsCompleted` counter on single row |
| Planning `.md` files | Do **not** commit discussion/planning docs unless user asks |

---

## 12. Known issues & gotchas

| Issue | Notes |
|-------|-------|
| Package column shows `—` | No `packageServiceId` until executive records payment in enquiry |
| `service` vs `packageServiceId` | `service` = website offering; `packageServiceId` = paid package |
| Invoice 500 locally | `UPLOADTHING_TOKEN` missing on **backend** `.env` |
| Invoice 409 on regenerate | Fixed with timestamped PDF filename |
| Backend changes not visible | Server not restarted after model change |
| Duplicate tomal rows in prod | From earlier "book next session" — dedupe hides; DB cleanup needed |
| `recommend-service.tsx` | Legacy UI file; drawer now uses `visit-sections.tsx` (uncommitted) |

---

## 13. Git state at handoff (2026-07-17)

### Frontend
- **Branch:** `feat/enquiry-pay-first-funnel` at `6797a0e` — **committed, NOT pushed**
- 23 files: the pay-first funnel, the therapist grid, `/pay/<token>`, the wa.me fix
- **Untracked planning docs:** `KANBAN.md`, `AGENT_HANDOFF.md`, `discussion.md`, `gap-analysis.md`, etc. — **do not commit unless asked** (staged paths explicitly for this reason)
- `.claude/` is gitignored — the local `verify` skill (how to actually run this app past the auth wall) lives there and won't travel with the repo

### Backend
- **Branch:** `feat/enquiry-pay-first-funnel` at `f4edca5` — **committed, NOT pushed**
- 3 files: `payToken` + the two new endpoints
- **Pre-existing** typecheck errors in `controllers/userController.ts` (3, from the password-reset work) — not from this branch

### Deploy order (matters)
1. **Backend first** — until `f4edca5` is live, "Request payment" can't mint a token and errors
2. **T32** — verify the UPI payee name, set `NEXT_PUBLIC_UPI_*`, check `NEXT_PUBLIC_APP_URL`
3. **Frontend** — `NEXT_PUBLIC_*` inline at build, so **redeploy**, don't restart

### Runtime-verified against a real local Mongo (2026-07-17)
Backend now runs locally: `docker run -d --name mdw-test-mongo -p 27017:27017 mongo:7`.
Confirmed against the **real** server + real Mongoose:
- `payToken` mints as 32-char hex via `crypto.randomBytes`, and re-minting is idempotent
- public `GET /pay/:token` returns **only** enquiryId/name/type/amount/paid — verified it
  leaks no phone, email, location, note, therapist, `_id` or activity trail
- `/pay/ENQ-9001` (a sequential id) and a one-char-off token both 404
- unauthed + garbage-bearer mint attempts both 401
- **found + fixed:** the pay lookup shared a 5/min bucket with the booking form and 429'd
  on the 3rd page load — CGNAT would have had real customers 429 each other out of
  paying (`669db8a`)

☠️ **`.env` `DATABASE_URL` is production Atlas, and a shell env prefix does NOT
reliably override it** — backgrounded, it silently didn't apply and the server booted
against prod. `"MongoDB connected"` does not say *which* Mongo. See
`.claude/skills/verify/SKILL.md` for the safe runner + host assertion.

---

## 14. Suggested first steps for new agent

1. Read this file + `src/type/schema.ts` + `models/appointmentsBookingModel.ts`
2. `git status` and `git diff` on **both** repos — uncommitted work is the active task
3. Run `npm run build` on both repos after any changes
4. Local smoke test: enquiries → payment → appointments drawer → complete session → check invoice
5. Ask user before: committing, pushing, deleting DB rows, or changing enquiry/appointment data model again

---

## 15. User preferences (from rules)

- Do **not** commit or push unless explicitly asked
- Do **not** commit planning `.md` files unless asked
- No Cursor co-author on commits
- Minimize scope — match existing code style
- Deploy-ready code when implementing

---

*End of handoff. Update this file when major architecture or deploy state changes.*
