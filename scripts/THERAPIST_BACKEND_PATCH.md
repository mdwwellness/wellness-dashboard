# Therapist Backend Patch — Profile Pic + Certificates

Apply this to the **WellnessBackend** repo so the new therapist fields aren't silently dropped by Mongoose's `strict: true`.

## 1) Mongoose model

In whatever file defines the therapist schema (likely `models/therapistModel.ts` or `models/doctorModel.ts`), add these two fields:

```ts
const certificateSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const therapistSchema = new mongoose.Schema({
  // ... existing fields ...

  profileImage: { type: String, default: "" },
  certificates: { type: [certificateSchema], default: [] },
});
```

That's it. No migration needed — existing therapist documents will read these as `""` / `[]` respectively.

## 2) Validator (if any)

If there's a Joi/Zod validator gating `POST /api/therapist` and `PATCH /api/therapist/:id`, allow the new fields through:

```ts
profileImage: z.string().optional(),
certificates: z.array(
  z.object({ label: z.string().min(1), url: z.string().url() })
).optional(),
```

## 3) Deploy

Push to main → Render auto-deploys.

## 4) Frontend env var

Add `UPLOADTHING_TOKEN` (from https://uploadthing.com → API Keys → "V7 Token") to:
- Local `.env.local`
- Vercel project env vars (Production + Preview)

After token is in place, restart the dev server and try adding a therapist with a profile pic + cert.
