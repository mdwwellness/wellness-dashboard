# Services Backend Patch — Service Catalog

Add a `Service` collection + CRUD endpoints to **WellnessBackend** so the
frontend Services page can persist real data. Until this is done, the frontend
runs on an in-session mock store (`src/data/service/service.ts`) and nothing is
saved across refreshes.

The auto service ID (`SRV-0001`, `SRV-0002`, …) uses the **same atomic-counter
pattern** as enquiry IDs (`ENQ-####`), so reuse that approach.

## 1) Mongoose model — `models/serviceModel.ts`

```ts
import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    serviceId: { type: String, unique: true, index: true }, // "SRV-0001"
    name: { type: String, required: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    hsnCode: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Service ||
  mongoose.model("Service", serviceSchema);
```

## 2) Atomic counter for serviceId

Reuse the existing counter collection used for enquiries. If it's a generic
`counters` collection keyed by name:

```ts
async function nextServiceId() {
  const c = await Counter.findOneAndUpdate(
    { _id: "service" },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return `SRV-${String(c.seq).padStart(4, "0")}`;
}
```

## 3) Routes — `routes/serviceRoutes.ts`

```
GET    /api/services          → list all
POST   /api/services          → create (assign serviceId via nextServiceId())
PATCH  /api/services/:serviceId  → update fields
DELETE /api/services/:serviceId  → remove
```

Gate POST/PATCH/DELETE behind the same auth/role middleware the therapist
routes use. GET can match whatever the therapist list uses.

## 4) Validator (if you use one)

```ts
{
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().min(0),
  category: z.string().min(1),
  hsnCode: z.string().regex(/^\d{4,8}$/),
}
```

## 5) Deploy → then swap the frontend data layer

Push to main → Render auto-deploys. Then in the frontend, replace the four hook
bodies in `src/data/service/service.ts` with real server actions hitting the
endpoints above (mirror `src/data/therapist/therapist.ts`). The hook names and
the `["services"]` query key already match, so the page components won't change.

> Note: `category` values must match the list in
> `src/lib/constant.ts → SERVICE_CATEGORIES`. Replace that placeholder list with
> the real categories before going live.
