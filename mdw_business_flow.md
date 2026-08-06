# MDW Wellness — Business Logic & Implementation Plan

**Purpose of this document:** This is the source-of-truth business logic for MDW Wellness, written for an AI coding agent to (1) compare against the existing codebase, and (2) assess feasibility of implementing what is not yet built.

---

## INSTRUCTIONS FOR THE AGENT — READ FIRST

Do this in two strict phases. Do not start writing/changing code in Phase 1.

### Phase 1 — Gap Analysis (produce a separate file, do not modify code)

1. Read through the entire existing codebase (Next.js dashboard + Render backend server + MongoDB schema/models).
2. For every section below (Vitals, Therapy, Enquiry, Packages, Add-ons, Invoicing, Payments), produce a side-by-side comparison table with these exact columns:

   | Feature (from this plan) | Currently Implemented? (Yes/No/Partial) | Where in codebase (file/function/collection) | Notes / Discrepancies |

3. For anything marked "No" or "Partial," add a second table:

   | Feature Not Implemented | Feasibility to Build (Easy/Medium/Hard) | Reason | Suggested Approach | Estimated Effort |

4. Flag any conflicts between this plan and existing code (e.g., if the DB schema already models something differently than described here).
5. Flag any technical constraints that would make something in this plan difficult (e.g., MongoDB schema design issues, missing auth, no payment gateway integrated yet).
6. Output this as a new file: `gap-analysis.md`. Do not touch any source code in this phase.

### Phase 2 — Implementation (only after Phase 1 is reviewed by the founder/dev)

Do not begin implementation until explicitly told to proceed after the gap analysis is reviewed.

---

## 1. Business Overview

MDW Wellness has two independent service lines under one brand and one customer base:

```
MDW Wellness
├── Vitals — home visit health tests, subscription-based
└── Therapy — consultation + home visit treatment, package-based
```

These share a customer record but have separate booking flows, pricing models, and operational rules. Do not merge their logic.

---

## 2. Vitals Service

### 2.1 Subscription Plans (fixed catalogue, currently 3 plans)

| Plan | Price | Includes |
|---|---|---|
| One-Time Wellness Check | ₹99 (one-time) | 1 home vitals check, mobile report card |
| Monthly Wellness Care | ₹149/month | 2 home vitals checks (alternate week), mobile reports after each visit, month-end summary, priority medicine delivery |
| Quarterly Wellness Care+ | ₹499/quarter | 6 home vitals checks (alternate week), printed physical report, priority medicine delivery, medicine stock priority, flat ₹9 delivery fee, priority WhatsApp support |

### 2.2 Rules

- Payment is **always advance/upfront** — no visit is scheduled before payment clears.
- Renewal is **manual** (not auto-charged). System should send WhatsApp reminders at **5 days before expiry** and **1 day before expiry**.
- **Missed visit policy:** visit lapses, no carry-forward to next cycle. One free reschedule allowed if customer informs at least 24 hours in advance. No second reschedule.
- A customer who changes plans (e.g. One-Time → Monthly → Quarterly) is **NOT** a new customer record. See Section 5 (Customer Identity Model).

---

## 3. Therapy Service

### 3.1 Two Entry Points

A customer can enter therapy in one of two ways, decided during the enquiry call by the MDW executive:

1. **Online Consultation first** (for customers unsure what they need) — ₹500, paid in advance, non-refundable on no-show. Used to determine what the home visit therapy plan should consist of.
2. **Direct Home Visit Therapy** (for customers who already know what specific therapy they need).

### 3.2 Home Visit Therapy — Dynamic Packages

Packages are **not hardcoded**. They live in a `package_catalogue` that admin can create, edit, or retire at any time without a code change.

Example shape (illustrative, not fixed values):

```
package_catalogue
├── package_id
├── therapy_type        (e.g. "home_visit_therapy", "dry_needling")
├── name                 (e.g. "Standard Pack")
├── session_count
├── validity_days
├── total_price
├── price_per_session    (derived: total_price / session_count)
└── status               ("active" | "retired")
```

