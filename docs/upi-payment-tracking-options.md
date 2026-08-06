# UPI payment generation + reconciliation — options

**Status:** Open question / decision not yet made — captured for T34.
**Date:** 2026-07-20
**Asked by:** owner (dashboard session)
**Related:** [payment-hub-options.md](./payment-hub-options.md) · KANBAN **T34** (Razorpay auto-reconciliation, *Later*) · **T32** (verify payee VPA)

---

## The question (verbatim intent)

> Is there a way to **generate a UPI request with a specific amount** and **track whether that payment was received from that specific person**? What are the options — across three scenarios:
> 1. **No WhatsApp API** — message sent via a plain URL (wa.me link).
> 2. **WhatsApp Cloud API** is available.
> 3. **Razorpay gateway** is available.

## Why it's being asked now (context)

- The enquiry funnel is **pay-first**: payment must clear before a therapist is assigned. A home-visit customer therefore can't "pay at the clinic" first, so **remote collection is now mandatory**, not optional. (This is the assumption `payment-hub-options.md` predates.)
- **What's already built:** a dynamic UPI **deep link + QR** (`upi://pay?pa=…&am=1200&tr=ENQ-####`) on a public `/pay/<token>` page, delivered by a **wa.me URL** from the enquiry drawer's "Request payment" button. → This is **scenario 1**, fully shipped.
- **Reconciliation today is manual:** the executive eyeballs the bank UPI app / statement and ticks "Payment received." That was tolerable under pay-at-clinic; under pay-first it sits on the **critical path of every booking** — an unmatched credit blocks a therapist assignment.
- So the real ask is: **automate "did person X pay ₹Y?"**

---

## The governing distinction

Two **independent** axes — usually conflated:

| Axis | Controls | Source of auto-tracking? |
|---|---|---|
| **Payment rail** — raw UPI deep link vs. gateway (Razorpay) | whether a programmatic "it's paid" callback exists | **Yes — this is the tracking** |
| **Delivery channel** — wa.me URL vs. WhatsApp Cloud API | how the pay link reaches the customer | Mostly no |

The three scenarios are mostly about **delivery**. The thing actually wanted (track who paid) lives on the **payment** axis. **The WhatsApp choice barely moves tracking; the gateway does.**

**Generating a ₹-specific UPI is already solved** in all scenarios (the `am=` deep link/QR). The hard half is reconciliation, and the key fact is: **raw UPI gives NO programmatic paid-callback.** A payment to a normal VPA notifies *your* bank app, but there's no API to read it, and the `tr` reference is not reliably returned to you. A gateway is the only thing that turns a payment into a server event.

---

## Scenario comparison

| | Generate ₹-specific UPI | Auto-track "did X pay?" | How you actually know it's paid | New infra |
|---|---|---|---|---|
| **1. wa.me URL + raw UPI** *(current)* | ✅ deep link + QR | ❌ none | Exec checks bank app / statement, ticks paid by hand | none |
| **2. WhatsApp Cloud API + raw UPI** | ✅ same | ⚠️ partial | Customer's reply/screenshot arrives via inbound webhook — a *claim*, not verified money. Real tracking only via **WhatsApp Pay**, which runs on a PSP anyway | Meta Business verification, template approval, per-conversation cost |
| **3. Razorpay** *(any delivery)* | ✅ Payment Link / QR / Smart Collect | ✅ **real** | `payment.captured` webhook → carries your booking id → auto-mark paid | Razorpay account + KYC, one webhook endpoint, ~2% + GST/txn |

- **Scenario 1:** generation solved, reconciliation 100% manual. Where we are.
- **Scenario 2:** upgrade is *delivery + inbound* (proactive templates, delivery receipts, programmatically receiving the customer's "paid"/screenshot). Still a self-report, not bank-verified. WhatsApp Pay = real, but it's a PSP under the hood → quietly re-enters scenario 3 with extra Meta setup. (WhatsApp Pay India availability has moved around — **verify current state** before betting on it.)
- **Scenario 3:** the actual answer. Webhook fires when money lands, carries your reference, auto-marks paid, zero manual checking.

---

## Conclusion / recommended direction

Because the axes are orthogonal, **Razorpay composes with any delivery channel** — you do **not** need WhatsApp Cloud API to get tracking. Shortest complete path:

> **Razorpay Payment Links, delivered over the existing wa.me URL.**

Reconciliation from the gateway; delivery from the free channel already built. Cloud API becomes a *later, optional* delivery polish, never a prerequisite for tracking.

**Attributing to a specific person** (best first):
1. **Razorpay Smart Collect** — a unique virtual VPA per customer/booking; any rupee to it is auto-attributed. Cleanest.
2. **Payment Link `reference_id` / `notes`** — stamp the booking/customer id; it returns in the webhook. Simple, no per-customer VPA.
3. ~~Unique-amount hack (₹1200.01, ₹1200.02)~~ — rejected: fragile, doesn't scale, unprofessional.

**Bottom line:** generating the amount is done; tracking who paid is only real with a gateway. Razorpay Payment Links over the current wa.me link is the shortest path; WhatsApp Cloud API is a separate, optional delivery upgrade.

---

## If pursued — rough shape of the Razorpay task (T34)

- **Backend:** on "Request payment", create a Razorpay Payment Link (amount = quotedPrice, `reference_id`/`notes` = enquiryId/customer_id) instead of / alongside the raw UPI token; store the link + razorpay ids on the booking.
- **Webhook:** `POST /api/webhooks/razorpay` (public, signature-verified) → on `payment_link.paid` / `payment.captured`, look up the booking by reference, set `paymentReceived: true` + amount/method/time, log activity. This *replaces the manual tick*.
- **Delivery:** unchanged — the wa.me memo carries the Razorpay link instead of `/pay/<token>` (or both).
- **Cost/setup:** Razorpay account + KYC, ~2% + GST per txn, no setup fee. Payment Links need no customer-facing code (hosted checkout).
- **Supersedes:** the manual reconciliation in the current flow; makes **T32** (payee-VPA verification) moot for the gateway path.
