# MDW Wellness — Payment Hub Architecture Options

**Document purpose:** Help the client choose how payments, invoices, coupons, and walk-in bookings should work in the admin dashboard.

**Date:** June 2026  
**Status:** Proposal — not yet built

---

## Context — how it works today

| Area | Current behaviour |
|------|-------------------|
| Payment recording | Hidden inside the **Enquiry detail drawer** (section 4: amount, method, “Payment received” toggle) |
| Therapist view | Simple **“Payment collected”** checkbox in the appointment work checklist — no amount entry |
| Walk-in booking | Staff use **Book Slot**, **New Enquiry**, or **Customer drawer → Book new session** separately |
| Invoices | **Not built** |
| Coupons | **Not built** |
| Dedicated payment page | **Does not exist** |

**Important:** This is **not** an online payment gateway (Razorpay, Stripe, etc.). Staff manually record cash, UPI, card, or bank payments at the clinic.

---

## Requirements agreed

1. **Both payment paths**
   - **Prepaid walk-in** — customer pays first, then staff books the slot
   - **Post-assignment** — lead goes through the enquiry funnel until therapist is assigned, then payment is collected

2. **Full cash desk hub** — one area of the dashboard that handles:
   - Recording payments
   - Generating invoices
   - Applying discounts and coupon codes
   - Manual booking for walk-in customers

3. **Backend** — new API models needed in `WellnessBackend` (Invoice, Coupon, payment/invoice endpoints). The appointment record already has `paymentAmount`, `paymentMethod`, and `paymentReceived` fields.

---

## Quick comparison

| | Option A — Cash Desk | Option B — Hub + Wizard | Option C — Invoice-first |
|---|---|---|---|
| **Main routes** | 1 page | 2 pages (hub + wizard) | 1 page + invoice detail |
| **Walk-in speed** | Fastest | Medium | Medium |
| **Mobile / tablet** | Weaker | Strongest | Medium |
| **GST / audit trail** | Good | Good | Best |
| **Backend effort** | Medium | Medium | Highest |
| **Staff learning curve** | Low | Low | Medium |
| **Discount / coupon fit** | Good | Good | Best |
| **Best for** | Desktop front desk, all-day use | Phased rollout, mixed devices | Accounting-heavy clinics |

---

## Option A — Single Cash Desk page

### Summary

Add one sidebar item: **Payments** (or **Cash Desk**) at `/dashboard/payments`.

The page uses a **split layout**:
- **Left:** queues (unpaid assigned leads, prepaid walk-ins waiting for a slot, paid today, draft invoices)
- **Right:** active transaction panel (customer, services, discount/coupon, payment, optional booking, issue invoice)

Enquiry and appointment drawers link here with `?appointmentId=` so post-assignment payments open pre-filled.

### Walk-in flow (pay first, then book)

```mermaid
graph TD
    A["Staff opens Payments page"] --> B["Click New walk-in"]
    B --> C["Step 1: Customer phone and name"]
    C --> D{"Existing customer?"}
    D -->|"Yes"| E["Load past bookings"]
    D -->|"No"| F["Create new customer record"]
    E --> G["Step 2: Pick services from catalogue"]
    F --> G
    G --> H["Step 3: Apply discount or coupon"]
    H --> I["Step 4: Record payment amount and method"]
    I --> J["POST payment and create invoice"]
    J --> K["Step 5: Book slot manually"]
    K --> L["POST appointment linked to invoice"]
    L --> M["Print or share invoice"]
    M --> N["Lead appears in Enquiries and Appointments"]
```

### Post-assignment flow (from enquiry funnel)

```mermaid
graph TD
    A["Enquiry reaches Assigned stage"] --> B["Record payment button in drawer"]
    B --> C["Opens Payments page with appointment prefilled"]
    C --> D["Amount auto-filled from service or quoted price"]
    D --> E["Staff adjusts discount or coupon"]
    E --> F["Confirm payment method"]
    F --> G["POST payment and invoice"]
    G --> H["PATCH appointment paymentReceived true"]
    H --> I["Status becomes Ongoing"]
    I --> J["Activity log updated"]
    J --> K["Return to enquiry drawer or stay on Payments"]
```

### Page layout

```mermaid
graph TD
    subgraph left ["Left panel queues"]
        Q1["Unpaid assigned leads"]
        Q2["Prepaid walk-ins pending slot"]
        Q3["Paid today"]
        Q4["Invoices draft or issued"]
    end
    subgraph right ["Right panel transaction"]
        T1["Customer and services"]
        T2["Discount and coupon"]
        T3["Payment method"]
        T4["Book slot optional"]
        T5["Issue invoice"]
    end
    left -->|"Select row"| right
```

### Pros

