# MDW Wellness — Receipt / Invoice / Customer / Package MVP — Build Spec

**Status:** This supersedes nothing from `mdw-wellness-business-plan.md` or the gap analysis — it **narrows scope** to a specific, immediately buildable slice: Customer, Receipt, Invoice, and Package handling for **Therapy only**. Payment gateway, Vitals logic, WhatsApp automation, and full session-deduction tracking are explicitly out of scope for this slice (see Section 8).

**Revision note:** This replaces an earlier draft of this spec that assumed invoice creation was fully manual. After discussion, invoice creation is now **automatic**, triggered by system events, and a **separate Receipt document** has been introduced to solve the advance-payment proof problem. See Section 4 for the reasoning.

**Purpose:** Hand this to the coding agent as the build spec for this slice of work. Read fully before writing code.

---

## 0. Instructions for the Agent

1. Read this entire document first.
2. Cross-check every section against the existing codebase (`WellnessFrontend`, `WellnessBackend`, MongoDB models).
3. **If anything in this spec contradicts, duplicates, or conflicts with existing schema, naming, or flows already in the codebase** (e.g. an existing `Customer`-like model that works differently, an existing counter pattern, an existing `Service` model field that overlaps with what's described here, an existing "session complete" trigger point that doesn't match what's assumed here) — **do not silently resolve it yourself.** Stop and produce a list of conflicts, each with 2-3 concrete resolution options and your recommendation, before writing implementation code. Output this as `invoice-mvp-conflicts.md`.
4. Only proceed to implementation after conflicts (if any) are reviewed.
5. Do not implement anything listed in Section 8 (Explicitly Out of Scope) even if related code already partially exists — flag it as existing/partial in your conflict doc instead, don't extend it under this task.
6. Section 6 contains one **unresolved open decision** that the founder has not yet answered (Receipt and Invoice as one record with a status field, vs two fully separate records). Do not assume an answer — implement against whichever option is confirmed before this reaches implementation. If implementation must start before this is confirmed, build the two-separate-records version (Option B in Section 6), since it is more conservative and easier to collapse into one record later than the reverse.

---

## 1. Scope of This Slice

Building right now:
- Permanent `Customer` model with sequential/lookup-friendly ID
- `Receipt` model — auto-generated at booking confirmation + advance payment, proof of booking for the customer
- `Invoice` model — auto-generated at session completion, full breakdown of what was delivered, editable afterward
- `Package` handling — Standard (catalogue-based) and Custom (one-off) — at the invoice level only, not full purchase/session-deduction tracking yet
- Invoice list page (`/dashboard/invoices`) with detail panel, mirroring the existing Orders-page UI pattern already in the dashboard (list left, detail panel right)
- Invoice editing — edits to a finalized invoice must reflect globally wherever that invoice is referenced/displayed (not a separate "corrected copy")
- PDF generation — manual, on-demand, triggered by a button (applies to both Receipt and Invoice independently)
- WhatsApp send — manual, on-demand, triggered by a separate button after PDF exists (uses `wa.me` link to hosted PDF, no automated delivery)

Explicitly NOT building in this slice — see Section 8 for the full list and reasoning.

---

## 2. Customer Model

### 2.1 Requirement

One permanent customer record per real person, with a stable ID that can be looked up to auto-fill receipt/invoice data.

### 2.2 Fields (minimum for this slice)

```
customer
├── customer_id          (sequential, see 2.3)
├── name
├── phone                (primary lookup key alongside customer_id)
├── email                (optional)
├── address               (optional, useful for therapist home visits)
├── created_at
└── updated_at
```

### 2.3 ID Format

Sequential, human-searchable. Proposed: `CUST-0001`, `CUST-0002`, incrementing forever (no yearly reset — customers are a permanent identity, not a time-bound record).

**Agent: confirm whether a `Customer`-equivalent already exists** (the gap analysis flagged that customers are currently derived client-side from phone-grouped appointments, with no real persisted model or ID). If so, this is the **highest-priority conflict** to resolve before anything else in this spec — both Receipt and Invoice depend entirely on `customer_id` existing and being stable. See conflict-handling instructions in Section 0.

### 2.4 Auto-fill Behavior

Anywhere a customer needs to be selected (e.g. during booking confirmation), the field should function as a **search-select** (type to search by name or ID). Selecting a customer auto-populates name, phone, and address where relevant — never requires re-typing details that already exist.

If the customer doesn't exist yet, there should be a way to create one inline (exact UX — modal vs separate flow — is an open decision, see Section 7).

---

## 3. The Two-Document Flow — Receipt and Invoice

### 3.1 The Problem This Solves

MDW collects **advance payment at booking** for most therapy scenarios (see the broader business plan, Section 7.1). A customer who pays in advance needs proof of that payment **immediately at booking time** — not days later when the session happens. But the final invoice needs to reflect **what was actually delivered**, including anything added mid-session (e.g. therapist-recommended add-ons), which by definition isn't known yet at booking time.

One document cannot cleanly satisfy both needs. So this slice uses two:

```
Booking confirmed + advance payment collected
        ↓
RECEIPT auto-generated immediately
  (proof of payment + booking, sent to customer same day)
        ↓
Session/visit happens (including any in-session add-ons)
        ↓
INVOICE auto-generated at session completion
  (full breakdown: package/session cost + add-ons + advance already paid + balance due)
        ↓
Invoice can be edited afterward if corrections are needed
  (edits reflect globally — see Section 5.4)
```

### 3.2 Receipt — Trigger and Purpose

**Trigger:** auto-generated the moment an executive confirms the appointment date with both the client and the assigned therapist, AND advance payment has been recorded as collected.

**Purpose:** proof of booking and proof of payment. Not a tax/commercial invoice. Sent to the customer via WhatsApp right away.

**Receipt Fields:**

```
receipt
├── receipt_id              (sequential, see 3.4)
├── customer_id
├── customer_name           (denormalized snapshot)
├── customer_phone          (denormalized snapshot)
├── booking_type             (e.g. "therapy_session" | "package_purchase" | "online_consultation")
├── package_type             ("standard" | "custom" | null)
├── package_name             (if applicable)
├── therapist_name           (assigned therapist)
├── scheduled_date            (confirmed appointment date)
├── amount_paid
├── payment_method            (manual entry: cash/UPI/etc — no gateway yet)
├── created_at
├── created_by                (executive who confirmed booking)
└── pdf_url                   (null until generated)
```

**Agent: confirm what existing trigger point in the booking/enquiry flow this should hook into** — per the gap analysis, the dashboard already has a flow where the executive confirms consultation/physio slots and `physioAssignmentConfirmed` gets set. Determine whether Receipt generation should fire off that same confirmation event, or whether a new explicit "Confirm Booking + Payment" action needs to be added to the existing enquiry flow. Flag this as a conflict/decision point if the existing flow doesn't cleanly support hooking in here.

### 3.3 Invoice — Trigger and Purpose

**Trigger:** auto-generated the moment a session/visit is marked complete.

**Agent: confirm what existing trigger point this should hook into** — per the gap analysis, the dashboard already has a `work-checklist.tsx` with arrived/performed/payment/completed steps. The most likely hook is the "Completed" step in that checklist. Confirm this is the correct, already-existing trigger before building a new one. Flag as a conflict if there's ambiguity (e.g. if "completed" in that checklist doesn't reliably mean "the full session including any add-ons is finished").