- Founder will confirm actual package sizes/pricing later — the system must support **any number of packages with any session count being added later**, not just a fixed set.
- Different therapy types (e.g. dry needling vs general physiotherapy) may have **their own separate package options**.
- Package purchase = **full payment upfront**, before session 1. (Decision: chosen over pay-per-session or split-payment for cash flow and commitment reasons at current startup stage.)
- A package purchase generates its own **Package Purchase Invoice** (see Section 6).
- Each package has a validity window (e.g., must be used within X days of purchase). Missed sessions within that window: **one reschedule allowed with 24-hour notice**, same as Vitals. After the validity window expires, remaining sessions lapse (no refund implied, but this should be confirmed with founder before being enforced/communicated to customers).

### 3.3 Mid-Session Add-on Therapies

This is the core differentiator and must be modeled precisely.

**Add-on Catalogue (fixed, admin-managed — NOT free text):**

Therapists must select add-ons from a predefined list. Free-text entry is explicitly disallowed because it breaks reporting/analytics (e.g. "Dry Needling" vs "dry needling" vs "DN" would be uncountable).

```
addon_catalogue
├── addon_id
├── name                  (e.g. "Dry Needling")
├── description
├── standalone_price      (price if customer books this independently)
├── recommended_price     (discounted price if therapist recommends it mid-session)
└── duration_minutes
```

**Two distinct paths for the same add-on therapy:**

| Path | Trigger | Price | Invoice | Payment Timing |
|---|---|---|---|---|
| **Therapist-recommended (in-session)** | Therapist notices mid-session that customer needs it, recommends it on the spot | Discounted `recommended_price` | Added as a line item to the **same session invoice** | End of visit (new customers) or within 24hrs (established customers) |
| **Standalone booking** | Customer proactively books this therapy independent of any ongoing package | Full `standalone_price` | **Separate invoice** | Advance, before appointment |

**Why same invoice for in-session add-ons:** one visit = one invoice (standard practice), cleaner for customer, the discount is contextual to being recommended during that specific visit, and it prevents disputes since everything for that day is on one document.

**Consent / Audit Trail for In-Session Add-ons (required, not optional):**

1. Therapist selects the add-on from the catalogue in-app and taps "Recommend to Customer."
2. System sends customer a WhatsApp message with the add-on name, discounted price, and asks for a YES/NO reply.
3. Customer's WhatsApp reply is logged with timestamp as the consent record.
4. This must be stored as a structured record, not just a chat log:

```
addon_recommendation
├── recommendation_id
├── session_id / appointment_id
├── customer_id
├── therapist_id
├── addon_id
├── price_charged
├── price_type            ("recommended_rate" | "standalone_rate")
├── recommended_at        (timestamp)
├── customer_response     ("YES" | "NO" | "no_response")
├── customer_responded_at (timestamp)
└── response_channel      ("whatsapp")
```

### 3.4 Session Notes (Clinical History)

Every therapy session should log structured notes, not just "session completed":

```
session_record
├── session_id
├── appointment_id
├── customer_id
├── therapist_id
├── session_date
├── session_number         (e.g. "3 of 8")
├── chief_complaint         (what customer reported that day)
├── therapist_observations
├── treatment_given[]
├── progress_rating         (e.g. 1-5 scale)
├── addons_recommended[]
├── addons_accepted[]
└── next_session_notes
```

This matters for continuity (different therapist covering a session), dispute resolution, and future "wellness summary" type reports to customers.

### 3.5 Therapists

- Therapists are **individual practitioners**, not MDW employees.
- All invoices are issued **from MDW**, not from the therapist directly.
- (Open item — not yet discussed: how/whether therapist payouts or commission tracking should be modeled. Flag this as an open question in the gap analysis, do not assume an answer.)

---

## 4. Enquiry & Booking Flow

### 4.1 Lead Capture

- When a customer clicks the WhatsApp contact button — **even if they never send an actual message** — this must be recorded as a lead/enquiry.
- An MDW executive manually follows up with every captured lead.

### 4.2 Enquiry → Booking Flow

```
Customer clicks WhatsApp button
        ↓
Lead recorded (even with zero messages sent)
        ↓
MDW Executive reaches out (call/message)
        ↓
Executive determines path:
   - If customer knows exactly what they need → Direct Home Visit Therapy
   - If customer is unsure → Online Consultation first
        ↓
Executive asks customer for availability (date/time)
        ↓
Executive checks & confirms therapist availability for that slot
        ↓
Executive allocates a specific therapist
        ↓
Enquiry marked as scheduled/converted
```

