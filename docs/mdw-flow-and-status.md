# MDW Wellness — System Flow & Status Report

_Traced from the current code on branch `feat/enquiry-pay-first-funnel` (both repos), 2026-07. Every claim was read from source; the money-path findings in §3 were verified directly, not relayed._

**Reading key for launch-readiness** (added per request — for every item):
- 🟢 **Start manually** — a person can handle this by hand; the business can run day-one without building it.
- 🟠 **Start manually, but painful** — runnable by hand, degrades quality or wastes time; build soon.
- 🔴 **Must build first** — the business genuinely can't operate without it.
****
**Bottom line up front:** there is **no 🔴 in this report.** MDW can start today with people doing the manual bits — most importantly, an executive checking UPI/bank and ticking "payment received" by hand. The list below is about *reducing manual work and preventing mistakes*, not unblocking launch. The two sharpest holes (the pay gate and the paid-home-visit invoice) are **now fixed**.

- **Dashboard (frontend):** `C:\workspace\backend-mdw\WellnessFrontend`
- **Backend:** `C:\workspace\WellnessBackend`
- **Public patient site:** separate repo (not in this workspace).

---

## 1. What MDW is

**MDW = My Dawai Wala** (entity: *My Dawai Wala Healthcare Services*). **MDW Wellness** is the physiotherapy / home-wellness arm — a back-office platform that runs each customer lead from first call to a paid, therapist-assigned visit, then bills it.

- **Services:** Online Consultation (video), Home Therapy (home visit), Vitals Check.
- **Users:** executives / customer-care (chase leads), therapists (do visits), admins (run everything).
- **Stack:** Next.js dashboard (Vercel) + Express/Mongoose backend (Render) + MongoDB Atlas. A public site feeds enquiries in.

---

## 2. The flow, top to bottom

```
Public site OR dashboard
   │  POST /api/appointments/public   (or dashboard intake)
   ▼
createBooking()  ──►  ENQ-####  +  CUST-#### (by phone)  ──►  NO invoice yet
   │
   ▼  Enquiry drawer (the funnel)
1. Lead info        read-only; Edit toggle (phone edits are deliberate)
2. Reach out        "Mark as reached out"  → status enquiry → scheduled
3. Confirm booking  Online consultation | Home visit  → writes typeOfappointment + quotedPrice (fee from catalogue)
4. Payment          "Request payment" → WhatsApp /pay/<token> link  →  exec ticks "payment received" by hand
5. Assign therapist LOCKED until paid → availability grid → confirm → in-place update: slot + doctor + status "ongoing"
   │
   ▼
Appears on Appointments (Advance payment = Paid)  ──►  Invoice auto-raised (now on payment — see §3.2)
```

**Detail:**
1. **Intake** — both the public form and the dashboard funnel through **one** `createBooking()` (`lib/bookingService.ts:45`). It allocates `ENQ-####`, links/creates a `Customer` by **phone** (`CUST-####`), and raises no invoice for a bare enquiry. Public intake is rate-limited (5 writes/min/IP) and **folds repeat submissions** from the same phone into the existing lead.
2. **The funnel** lives in `enquiry-detail-drawer.tsx`. The old consult-slot / physio / package sections are gone; the stepper is 4 steps: **Reached → Booked → Paid → Assigned**.
3. **Fee** — step 3 maps the booking type to a catalogue service by name (`Online Consultation` / `Home Visit Consultation`) and pre-fills `quotedPrice` from its `originalPrice` (editable). **Frontend is the pricing authority; backend records `quotedPrice`.**
4. **Payment link** — `POST /:id/pay-link` mints a random 32-hex `payToken`. The public page returns only `enquiryId, name, typeOfappointment, amount, paymentReceived` — no phone/email/notes/therapist. `/pay/<token>` shows a UPI deep-link + QR.
5. **Conversion** — confirming the therapist writes `slot`, `doctorId/doctor`, `status:"ongoing"` **in place** — no duplicate row. A converted appointment *is* the enquiry row under its `ENQ-####`.

---

## 3. Money-path findings