**Purpose:** the formal, full breakdown of what was delivered during the session, referencing the advance payment already made via the Receipt, and showing any balance due.

**Invoice Fields:**

```
invoice
├── invoice_id              (sequential, see 3.4)
├── invoice_type            (enum, see Section 4.1)
├── customer_id             (FK to customer)
├── customer_name           (denormalized snapshot at creation time)
├── customer_phone          (denormalized snapshot at creation time)
├── related_receipt_id       (FK to the receipt generated at booking, if one exists)
├── package_type             ("standard" | "custom" | null — null for online_consultation)
├── package_ref              (if standard: reference to Service/catalogue entry; if custom: null)
├── package_name             (denormalized)
├── session_number            (free text, e.g. "3 of 8" — manually entered for standard packages; null otherwise — see Section 8, full session tracking is out of scope)
├── therapist_name            (or therapist_id, if linked to existing roster)
├── line_items[]
│     ├── description
│     └── price
├── items_subtotal            (sum of line_items, or flat amount for online_consultation)
├── advance_paid               (pulled from the related receipt, if any)
├── balance_due                 (total - advance_paid)
├── total                       (sum of line items; no taxes/discounts in this slice)
├── payment_status              ("paid" | "pending" — manually toggled, no gateway logic)
├── pdf_url                     (null until generated)
├── created_at
├── created_by                   (system-generated; track which session/event triggered it)
├── last_edited_by               (if manually edited afterward)
├── last_edited_at
└── updated_at
```

