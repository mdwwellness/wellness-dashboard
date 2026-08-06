# MDW Wellness — Conflict Resolution Decisions

**Responds to:** `invoice-mvp-conflicts.md` (Phase 1 conflict analysis from the coding agent)
**Purpose:** This is the founder/product decision on each blocker the agent raised. Read this alongside `invoice-mvp-conflicts.md` and the original spec (`mdw-invoice-mvp-spec.md`). Where this document contradicts the original spec, **this document wins** — update the spec accordingly before implementation.

---

## Decision 1 — Conflict #8: Receipt vs Invoice (one record or two)

**Decision: Drop the Receipt model entirely.** There is only **one** real document in this system: the **Invoice**, generated at session completion.

### What this changes

- No `Receipt` collection, no `RCT-YYYY-0001` ID format, no `/dashboard/receipts` page, no `related_receipt_id` field on Invoice.
- The advance-payment problem (customer needs proof of payment at booking time, before the visit happens) is solved differently — not with a formal document, but with a **plain WhatsApp text message**, sent at the moment payment is recorded at booking.

### The two-moment flow, restated without Receipt

| Moment | What happens | Is it an invoice? |
|---|---|---|
| Booking confirmed + advance payment recorded | A plain templated WhatsApp text confirming payment + booking details is sent (manually triggered, no PDF, no document, no database model) | **No.** Just a message. |
| Session marked complete | The real **Invoice** is generated — line items, PDF, total, advance paid, balance due | **Yes — this is the only invoice in the system.** |

### Example of the booking-confirmation WhatsApp text (template-based, not a generated document)

> "Hi [Customer Name], we've received your advance payment of ₹[amount] for [package/session name]. Your session is confirmed for [date] with [therapist name]. Thank you!"

This can be a manually-triggered "Send Payment Confirmation" button next to the existing `paymentReceived` toggle in the enquiry drawer — it just opens a pre-filled `wa.me` link with this text. No backend model, no PDF, no new collection required for this part.

### What stays the same from the original spec

- The **Invoice** model still includes `advance_paid` and `balance_due` fields (this part of the original design was correct).
- These fields are now populated **directly from the appointment's existing `paymentAmount` / `paymentReceived` fields** at the moment the invoice is generated — not from a separate Receipt document, since one no longer exists.

### Resulting simplification to other conflicts

- **Conflict #5** (Receipt trigger UX) is no longer needed as originally scoped. The agent's proposed "Confirm Booking & Issue Receipt" combined action is **not required**. The existing `paymentReceived` toggle in the enquiry drawer can directly trigger the WhatsApp text-template send — no new document-creation logic, no new required UI flow beyond adding that send button/action.
- **Conflict #14** (missing `appointment_id` on Receipt/Invoice) — the Receipt half of this is now moot. **Invoice still needs `appointment_id`** — this part of the conflict still applies and should still be fixed (see Decision 3 below).
- **Conflict #15** (duplicate payment state across appointment/receipt/invoice) — simplified, since there's no Receipt now. Appointment remains the operational source of truth for `paymentReceived`/`paymentAmount`; Invoice reads from it directly at generation time. No separate payment state to keep in sync.

---

## Decision 2 — Conflict #13: PDF hosting (R2 vs UploadThing)

**Decision: Use Cloudflare R2 for invoice PDFs. Do NOT touch, remove, or migrate the existing UploadThing integration.**

### What this means concretely

- UploadThing stays exactly as-is for whatever it's currently used for (therapist profile pictures, certificates, per the agent's findings). Do not refactor or consolidate this.
- A **new, separate** R2 setup is added specifically for invoice PDF generation and storage. These are two independent storage paths serving two different purposes — this is intentional, not a temporary state to be unified later.
- Agent should request/confirm R2 credentials (bucket name, access keys, endpoint) before building the PDF generation + upload step, since this is new infrastructure not currently present in either repo.

---

## Decision 3 — Confirmed fix: add `appointment_id` to Invoice (from Conflict #14)