### 3.1 ✅ FIXED — pay-before-therapist is now enforced server-side
Was: `updateAppointment` never checked `paymentReceived`, so a raw `PUT { doctorId }` on an unpaid booking was accepted — the gate was a disabled button only. **Fixed this session:** `updateAppointment` now rejects assigning a therapist when the booking isn't paid (`appointmentController.ts`, "Record the payment before assigning a therapist"). Applies to everyone; the exception is simply to record payment first.
**Launch:** was 🟢 anyway (a disciplined team wouldn't bypass the UI) — now closed properly.

### 3.2 ✅ FIXED — a paid booking invoices immediately
Was: `shouldAutoGenerateInvoice` returned false for a paid **home visit** until it was marked "completed" — money collected, no invoice on the ledger. **Fixed this session:** any `paymentReceived` booking now raises its invoice at once (`invoiceGeneration.ts`). Verified: paid home visit → invoice, unpaid → none, paid consult → invoice.
**Launch:** was 🟠 (an exec could raise a manual invoice) — now automatic.

### 3.3 Pay-page can show a different amount than what's recorded — 🟢 start manually
The `/pay/<token>` page prices from `quotedPrice`, but step 4 records `paymentAmount` (an exec override). If they diverge, the UPI amount the customer pays disagrees with the recorded amount.
**Launch:** 🟢 — just **don't override the fee** at step 4 (leave it at the catalogue price) and the two always agree. Build the proper fix (page renders the effective amount) when you need exception pricing.

### 3.4 Dashboard-created consults bill a flat ₹500 — 🟢 start manually
A consult whose `service` isn't a recognised offering is billed a hard-coded ₹500, ignoring `quotedPrice`.
**Launch:** 🟢 — use the standard service names, or edit the invoice by hand for the rare exception. Build the fix (price from `quotedPrice` first) later.

---

## 4. Careful / manual points — and whether you can launch on them by hand

| # | Thing | Launch? | What "manual" means day-one |
|---|---|---|---|
| **a** | Every appointment edit re-derives the invoice + **re-uploads the PDF** (for *unpaid* invoices, on every save). Once paid, money is frozen. | 🟢 | Just don't rapid-edit unpaid records; it's a performance caution, not a blocker. |
| **b** | **"Payment received" is a manual tick — no gateway reconciliation.** Nothing verifies the money arrived; the `/pay` page is a self-serve UPI QR, no webhook. | 🟢 | **This is the core manual process, and it's fine to start.** An exec watches UPI/bank and ticks it. The business runs on this exactly as designed. Automate (Razorpay + webhook, T34) only when daily statement-matching *hurts from volume* — not before. |
| **c** | **One `refreshToken` per user** — a second login for the same person signs the first out. | 🟢 | Give each person their own login; don't share accounts across devices. Build the real fix (sessions) **before** the vitals dashboard, or before staff need concurrent logins. |
| **d** | **Shared, single-space IDs** (`ENQ`/`CUST`/`INV` from one global counter; enquiries + appointments share one collection). | 🟢 | Nothing to do now. It only bites when the **vitals dashboard** joins the same backend — decide the sequence question then. |
| **e** | **Invoices are permanent** — a service used by an invoice can't be deleted; there's no service-archive flag. | 🟢 | Discipline: **void, never delete** a real invoice; leave stale services in place. Build an `isActive` archive flag when the catalogue gets cluttered. |
| **f** | The T31 migration script was **deleted on purpose** (it would collapse packages). | 🟢 | Do nothing — never recreate it. Old services work via the `originalPrice ?? price` fallback. |
| **g** | Rate limiter is **in-memory & per-instance** (resets on restart, not shared). | 🟢 | Fine at starting volume. Move to a shared store only if you scale to multiple instances. |
| **h** | **Local testing writes to production Atlas** (`.env` points at prod). | 🟢 | Dev-only caution: use a throwaway local MongoDB for anything destructive. Not a business concern. |

---

## 5. Can you start the business now? — the direct answer

**Yes.** The full loop works today: capture a lead → confirm the booking + fee → take payment (manually verified + ticked) → assign a therapist (now server-enforced to require payment) → the visit shows on Appointments → an invoice is raised. Nothing in this report is a 🔴 "can't run without it."

**The one inherently-manual thing you're accepting at launch:** **payment reconciliation.** A person confirms the UPI/bank credit and ticks "payment received." That's a real, ongoing human task — but it's a normal way to start, and it's the *only* manual step on the critical path. When the volume of that daily checking becomes a burden, that's the signal to build **Razorpay auto-reconciliation (T34)** — a payment webhook ticks it automatically. Not before.

**Everything else** (data validation, session/price editing, archiving, concurrent logins) is either a convenience or a scale concern, and can be run by hand or avoided by simple discipline until built.

---

## 6. WhatsApp / OTP — the fact-check

**Your statement is TRUE, with one precision.** The app's only WhatsApp code (`src/lib/whatsapp.ts`) builds **`wa.me` click-to-chat links** — a human taps send. No WhatsApp API, no auto-sending.

| Approach | Template needed? | Suspension risk |
|---|---|---|
| **`wa.me` click-to-chat** (what you use) | No | **None** — a person sends it |
| **Official WhatsApp Business API** (for auto-OTP) | **Yes** — an approved *authentication* template | Low, but gated on Meta approval + per-message cost |
| **Unofficial automation** (whatsapp-web.js, to skip templates) | No | **High — numbers get banned;** OTP-pattern sending is what Meta detects |

An automated WhatsApp OTP without a template means the official API refuses it, or the unofficial route gets the number **suspended**. No free "just send the code" path. That's why the OTP features (**T24, T25**) were **parked**, forgot-password OTP went over **email (SMTP)**, and everything WhatsApp-facing is a **human-sent link** — safe forever. **Launch:** 🟢 — click-to-chat is fine to run indefinitely; only *automated* OTP needs the template/approval project.

---

## 7. Pages — what to work on and what to update

| Page | State | Launch | What to do |
|---|---|---|---|
| **Services** | ✅ signed off | 🟢 | Add an **archive (`isActive`)** flag so retired services hide without deleting. |
| **Enquiries** | 🟡 pay-first built + §3.1/§3.2 fixed | 🟢 | Walk the end-to-end test, then sign off. §3.3/§3.4 are optional polish. Current lock. |
| **Appointments** | 🔴 needs a real pass | 🟠 | (1) Can't set **sessions/price after booking** — set it right at booking, or raise a manual invoice as the workaround. (2) Availability grid reads the **deduped** list → can show "free" where booked → double-booking; exec verifies availability by hand until fixed. (3) Test the **Advance payment** column. |
| **Public booking form** | 🔴 unguarded front door | 🟠 | **No phone/email validation** — junk phones mint junk customers, typos split real ones. Runnable (execs clean data by hand) but it degrades your customer DB fast. **Strongest single fix.** Different repo. |
| **Invoices** | 🟡 works | 🟢 | Dense ERP redesign (label/value pairs, one table, fewer boxes). Functional as-is. |
| **Customers** | 🟡 fragile | 🟢 | List is derived from appointments by phone → a customer with no appointment is invisible, a phone typo = two people. Drawer still shows retired funnel fields (cosmetic). |
| **Dashboard** | 🟡 | 🟢 | T1 — doesn't refresh on changes (manual refresh button works meanwhile). |
| **Follow-ups** | ⚪ unreviewed | ? | Not yet mapped — review before trusting. |
| **Therapists** | ⚪ | 🟢 | Exists (list + pics/certs); not in the current lock. |
| **Settings** | ✅ mostly | 🟢 | Admin user management done. |

**Deploy note:** the pay-first funnel + these fixes are on `feat/enquiry-pay-first-funnel` (both repos, pushed, **not merged**). Merge **backend first**, then frontend, or "Request payment" errors. **T32** (verify the UPI payee name + set UPI/domain env) gates the payment *link* only, not the funnel test.

---

## 8. One-paragraph summary

MDW Wellness is a lead-to-visit operations platform for a home-physiotherapy business: an enquiry becomes a lead; an executive reaches out, confirms the booking type and fee, takes payment (a manual tick against a self-serve UPI link), and only then assigns a therapist — turning the lead into an appointment that's billed. **The business can start today** — everything is runnable by hand, with payment reconciliation the one ongoing manual task (automate it via Razorpay only when volume demands). The pay-first funnel is built and pushed but not merged; two money-path bugs (server-side pay gate, paid-home-visit invoicing) were **fixed and verified this session**. WhatsApp is human-sent click-to-chat only (safe); automated OTP was correctly deferred because it needs an approved template or risks a ban. The strongest improvement outside the funnel is validating the public booking form — the unguarded front door that feeds the whole system.
