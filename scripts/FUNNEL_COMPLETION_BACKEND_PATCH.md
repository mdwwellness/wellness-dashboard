# Funnel Completion Backend Patch — Payment + Completion

Adds payment + completion tracking to the enquiry funnel so the new drawer
sections persist. The `status` value (`ongoing`/`completed`) already persists via
the existing enum; only the **payment fields are session-only** until the model
accepts them (Mongoose silently drops unknown fields).

## Add fields to the Appointment model

```ts
// models/appointmentsBookingModel.ts — inside the schema
paymentReceived:   { type: Boolean, default: false },
paymentAmount:     { type: Number },
paymentMethod:     { type: String, enum: ["cash","upi","card","bank","other"] },
paymentReceivedAt: { type: String },   // ISO timestamp
completedAt:       { type: String },   // ISO timestamp
```

The existing `status` enum already includes `ongoing` and `completed`, so no enum
change is needed. The update endpoint (`findByIdAndUpdate(id, body)`) will persist
these automatically once the fields exist.

## Behaviour the frontend already implements

- Recording payment sets `paymentReceived`, `paymentAmount`, `paymentMethod`,
  `paymentReceivedAt`, and flips `status → "ongoing"`.
- "Mark completed" (blocked until paid) sets `status → "completed"` + `completedAt`.
- Both append an entry to `activityLog` (see ENQUIRY_BACKEND_PATCH.md for that
  field) — e.g. `Payment received ₹2500 (upi)`, `Marked completed`.

## Deploy

Push to main → Render auto-deploys. Payment details then persist across refresh;
until then the derived stage still works from `status` for ongoing/completed.
