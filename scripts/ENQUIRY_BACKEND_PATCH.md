# Enquiry / Appointment Backend Patch — Activity Log, Status Note, Concurrency

These make three enquiry-drawer features fully persistent. The frontend already
sends the fields; Mongoose **silently drops unknown fields**, so until the model
accepts them, they are session-only (the UI falls back to a derived timeline).

## 1) Add fields to the Appointment model

```ts
// models/appointmentsBookingModel.ts
const activityEntrySchema = new mongoose.Schema(
  {
    at: { type: String, required: true },   // ISO timestamp
    userId: { type: String },
    name: { type: String, required: true },
    action: { type: String, required: true }, // e.g. "Status → Cancelled: duplicate"
  },
  { _id: false }
);

// inside the appointment schema:
activityLog: { type: [activityEntrySchema], default: [] },
statusNote:  { type: String, default: "" },
```

The update endpoint already does `findByIdAndUpdate(id, body)`; once these fields
exist they'll persist automatically. No endpoint change needed for basic save.

## 2) Recommended: server-side append (don't trust the client array)

The frontend currently sends the **whole** `activityLog` array each save. Safer
is to let the client send only the *new* entry and have the server `$push`:

```ts
// PATCH /api/appointments/:id
const { newActivity, ...rest } = req.body;
const update = { ...rest };
if (newActivity) update.$push = { activityLog: newActivity };
await Appointment.findByIdAndUpdate(id, update, { new: true });
```

If you do this, tell me and I'll switch the drawer to send `newActivity`
instead of the full array. (Until then, full-array send works but can race.)

## 3) Strongly recommended: optimistic-concurrency guard 🔴

Today two people editing the same lead = silent last-write-wins clobber. Add a
version check so the 2nd writer is rejected instead of overwriting:

```ts
// Mongoose already maintains __v. Use updatedAt or __v as the guard:
const { expectedUpdatedAt, ...rest } = req.body;
const doc = await Appointment.findById(id);
if (expectedUpdatedAt && doc.updatedAt.toISOString() !== expectedUpdatedAt) {
  return res.status(409).json({ success: false, message: "This lead was changed by someone else. Reload and retry." });
}
Object.assign(doc, rest);
await doc.save();
```

Frontend change (when ready): send `expectedUpdatedAt` and, on a 409, toast
"changed by someone else" + refetch. Ask me to wire this when the endpoint is up.

## 4) Deploy

Push to main → Render auto-deploys. The activity log + status note start
persisting immediately; the derived timeline stays as a fallback for old records.
