# MDW Wellness — Invoice / Customer / Package MVP — Canonical Spec

**Canonical source:** This document merges:

- [`discussion.md`](./discussion.md) (latest spec text)
- [`02_resolution.md`](./02_resolution.md) (founder decisions)

Where there is any contradiction, **`02_resolution.md` wins**.

**Service line:** Therapy only  
**Out of scope:** Payment gateway, Vitals logic, WhatsApp automation (beyond manual `wa.me` links), full session-deduction tracking, clinical notes, GST/tax, refunds, therapist payouts

---

## 0. Instructions for implementation

1. Use this file as the **single source of truth** for the MVP slice.
2. Keep scope strictly to Therapy billing.
3. Before coding, keep `invoice-mvp-conflicts.md` aligned with this spec (resolved vs open).

---

## 1. Scope (what we build now)

### 1.1 Build now

- Permanent **Customer** model with sequential, lookup-friendly ID
- **Invoice** model
  - Auto-generated at session completion
  - Editable after generation (single source of truth; no “corrected copy”)
  - PDF generation on-demand (manual button)
  - WhatsApp send on-demand (manual `wa.me` link once PDF exists)
- Package handling at **invoice level only**
  - Standard packages from existing catalogue
  - Custom one-off package fields on invoice
  - No session deduction / validity enforcement in this slice
- Invoice list page: **`/dashboard/invoices`**
  - Use the existing dashboard pattern (table + drawer/detail panel pattern already used in Customers/Enquiries)

### 1.2 Explicitly NOT building in this slice

- Receipt model, receipt PDFs, `/dashboard/receipts` page
- Vitals subscriptions
- Razorpay or any payment gateway / webhooks
- Coupon engine / discounts / GST taxes
- WhatsApp consent flows, auto-send, delivery tracking
- Full package purchase tracking or automatic session-number calculation
- Refund/cancellation logic
- Therapist payout/commission tracking

---

## 2. Customer model

### 2.1 Requirement

One permanent customer record per real person, with a stable ID that can be searched and selected during ops workflows.

### 2.2 Fields (minimum)

```
customer
├── customer_id          (sequential, see 2.3)
├── name
├── phone                (primary lookup key alongside customer_id)
├── email                (optional)
├── address              (optional)
├── created_at
└── updated_at
```

### 2.3 ID format

Sequential, human-searchable, never resets:

- `CUST-0001`, `CUST-0002`, ...

### 2.4 Search-select behaviour

Anywhere a customer needs to be selected, use a **search-select** (type to search by name or customer_id). Selecting a customer auto-fills name/phone/address where relevant.

If the customer doesn’t exist, allow creation (UX decision remains open; see Section 7).

---

## 3. Advance payment proof (Receipt removed)

### Founder decision (from `02_resolution.md`)

There is **no Receipt model**. Proof of advance payment at booking time is handled by a **plain WhatsApp text message**, manually triggered.

### 3.1 Booking-time WhatsApp payment confirmation

Add a **“Send Payment Confirmation”** action near the existing booking/payment UI (next to the `paymentReceived` toggle in the enquiry drawer).

- It opens a `wa.me` link with pre-filled text.
- No PDF, no database document.

Template example:

> Hi [Customer Name], we’ve received your advance payment of ₹[amount] for [package/session name]. Your session is confirmed for [date] with [therapist name]. Thank you!

---

## 4. Invoice model

### 4.1 Invoice types

`invoice_type` enum:

- `package_purchase` **ACTIVE**
- `therapy_session` **ACTIVE**
- `therapy_addon_standalone` **ACTIVE**
- `online_consultation` **ACTIVE**
- `vitals_subscription` **RESERVED** (exists in schema only; **not** shown in UI; **not** implemented)

### 4.2 Invoice ID format

Yearly-reset sequential format:

- `INV-{YYYY}-{0001}` e.g. `INV-2026-0001`

Implementation requirement:

- Use the existing atomic counter pattern (Mongo `counters` collection)
- Counters must be **keyed by year** (e.g. `invoice-2026`) so each year starts at `0001`

### 4.3 Invoice trigger (auto-generation)

Invoice is auto-generated when a session/visit is marked **completed**.

Founder decision:

- Invoice generation must be **server-side** and **idempotent**, inside the appointment update handler (`PUT /api/appointments/:id`):
  - If appointment status becomes `completed`, backend checks whether an invoice already exists for that `appointment_id`
  - If none exists, create one
  - If one exists, do nothing

### 4.4 Invoice fields

```
invoice
├── invoice_id              (INV-YYYY-0001)
├── invoice_type            (enum)
├── appointment_id          (Mongo ObjectId FK)   <-- required
├── enquiry_id              (ENQ-####)            <-- optional but recommended
├── customer_id             (FK to customer)
├── customer_name           (denormalized snapshot at creation time)
├── customer_phone          (denormalized snapshot at creation time)
├── package_type            ("standard" | "custom" | null)
├── package_ref             (if standard: reference to Service/catalogue entry; if custom: null)
├── package_name            (denormalized)
├── session_number          (free text, e.g. "3 of 8"; manual; optional)
├── therapist_name          (or therapist_id)
├── line_items[]
│     ├── description
│     └── price
├── items_subtotal          (sum of line_items; or flat amount for online_consultation)
├── advance_paid            (from appointment payment fields at generation time)
├── balance_due             (total - advance_paid)
├── total                   (same as items_subtotal; no taxes/discounts in this slice)
├── payment_status          ("paid" | "pending")  <-- manual toggle
├── pdf_url                 (null until generated)
├── created_at
├── created_by              (system; record which event generated it)
├── last_edited_by
├── last_edited_at
└── updated_at
```

**Denormalized customer fields:** This is intentional. Historical invoices should not be rewritten if customer details change later.

### 4.5 PDF staleness after edits

If an invoice is edited after a PDF was generated, the PDF becomes stale.

Rule:

- On invoice edit, invalidate the PDF (`pdf_url = null` or a `pdf_stale=true` flag) and require regeneration before WhatsApp send.

---

## 5. Package handling (invoice-level only)

### 5.1 Two package types

| Type | Meaning | Tracking |
|------|---------|----------|
| Standard | Selected from existing admin-managed catalogue | No tracking; session number is manually typed |
| Custom | One-off package defined for this invoice | No tracking |

### 5.2 Standard package dropdown source (open decision)

Preferred MVP approach:

- Reuse existing `Service` catalogue entries where `isPackage: true`
- For Therapy-only MVP, filter to packages where `packageUnit: "sessions"` (exclude vitals-style weeks/months)

---

## 6. Invoice list page (`/dashboard/invoices`)

### 6.1 Layout

Use the existing dashboard UX pattern (table + detail drawer/panel) rather than introducing a brand new split-pane system.

### 6.2 List columns

- Invoice ID
- Customer name
- Type
- Amount
- Payment status
- Date (latest-first)

Filters:

- Search (customer name or invoice id)
- Type filter
- Payment status filter

### 6.3 Detail panel actions

Buttons:

- Edit invoice
- Generate PDF (enabled if no current PDF)
- Send via WhatsApp (disabled until a current PDF exists; opens `wa.me` link)

---

## 7. Remaining open decisions (still open)

1. Inline customer creation UX (inline vs separate Customers flow)
2. Package dropdown source confirmation (Service reuse with Therapy-only filter)
3. Payment status toggle permissions + audit expectations
4. Therapist field: select from roster vs free text (assume roster)
5. Manual invoice creation fallback (admin-only) for edge cases (optional)

---

*End of canonical spec. Receipt parts removed per `02_resolution.md`.* 