### 4.3 Enquiry Table — Required Fields

```
enquiry
├── enquiry_id
├── customer_name
├── customer_phone
├── customer_location
├── query_source           ("whatsapp_button" | "direct_call" | "referral")
├── query_message           (if any was actually sent)
├── path_chosen             ("direct_home_visit" | "online_consultation_first")
├── preferred_datetime       (customer's stated availability)
├── therapist_assigned
├── therapist_availability_confirmed  (boolean)
├── executive_id             (who handled this enquiry)
├── status                   ("new" | "contacted" | "scheduled" | "converted" | "dropped")
├── drop_reason              (if status = dropped — capture why, for business analysis)
├── created_at
└── updated_at
```

---

## 5. Customer Identity Model

- **One permanent customer_id per real person.** Do not create a new customer record when a plan changes or a new package is purchased.
- All subscriptions, packages, sessions, and enquiries reference this single customer_id.
- Latest active subscription/package is determined by **querying** (e.g. `status: active`, sorted by `created_at` descending) — not by overwriting or duplicating records.
- This preserves full customer history under one identity while always being able to surface "what's currently active."

```
customer (single permanent record)
├── customer_id
├── name, phone, address, etc.
├── subscriptions[]   (Vitals — history of all plans, each with its own status)
└── customer_packages[]  (Therapy — history of all packages purchased)
```

---

## 6. Invoicing

### 6.1 Invoice Types (must be distinguishable via a field, not inferred)

| Invoice Type | Generated When | Contains |
|---|---|---|
| `vitals_subscription` | Vitals plan purchased | Plan name, price, validity |
| `package_purchase` | Therapy package bought | Package name, session count, total price, validity |
| `therapy_session` | After each home visit therapy session | Included services (₹0, covered by package) + any add-on charges |
| `therapy_addon_standalone` | Add-on booked independently of a package | Full standalone price |
| `online_consultation` | After online consultation booking | ₹500 flat |

### 6.2 Session Invoice — Required Breakdown

Every session invoice must show a **full breakdown of services applied during that visit**, not just a total. Example:

```
Invoice #INV-2025-0089
Customer: [name] | Appointment: [id] | Date: [date]
Therapist: [name] | Package: [name] | Session: [n] of [total]
─────────────────────────────────────────
Home Visit Therapy              ₹0   (covered by package)
TENS Therapy                    ₹0   (covered by package)
Dry Needling                  ₹299   (therapist recommended, discounted rate)
─────────────────────────────────────────
Total Due                     ₹299
Payment: [method, timestamp]
Sessions remaining: [n] of [total]
Package valid until: [date]
```

**Open question for founder (flag in gap analysis, do not assume):** should fully-covered services show the real market price struck through (e.g. ~~₹400~~ ₹0) to visually reinforce package value, or just show ₹0 with a note? Founder has not yet decided this.

### 6.3 Invoice Generation Architecture (already decided, should already exist)

- Each customer has one `customer_id`.
- Each appointment/session has its own ID.
- Each appointment/session ID populates its own invoice and PDF.
- Confirm in gap analysis whether this matches current implementation.

### 6.4 Invoice Delivery

- Invoices are sent via WhatsApp using the `wa.me` URL scheme with a link to the hosted PDF (e.g. on Cloudflare R2). This does not auto-send — it opens a pre-filled WhatsApp message that staff/system taps "Send" on, OR (if a payment gateway with webhook automation is added later) this can be triggered automatically.
- Confirm whether this is currently implemented and how the PDF is hosted today.

---

## 7. Payments

### 7.1 Advance vs Post-Payment Rules

| Scenario | When to Charge | Reasoning |
|---|---|---|
| Vitals — any plan | Always advance, before visit is scheduled | Home visit has real cost; no payment, no scheduling |
| Online consultation | Advance (₹500) | First interaction, no trust/relationship yet |
| First-time customer, first home visit therapy | Advance | Same reasoning — no history with this customer |
| Therapy package purchase | Full advance, before session 1 | Cash flow + commitment, appropriate for startup stage |
| In-session therapist-recommended add-on | Post-payment — collected at end of visit (new customers) or within 24hrs (established/returning customers) | Happens in real-time mid-session, cannot be pre-charged |
| Standalone add-on booking (not mid-session) | Advance | Planned booking like any new session, treated the same as a first-time booking |