**Decision: Yes, add this.** This was a genuine gap in the original spec, not an open question.

- Add `appointment_id` (Mongo ObjectId reference) to the Invoice model.
- Also add `enquiry_id` (the human-readable `ENQ-####` string) if convenient, per the agent's Option A — useful for traceability and support lookups, low cost to include.
- This field is also what makes **idempotent invoice generation possible** (see Decision 4) — without it, the system has no reliable way to check "does an invoice already exist for this specific appointment/session" before creating a new one.

---

## Decision 4 — Confirmed fix: server-side, idempotent invoice generation (from Conflict #6)

**Decision: Agreed with the agent's Option B.** Invoice generation logic must live in the **backend**, inside the appointment update handler (`PUT /api/appointments/:id`), not in either frontend UI separately.

### Why this matters

Two separate UI paths can currently mark a session "completed" — the executive's drawer toggle and the therapist's work checklist. If invoice generation were hooked into both frontend flows independently, the same session could generate two invoices. The fix:

- When an appointment update results in `status` becoming `completed`, the backend checks: **does an invoice already exist for this `appointment_id`?**
- If no invoice exists, generate one.
- If one already exists, do nothing (no duplicate, no error needed — just a no-op).
- This works correctly regardless of which UI (executive drawer or therapist checklist) triggered the completion, since the check happens once, server-side, at the single point where both paths converge (the appointment update endpoint).

---

## Summary of Net Changes to the Original Spec

| Item | Original spec said | Now |
|---|---|---|
| Receipt model | Separate collection, `RCT-YYYY-0001`, own list page | **Removed entirely** |
| Proof of advance payment | Formal Receipt document with PDF | **Plain WhatsApp text message, template-based, no document/model** |
| `/dashboard/receipts` page | Build it | **Do not build** |
| Invoice `related_receipt_id` field | Included | **Removed** (nothing to relate to) |
| Invoice `advance_paid` / `balance_due` | Pulled from linked Receipt | **Pulled directly from appointment's existing payment fields** |
| Invoice `appointment_id` | Missing from original spec | **Added — required field** |
| Invoice `enquiry_id` | Not specified | **Added — optional but recommended** |
| Invoice generation trigger | Auto, on session completion | **Unchanged** — still auto, on session completion, but now explicitly **server-side and idempotent**, guarded by `appointment_id` lookup |
| PDF hosting | R2 (tentative) | **Confirmed: R2**, built alongside (not replacing) existing UploadThing usage |
| Receipt trigger UX (new combined "Confirm Booking & Issue Receipt" button) | Proposed by agent | **Not needed** — existing `paymentReceived` toggle is enough; just add a "Send Payment Confirmation" WhatsApp action next to it |

---

## Still Open — Unaffected by These Decisions

These remain open from the original conflict analysis and still need answers before/during implementation:

- Inline customer creation UX during booking (Conflict #2 from spec Section 7)
- Package dropdown source — reuse `Service` (`isPackage: true`, filtered to `packageUnit: "sessions"`) vs new `package_catalogue` collection (Conflict #10/#11) — agent's recommendation (reuse `Service`, filtered) is reasonable, confirm before building
- Payment status toggle audit trail — who can mark paid, is `last_edited_by` sufficient (Conflict from spec Section 7 item 5)
- Therapist field — confirmed should be select-from-roster, not free text (no disagreement here, just confirming)
- Manual invoice creation fallback for edge cases (off-system sessions, pre-system data) — still an open call, agent's "admin-only manual create" suggestion (Conflict #18) is reasonable if needed later, not required for initial build
- UI pattern for invoice list — agent correctly found no existing "Orders" split-pane pattern in the codebase; recommended reusing the existing drawer pattern (Customers/Enquiries style) instead of building a new split-pane layout (Conflict #9) — agreed, use the existing drawer pattern for consistency

---

*End of resolution document. Agent: update `mdw-invoice-mvp-spec.md` to reflect Decisions 1-4 above before resuming implementation.*