**Note on denormalized customer fields:** snapshotting `customer_name`/`customer_phone` at creation time (rather than always live-joining from the Customer collection) is intentional — if a customer's details are corrected later, historical receipts/invoices should still reflect what was true at the time. Agent should confirm this is consistent with how the rest of the codebase currently handles similar historical-snapshot vs always-live-join decisions (e.g. check how appointment records currently store customer info) and flag any inconsistency.

### 3.4 ID Formats

- Receipt: sequential, yearly-reset: `RCT-{YYYY}-{0001}`
- Invoice: sequential, yearly-reset: `INV-{YYYY}-{0001}`

**Agent: use the same atomic counter pattern already in place for enquiry IDs** (gap analysis references `lib/counters.ts` / `findOneAndUpdate` + `$inc` pattern) — extend this pattern for both Receipts and Invoices (as two separate counter keys) rather than building a new mechanism. If the existing counter pattern doesn't support a yearly-reset key (e.g. it's currently a flat global counter), flag this as a conflict with options:
- **Option A:** Extend counter documents to be keyed by year and type (e.g. `{ _id: "invoice-2026", seq: 42 }`, `{ _id: "receipt-2026", seq: 17 }`), reset logic = new year creates a new counter doc starting at 1.
- **Option B:** Keep counters flat/global and just embed the year in the prefix without true reset — simpler but contradicts the "resets each year" requirement, only acceptable if explicitly flagged and approved.
- **Recommendation:** Option A.

### 3.5 Invoice Editability — Must Reflect Globally

Once an invoice is generated, it must be **editable** (e.g. correcting a line item, adjusting a price, fixing a therapist name). Edits must update the **single source-of-truth record** — not create a duplicate or a "corrected copy." Anywhere the invoice is displayed (list page, detail panel, any future customer-facing view) must reflect the latest edited state.

**Implication for PDFs:** if a PDF was already generated and sent before an edit occurs, the PDF itself is now stale (PDFs are static files, not live documents). Agent should flag this explicitly: does editing an invoice after a PDF was generated invalidate/delete the old `pdf_url` and require regeneration before it can be re-sent, or is this an edge case to handle later? **Recommendation: invalidate the old `pdf_url` on edit, force regeneration before the next WhatsApp send** — prevents sending a customer an outdated PDF without realizing it.

---

## 4. Package Handling (Invoice-Level Only, for Now)

### 4.1 Two Package Types

| Type | Meaning | Tracking |
|---|---|---|
| **Standard** | Selected from the existing admin-managed package/service catalogue | None yet — this slice does NOT implement session-count deduction or auto-tracking. Session number (e.g. "3 of 8") is **manually typed** at invoice generation time (likely by whoever marks the session complete), not system-calculated. |
| **Custom** | Built ad-hoc for this specific booking — not from any catalogue | One-off by definition — no tracking, no validity window, no future reference. |

### 4.2 Open Decision — Agent Should Flag, Not Assume