- **Fastest for daily front-desk use** — one screen open all day, no page changes between customers
- **Queue-driven** — staff always see who needs payment or a slot at a glance
- **Minimal navigation** — walk-in and post-assignment both happen in the same place
- **Lower training burden** — “everything money-related lives on Payments”
- **Medium backend complexity** — payment + invoice + appointment link, but not as rigid as a full ledger

### Cons

- **Crowded on small screens** — split layout is hard on phones and small tablets
- **Harder to build as phased releases** — the whole page needs to feel complete before launch
- **Weaker separation of concerns** — payment, booking, and invoicing are tightly coupled in one UI
- **Audit trail is good but not best** — payment and invoice are created together, less flexible for “invoice first, pay later” edge cases

### Best suited when

- Clinic has a **fixed reception desk** with a desktop or large tablet
- Staff handle **high walk-in volume** and need speed over structure
- Client wants **one obvious place** for all cash handling

---

## Option B — Hub list + dedicated Record wizard

### Summary

Two routes:
- **`/dashboard/payments`** — hub with KPIs, tabs (Unpaid queue, Paid today, All invoices, Coupons), and CTAs
- **`/dashboard/payments/record`** — full-screen **multi-step wizard** for each transaction

Enquiry drawer **“Collect payment”** and Customer drawer **“New walk-in”** deep-link into the wizard with context pre-filled (skips early steps when possible).

### Walk-in wizard

```mermaid
graph TD
    A["Payments hub page"] --> B["Record payment button"]
    B --> C["Wizard step 1 Customer"]
    C --> D["Wizard step 2 Services"]
    D --> E["Wizard step 3 Pricing"]
    E --> F["Apply recommended price"]
    E --> G["Manual discount"]
    E --> H["Validate coupon code"]
    F --> I["Wizard step 4 Payment"]
    G --> I
    H --> I
    I --> J["Wizard step 5 Book slot"]
    J --> K["Wizard step 6 Review and issue invoice"]
    K --> L["POST payment invoice appointment"]
    L --> M["Redirect to Payments hub with success toast"]
```

### Post-assignment shortcut

```mermaid
graph TD
    A["Enquiry drawer at Assigned"] --> B["Collect payment button"]
    B --> C["Navigate to payments record wizard"]
    C --> D["Skip to step 3 with appointment locked"]
    D --> E["Pricing prefilled from quotedPrice"]
    E --> F["Step 4 Payment"]
    F --> G["No booking step needed"]
    G --> H["Issue invoice"]
    H --> I["PATCH appointment to Ongoing"]
    I --> J["Back to Enquiries list"]
```

### Hub page structure

```mermaid
graph TD
    H["Payments hub"] --> K["KPI cards: collected today, pending, invoices"]
    H --> T1["Tab: Unpaid queue"]
    H --> T2["Tab: Paid today"]
    H --> T3["Tab: All invoices"]
    H --> T4["Tab: Coupons admin"]
    H --> B["Record payment CTA"]
    H --> W["New walk-in CTA"]
    T1 -->|"Row click"| R["Open record wizard prefilled"]
```

### Pros

- **Clearest user journey** — one step at a time, hard to skip required fields
- **Best for mobile and tablet** — wizard is full-screen, touch-friendly
- **Easiest phased rollout** — ship hub + steps 1–4 first, add booking and coupons later
- **Clean URLs** — shareable links (`/payments/record?appointmentId=…`) for support and training
- **Matches existing app patterns** — similar to enquiry intake modal and multi-section drawers
- **Medium backend complexity** — same APIs as Option A, simpler frontend state per step

### Cons

- **Extra click to start** — not as fast as Option A for repeat walk-ins
- **More navigation** — staff move between hub and wizard
- **Wizard fatigue** — 6 steps may feel long for simple “quick pay” cases unless we add shortcuts
- **Two routes to maintain** — slightly more frontend code than a single page

### Best suited when

- Staff use **mixed devices** (phone, tablet, desktop)
- Client wants to **ship in phases** (payments first, coupons and booking next)
- **Training and clarity** matter more than absolute speed
- **Recommended default** for most clinics balancing speed and maintainability

---

## Option C — Invoice-first ledger

### Summary

The **Invoice** is the primary record. Payment means marking an invoice **paid**.

- Walk-in: create **draft invoice** → add line items → apply discount/coupon → issue → record payment → optionally book slot linked to `invoiceId`
- Post-assignment: enquiry at Assigned → **“Generate invoice”** → draft pre-filled from service/HSN/`quotedPrice` → pay on Payments page → appointment syncs to Ongoing

### Walk-in flow (invoice-first)

```mermaid
graph TD
    A["Payments page New invoice"] --> B["Create draft invoice INV number"]
    B --> C["Add customer phone and name"]
    C --> D["Add line items from service catalogue"]
    D --> E["Apply discounts and coupon on invoice"]
    E --> F["Issue invoice"]
    F --> G["Record payment against invoice"]
    G --> H{"Book slot now?"}
    H -->|"Yes"| I["Create appointment linked to invoiceId"]
    H -->|"No"| J["Invoice paid slot booked later"]
    I --> K["Invoice Paid and appointment Scheduled"]
    J --> L["Invoice Paid booking pending"]
```

