# Customer identity fix — scoped plan

**Date:** 2026-07-28
**Status:** 🟠 Scoped, awaiting go-ahead. The *safe* half is already done (see below); this plan covers the schema-touching half that needs a live-DB migration.

---

## The problem in one line
The system treats a **phone number as a person's identity** (`Customer.phone` is `unique`). Real life doesn't: households share one number. So a second person on an existing number can't get their own customer record, and their booking mis-attributes to whoever was recorded first.

## What's already fixed (today — no schema change)
- **Repeat-folding now matches phone + name**, not phone alone (`WellnessBackend/lib/bookingService.ts`). A different name on the same number now creates its **own** enquiry instead of being folded into — and hidden behind — someone else's lead. This closes the "enquiry doesn't show up" bug.
- (Same session, unrelated) The enquiry drawer now **auto-prices the fee** from the catalogue on load instead of waiting at ₹0.

## Confirmed safe *today*: the public form cannot overwrite a customer
Every customer write path was traced. The public form only reaches `ensureCustomerForAppointment`, which **find-or-returns** by phone (never updates name/email). The only overwrite path is `updateCustomer` — authenticated staff, keyed by `customer_id`, unreachable from the public site. This must **stay** true after the fix.

---

## Blast radius — every file this fix touches

| File · line | Today | Change |
|---|---|---|
| `WellnessBackend/models/customerModel.ts:20` | `phone: { unique: true, index: true }` | drop `unique`; keep a **non-unique** index |
| `WellnessBackend/lib/invoiceGeneration.ts:55` | `ensureCustomerForAppointment` → `findOne({ phone })` | find-or-create by **phone + normalized name** |
| `WellnessBackend/controllers/customerController.ts:70` | `createCustomer` dup-check → `findOne({ phone })` | dup-check by **phone + name**; reword the "duplicate" message |
| `WellnessBackend/controllers/customerController.ts:35` | `getCustomers` phone search `{ phone }` | *no code change* — but a phone search now returns **multiple** rows (intended); confirm the UI renders a list |
| `WellnessFrontend/.../enquiries/enquiry-intake-modal.tsx:203` | "Returning customer: **{matchedCustomer.name}**" (assumes exactly one) | handle 0 / 1 / **many** matches on a number; when >1, show the names to disambiguate |
| `WellnessFrontend/.../invoices/customer-search-field.tsx` | phone search picker | ensure it lists **all** people on a number and the exec picks the right one |

**Unchanged / safe** (looked up by `customer_id`, not phone): `customerController.ts:108,123`, `invoiceGeneration.ts:693`.

---

## Migration — the one sensitive step (live DB)
Mongoose does **not** drop an existing unique index just because you removed `unique: true` from the schema. The `phone_1` unique index will **persist** on the live `customers` collection and keep rejecting shared phones. So:

1. Deploy the schema/code change first.
2. On Atlas, confirm the exact index name (`db.customers.getIndexes()`), then `db.customers.dropIndex("phone_1")`, and let the app recreate a **non-unique** index (or create it explicitly).

**Safety rails:**
- Today phone *is* unique, so there are **zero existing collisions** — dropping the index is non-destructive.
- **Assert the connection host before running anything** (the prod-DB near-miss lesson) — confirm you're on the intended database, not production-by-accident.
- Do it in a quiet window with a recent snapshot. Reversible (recreate the index) only until the first shared-phone customer is inserted.
- **No data backfill for MVP:** existing bookings keep their current customer link; only new different-name bookings create new customers. (Optional later: re-derive historical customers per name.)

---

## Steps, in order
1. `customerModel.ts` — drop `unique` (keep index).
2. `ensureCustomerForAppointment` — find-or-create by phone + normalized name.
3. `createCustomer` — dup-check by phone + name; reword response.
4. Backend typecheck + local test: two names / one phone → two customers; same name+phone → reuses one.
5. Frontend — returning-customer hint handles many-per-phone; invoice search handles a list.
6. Deploy backend → run the guarded `dropIndex` migration on Atlas.
7. Verify live: two names on one number → two enquiries + two correctly-named customers; a true same-person repeat still folds.

## Out of scope (YAGNI)
- **Phone OTP verification** on the public form — the real anti-poisoning fix; later.
- A **merge tool** for soft-duplicates (same person, two spellings) — later; the "this number already exists as ⟨name⟩" hint is enough for now.
- Retroactively re-splitting historical shared-phone bookings.

## Acceptance
- A second person on an existing number gets their **own** customer + enquiry, correctly named on the Customers page.
- No public submission ever alters an existing customer's name/email (already true; stays true).
- A genuine same-person repeat still folds — no duplicate.
- No duplicate-key errors on shared phones after the index drop.