**Does "Standard" pull from the existing `Service`/catalogue model as-is (per the gap analysis, services already have `isPackage`, `packageUnit`, `packageCount` fields), or does this require a new dedicated `package_catalogue` collection as originally proposed in the full business plan?**

Options to present in the conflict doc:
- **Option A:** Reuse existing `Service` collection (`isPackage: true` entries). Fastest, no new collection.
- **Option B:** Build a new lightweight `package_catalogue` collection now. Cleaner separation for future work, more effort now.
- **Recommendation:** Option A, unless the existing `Service` model structurally conflates Vitals and Therapy in a way that would leak Vitals options into Therapy-only flows — if so, flag specifically.

---

## 5. Invoice List Page (`/dashboard/invoices`)

### 5.1 Layout

Two-pane layout mirroring the existing Orders page pattern already in the dashboard: list on the left, detail panel on the right, populated on row click.

### 5.2 List Table — Columns

| Column | Source | Notes |
|---|---|---|
| Invoice ID | `invoice.invoice_id` | clickable, opens detail panel |
| Customer Name | `invoice.customer_name` | |
| Type | `invoice.invoice_type` | |
| Amount | `invoice.total` | |
| Payment Status | `invoice.payment_status` | badge, paid = green / pending = neutral or amber |
| Date | `invoice.created_at` | sorted **latest-first by default** |

Filters above the table: **Search** (by customer name or invoice ID), **Type** filter, **Payment Status** filter. No "Source," "Return Status," or "Scheduled Delivery" equivalents — not relevant to this domain.