### Post-assignment flow (invoice from enquiry)

```mermaid
graph TD
    A["Enquiry at Assigned"] --> B["Generate invoice from enquiry"]
    B --> C["Draft invoice with service HSN and quoted price"]
    C --> D["Opens Payments page invoice detail"]
    D --> E["Staff adds coupon or manual discount"]
    E --> F["Mark invoice paid with method"]
    F --> G["Sync update on appointment"]
    G --> H["paymentReceived true status Ongoing"]
    H --> I["Invoice snapshot locked for reprint"]
```

### Data model flow

```mermaid
graph TD
    INV["Invoice draft"] --> ISS["Invoice issued"]
    ISS --> PAY["Invoice paid"]
    PAY --> APT["Appointment updated"]
    COUP["Coupon validate API"] --> INV
    SVC["Service catalogue price HSN"] --> INV
    APT --> ENQ["Enquiry funnel status sync"]
    PAY --> LOG["Activity log entry"]
```

### Pros

- **Strongest audit trail** — every rupee tied to an invoice number (`INV-0001`, etc.)
- **Best for GST / HSN / SAC compliance** — line items, tax, and totals frozen on issue
- **Discount and coupon logic lives in one place** — on invoice lines, not scattered across drawers
- **Reprint and disputes are easy** — invoice is an immutable snapshot after issue
- **Supports “invoice now, pay later”** — draft → issued → paid can be separate steps
- **Natural fit for accountant exports** — invoice list is the books

### Cons

- **Highest backend effort** — Invoice model, states, line items, coupon engine, appointment sync
- **Staff must learn invoice-first thinking** — “create invoice” before “take money”
- **Slower for simple walk-ins** — more steps than Option A for a quick cash payment
- **Enquiry drawer changes** — payment section may be replaced or reduced to “Generate invoice → go to Payments”
- **Longer time to first release**

### Best suited when

- Client needs **proper invoicing** for accounts, GST filings, or insurance
- **Coupon campaigns** and **manual discounts** are core to the business model
- **Audit and reprint** matter as much as booking speed
- Clinic is willing to invest more upfront for long-term financial clarity

---

## Shared backend (all options)

New endpoints in `WellnessBackend` (none exist today):

| Endpoint | Purpose |
|----------|---------|
| `POST api invoices` | Create invoice (draft or issued) |
| `GET api invoices` | List / filter by date, status, phone |
| `GET api invoices by id` | Detail for reprint |
| `PATCH api invoices by id` | Update status, mark paid, void |
| `POST api coupons validate` | Check code and return discount amount |
| `GET api coupons` | Admin list (Settings or Payments tab) |
| `POST api coupons` | Create coupon (admin) |

Option A and B may also use `POST api payments` as a thin wrapper; Option C folds payment into `PATCH invoice → paid`.

**Appointment sync (all options):** When payment is recorded, update the linked appointment:

- `paymentReceived: true`
- `paymentAmount`, `paymentMethod`, `paymentReceivedAt`
- `status: "ongoing"` (post-assignment path)
- New `activityLog` entry

---

## What changes in the existing dashboard (all options)

| Current | After payment hub |
|---------|-----------------|
| Payment section in Enquiry drawer | Stays as shortcut **or** replaced by “Open in Payments” link |
| Therapist “Payment collected” checkbox | Links to Payments with amount entry, or syncs from hub |
| Book Slot page | Still exists; walk-ins can also book from Payments hub |
| Customers page | “Generate invoice” per booking row |
| Sidebar | New **Payments** icon (admin/staff; therapists likely read-only or hidden) |

---

## Recommendation for client discussion

| Priority | Suggested option |
|----------|------------------|
| Speed at front desk, desktop only | **Option A** |
| Balanced — phased build, mobile-friendly, clear UX | **Option B** (recommended) |
| GST, invoices, coupons, audit trail first | **Option C** |

---

## Client decision

**Selected option:** _[ ] A — Cash Desk &nbsp;&nbsp; [ ] B — Hub + Wizard &nbsp;&nbsp; [ ] C — Invoice-first_

**Notes / constraints:**

```
(Client fills in here)
```

**Sign-off:**

| Role | Name | Date |
|------|------|------|
| Client | | |
| Product / Dev | | |

---

## Related documents

- [Dashboard flowcharts](./dashboard-flowchart.md) — full app flows (GitHub-safe Mermaid)
- [Operator checklist](../operator.md) — deploy and env steps
- Plan file: payment hub implementation todos in Cursor plan `repo_status_and_next_steps`