### 7.2 No-Show / Cancellation Policy (needs founder confirmation before going live)

Proposed default, not yet confirmed by founder:
> No-shows forfeit the session/visit with no refund. One reschedule allowed if customer notifies at least 24 hours in advance, for both Vitals and Therapy.

Flag in gap analysis as a policy that needs explicit founder sign-off before being enforced in the product (refund logic, T&Cs, etc.)

### 7.3 Payment Gateway

- **No payment gateway is currently implemented.**
- Recommended: **Razorpay** — has a Subscriptions API (good fit for Vitals Monthly/Quarterly even though renewal is manual for now, this keeps the door open for future automation), an Orders API (good fit for therapy sessions/packages), webhook support, and broad UPI/card/netbanking coverage suited for the Indian market.
- Suggested automated flow once integrated:

```
Customer books appointment / package
        ↓
Razorpay payment link generated (by Render server)
        ↓
Customer pays
        ↓
Razorpay webhook → Render server
        ↓
Server marks appointment/package as "paid"
        ↓
Invoice PDF generated
        ↓
Sent via WhatsApp (wa.me flow)
```

- Flag in gap analysis: what payment collection currently happens (cash? manual UPI QR? nothing automated?) and the realistic effort to integrate Razorpay given the current Render server structure.

---

## 8. Open Items NOT Yet Decided (do not assume answers — flag these explicitly in the gap analysis as "pending founder input")

1. **Refunds & cancellations** — no policy defined yet for partial refunds on unused package sessions, Vitals subscription cancellations mid-cycle, etc.
2. **GST / tax handling on invoices** — not discussed. Needs clarification on whether MDW is GST-registered and whether invoices need tax line items.
3. **Switching therapists mid-package** — if a customer wants a different therapist partway through an active package, no process is defined for this yet.
4. **Therapist payouts/commission** — therapists are independent practitioners; how/whether the system tracks what MDW owes each therapist per session/add-on is undefined.
5. **Package validity expiry enforcement** — confirmed conceptually (sessions lapse after validity window) but exact refund/grace-period behavior is not confirmed by founder.
6. **Struck-through pricing on invoices** — cosmetic/psychological invoice decision, pending founder choice (see Section 6.2).
7. **Final package sizes/pricing and full add-on therapy catalogue** — founder has not yet finalized these; system must be built to support catalogue entries being added/edited at any time rather than hardcoded values.

---

## 9. Summary Table of All Decisions Made (for quick reference)

| Topic | Decision |
|---|---|
| Service structure | Vitals and Therapy are separate service lines, shared customer base |
| Enquiry capture | Record even zero-message WhatsApp clicks; executive manually follows up |
| Booking path decision | Made by executive during follow-up call (online consult vs direct home visit) |
| Vitals missed visit | Lapses, one reschedule allowed with 24hr notice |
| Therapy missed session | Within package validity window, one reschedule allowed with 24hr notice |
| Vitals renewal | Manual, with WhatsApp reminders at 5 days and 1 day before expiry |
| Customer record model | One permanent customer_id; plans/packages are child records preserving full history |
| Online consultation | ₹500, advance payment, non-refundable on no-show |
| Therapy packages | Dynamic, admin-managed catalogue; no fixed/hardcoded sizes; multiple package types per therapy type allowed |
| Therapy package payment | Full payment upfront before session 1 |
| Add-on catalogue | Fixed, admin-managed list — therapists select from list, no free text |
| Add-on consent | Therapist logs recommendation in-app + customer WhatsApp YES/NO reply, both timestamped |
| Session notes | Structured clinical notes logged per session |
| Add-on invoicing (in-session) | Same invoice as the session, separate line item, discounted price |
| Add-on invoicing (standalone) | Separate invoice, full price, advance payment |
| Add-on payment timing (in-session) | End of visit for new customers, within 24hrs for established customers |
| Therapists | Independent practitioners; invoices issued from MDW, not the therapist |
| Payment gateway | None yet; Razorpay recommended |

---

*End of plan document. Proceed to Phase 1 (Gap Analysis) only.*