**Note:** since invoices are now auto-generated (not manually created via a form), there is no "+ Add Invoice" button on this page in the way originally planned. Agent should confirm whether any manual invoice creation path is still needed as a fallback (e.g. for edge cases the auto-trigger doesn't cover) — flag this as a decision point if unclear, do not silently add a manual creation form back in without confirming it's wanted.

A separate, similarly-structured `/dashboard/receipts` list page should also exist for Receipts, following the same list+detail pattern. Agent may treat this as a smaller mirror of the Invoice list page (no need to re-specify every field — apply the same structure: ID, customer, amount, date, PDF/WhatsApp actions, sorted latest-first).

### 5.3 Detail Panel — Conditional Layout

Layout changes based on `invoice_type` — fields irrelevant to a given type are omitted entirely, not shown as "N/A":

```
[Invoice ID]                         [Payment Status badge]
                                                [⬇ icon — disabled until PDF exists]

Invoice Date
Invoice Time
Invoice Type
Related Receipt ID (if applicable, linked)

─────────────────────────────

Customer Details
  Name
  Phone
  Customer ID

─────────────────────────────

[shown only if type = package_purchase or therapy_session]
Session / Package Context
  Therapist Name
  Package Name
  Package Type (Standard/Custom)
  Session Number          (if present)

─────────────────────────────

Payment Information
  Line Items:
    [description]                    [price]
    [description]                    [price]
  ─────────────
  Items Subtotal                     [amount]
  Advance Paid (from receipt)        [amount]
  Balance Due                        [amount]
  Total                              [amount]
  Payment Status                     [paid/pending — toggle-able by staff]

[for online_consultation type — this section instead just shows:]
  Amount                             [flat amount]

─────────────────────────────

[ Edit Invoice ]    ← opens edit form; saves update the same record (see 3.5)
[ Generate PDF ]    ← regenerates if stale due to an edit, otherwise generates once
[ Send via WhatsApp ]  ← disabled until a current (non-stale) PDF exists
```

### 5.4 Editing Behavior

Editing an invoice opens a form pre-filled with current values (same field set as the data model in Section 3.3). On save:
- The existing invoice record is updated in place (same `invoice_id`, same document) — never a new record.
- `last_edited_by` and `last_edited_at` are updated.
- If a `pdf_url` already existed, it is invalidated per the recommendation in Section 3.5.
- Any place this invoice is displayed (list row, detail panel, future customer-facing views) reflects the new values immediately — no caching/staleness beyond normal data-fetching behavior.

---

## 6. Receipt List Page (`/dashboard/receipts`)

Mirrors the Invoice list page structure (Section 5) at a smaller scope:

| Column | Source |
|---|---|
| Receipt ID | `receipt.receipt_id` |
| Customer Name | `receipt.customer_name` |
| Amount Paid | `receipt.amount_paid` |
| Scheduled Date | `receipt.scheduled_date` |
| Date Issued | `receipt.created_at` |

Detail panel shows all fields from the Receipt model (Section 3.2), with the same PDF generation + WhatsApp send buttons as invoices.

---

## 7. Open Decisions — Confirm Before/During Build

1. **One record with a status field vs two fully separate records** — this is the central unresolved decision raised during discussion: should Receipt and Invoice be modeled as one document that transitions through a status (e.g. `draft`/`booked` → `finalized`), or as two genuinely separate collections/documents as specified above? This spec is written assuming **two separate documents** (Option B) since that's more conventional and was the working direction, but the founder has not given a final explicit answer. **Agent must not silently pick one — confirm before implementation**, defaulting to two-separate-documents if forced to proceed without an answer (see Section 0, instruction 6).
2. **Inline customer creation** — if an executive is confirming a booking for a brand-new customer who doesn't exist yet, should there be an inline "+ Create New Customer" option right there, or should customer creation always happen as a separate prior step?
3. **Package dropdown source** — see Section 4.2.
4. **PDF hosting** — Cloudflare R2 was the intended host discussed earlier in the broader plan; confirm this is still the target for this slice before building PDF generation + storage.
5. **Payment status toggle** — who can change `payment_status` from pending to paid, and is an audit trail (who, when) needed? Not required for MVP but worth a one-line decision.
6. **Therapist field — free text or linked to existing roster?** Spec assumes "select from roster" since a roster already exists per the gap analysis — confirm this is intended rather than free text.
7. **Receipt trigger hook** — see Section 3.2, agent to confirm the exact existing flow point this attaches to.
8. **Invoice trigger hook** — see Section 3.3, agent to confirm the "Completed" step in the existing work checklist is the correct and sufficiently reliable trigger.
9. **Manual invoice creation fallback** — see Section 5.2 note — is a manual creation path still needed for edge cases the auto-trigger won't cover (e.g. a session that happened before this system existed, or an off-system booking)?

---

## 8. Explicitly Out of Scope for This Slice

Do not build any of the following under this task, even if related/partial code already exists in the repo:

- Vitals subscriptions (plans, pricing, renewal, reminders) — `invoice_type` schema includes `vitals_subscription` as a reserved enum value only, not implemented or shown in any UI
- Payment gateway integration (Razorpay or otherwise) — `payment_status` and `amount_paid` are manually entered, no gateway logic
- Full package purchase + session-deduction tracking (`CustomerPackage` model with `sessions_used`/`sessions_remaining`, validity windows, lapse logic) — Standard package session numbers are manually typed, not system-tracked, in this slice
- WhatsApp consent flow for add-ons (the YES/NO recommendation flow with structured `addon_recommendation` audit records) — add-ons in this slice are just manually-added line items on the invoice, no in-app recommend/consent workflow
- Automated WhatsApp delivery — the WhatsApp send button only opens a pre-filled `wa.me` link for staff to manually tap send; no webhook, no auto-send, no delivery confirmation tracking
- Structured clinical session notes (`session_record` model) — not part of this slice
- GST/tax line items on invoices — flat subtotal = total for now
- Refund/cancellation logic
- Therapist payout/commission tracking

---

## 9. Invoice Type Enum (for reference, unchanged from earlier discussion)

```
invoice_type enum:
  - package_purchase          [ACTIVE]
  - therapy_session            [ACTIVE]
  - therapy_addon_standalone   [ACTIVE]
  - online_consultation        [ACTIVE]
  - vitals_subscription        [RESERVED — schema only, not implemented or shown in UI]
```

---

*End of spec. Agent: complete Section 0 (conflict check) and resolve/confirm Section 7 item 1 before writing implementation code.*