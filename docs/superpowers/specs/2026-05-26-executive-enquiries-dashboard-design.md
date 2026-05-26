# Executive Enquiries Dashboard — Design

**Date:** 2026-05-26
**Status:** Design approved by user, pending spec review
**Repo:** WellnessFrontend (Next.js 16 App Router)
**Sibling repo:** `C:\workspace\backend-mdw\` (backend; coordinated changes required)

## Problem

The business needs an executive-facing dashboard to track the inbound lead funnel so they can start operating. Current dashboard tracks confirmed appointments only; there is no view for "someone enquired but hasn't booked yet."

Each lead must surface six pieces of state:
1. Name
2. Phone number
3. Client's preferred reach-out timing
4. Whether an executive has reached out
5. Online consultation timing appointed
6. Online consultation done
7. Physiotherapist timing appointed
8. Assignment with physiotherapist confirmed (therapist is genuinely free at the slot)

## Goal

Ship an MVP at `/dashboard/enquiries` that lets an executive log new enquiries, see the whole pipeline in one table, and advance each lead through the funnel — with the smallest possible schema and code footprint that still models the funnel correctly.

## Approach

Extend the existing `Appointment` entity in place. Add `"enquiry"` to the `status` enum. Add funnel checkpoint fields (booleans + timestamps) plus two slot fields (`consultationSlot`, `physioSlot`) so one record carries a lead from first call through physio assignment. No new collection, no new endpoint, no data migration.

Backend changes are additive only — existing records remain valid.

## Data model

Replace `slotBookingZodSchema` in [src/type/schema.ts](../../../src/type/schema.ts) with `enquirySchema`. The new schema is a superset; legacy fields stay.

```ts
export const enquirySchema = z.object({
  _id: z.string().optional(),

  // Always required (the bare enquiry)
  name: z.string().min(2),
  phonenumber: z.number(),
  preferredReachOutTime: z.string().min(1),  // free text MVP
  status: z.enum(["enquiry", "scheduled", "ongoing", "completed", "cancelled"])
           .default("enquiry"),

  // Optional / collected as funnel progresses
  email: z.string().email().optional(),
  age: z.number().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
  typeOfappointment: z.enum(["consultation","appointment"]).optional(),

  // Checkpoint: executive reached out
  executiveReachedOut: z.boolean().default(false),
  executiveReachedOutAt: z.string().datetime().optional(),

  // Checkpoint: online consultation
  consultationSlot: z.object({ date: z.string(), time: z.string() }).optional(),
  consultationCompleted: z.boolean().default(false),
  consultationCompletedAt: z.string().datetime().optional(),

  // Checkpoint: physio assignment
  physioSlot: z.object({ date: z.string(), time: z.string() }).optional(),
  doctorId: z.string().optional(),     // physio therapist (reuses existing field)
  doctor: z.string().optional(),       // physio therapist display name (reuses existing)
  physioAssignmentConfirmed: z.boolean().default(false),
  physioAssignmentConfirmedAt: z.string().datetime().optional(),

  // Legacy back-compat — preserved untouched
  slot: z.object({ date: z.string(), time: z.string() }).optional(),
  therapyStartTime: z.string().optional(),
  therapyEndTime: z.string().optional(),
});

export type EnquiryType = z.infer<typeof enquirySchema>;
```

### Funnel-stage derivation (pure function)

```ts
type FunnelStage =
  | "enquiry" | "reached_out" | "consult_booked" | "consult_done"
  | "physio_booked" | "assigned" | "cancelled";

function deriveStage(r: EnquiryType): FunnelStage {
  if (r.status === "cancelled") return "cancelled";
  if (r.physioAssignmentConfirmed) return "assigned";
  if (r.physioSlot) return "physio_booked";
  if (r.consultationCompleted) return "consult_done";
  if (r.consultationSlot) return "consult_booked";
  if (r.executiveReachedOut) return "reached_out";
  return "enquiry";
}
```

Lives in `src/components/pages/enquiries/stage.ts` — pure function, easy to unit-test later.

### Notes

- `preferredReachOutTime` is free text for MVP; promote to structured `{from, to}` only if executives complain.
- One `doctorId` field — assumes the physio is also the only therapist relevant. If consultations are done by a separate consultant role, add `consultationTherapistId` later.
- Terminal funnel state `assigned` is distinct from `status: "completed"`. `completed` still means therapy is finished. The funnel cares about the lead converting; the appointment lifecycle cares about therapy delivery.

## Architecture

### Backend (sibling repo at `C:\workspace\backend-mdw\`)

- Extend Mongoose `appointments` schema with new fields above
- Add `"enquiry"` to the status enum
- POST/PUT `/api/appointments` and `/api/appointments/:id` accept the new fields
- **No new endpoint, no new collection, no data migration**

### Frontend — new files

| File | Purpose |
|---|---|
| `src/actions/enquiries/create-enquiry.ts` | POST wrapping `/api/appointments` with `status: "enquiry"`. Performs duplicate-phone check before submission. |
| `src/data/enquiry/enquiry.ts` | TanStack Query hooks: `useCreateEnquiry`, `useGetAllEnquiries` (client-side filter on existing GET). Stage-transition mutations reuse `useUpdateAppointment`. |
| `src/app/(protected)/dashboard/enquiries/page.tsx` | Route entry. |
| `src/app/(protected)/dashboard/enquiries/layout.tsx` | Standard layout shell. |
| `src/components/pages/enquiries/EnquiriesPage.tsx` | Main page: header + filter chips + table + intake modal trigger. |
| `src/components/pages/enquiries/enquiries-columns.tsx` | TanStack column defs (10 columns — see UI). |
| `src/components/pages/enquiries/enquiry-intake-modal.tsx` | "+ New Enquiry" Dialog. Fields: Name, Phone, Preferred timing, optional Note. |
| `src/components/pages/enquiries/enquiry-detail-drawer.tsx` | Right-side Sheet for editing/advancing a lead. |
| `src/components/pages/enquiries/stage.ts` | Pure `deriveStage()` function. |

### Frontend — modified files

| File | Change |
|---|---|
| `src/type/schema.ts` | Add `enquirySchema` + `EnquiryType`. Keep `slotBookingZodSchema` and `slotBookingZodType` exported as aliases of the new schema/type (lowest-risk back-compat: existing call sites compile unchanged because the new schema is a superset). Migrate call sites to `EnquiryType` opportunistically, not as part of this PR. |
| `src/components/SlimSidebar.tsx` | Add "Enquiries" nav entry → `/dashboard/enquiries`. |
| `src/data/appointment/appointment.ts` | `useGetAllAppointments` filters out `status === "enquiry"` so enquiry-stage records do not leak into the existing appointments page. |
| `src/constant/index.ts` | Add `ENQUIRY_VIEW`, `ENQUIRY_CREATE`, `ENQUIRY_EDIT`, `ENQUIRY_DELETE` to `PERMISSIONS` for future role tightening (all roles still get `*` for MVP). |

### Data flow per stage transition

```
Executive opens detail drawer, clicks "Mark reached out"
  → useUpdateAppointment.mutate({
       _id, executiveReachedOut: true, executiveReachedOutAt: new Date().toISOString()
     })
    → src/actions/appointments/update-appointment.ts
      → PUT /api/appointments/:id
        → backend Mongoose findByIdAndUpdate
          → invalidates ['enquiries'] + ['appointments'] React Query keys
            → table re-renders with new ✓ badge
```

Same pattern for every checkpoint. No specialized "advance stage" actions — the generic `updateAppointment` covers all transitions. If transitions ever grow side-effects (notify therapist, send SMS), extract specialized actions then.

## UI

### Route placement

New sub-route under existing protected layout: `/dashboard/enquiries`. Sibling of `/dashboard/appointments`. Existing routes untouched.

### Page structure

**Header**
- Title "Enquiries" + total count
- Right: `+ New Enquiry` button → opens intake modal

**Status filter chips (above table)**
- `All (N)` · `Enquiry (N)` · `Reached out (N)` · `Consult booked (N)` · `Consult done (N)` · `Physio booked (N)` · `Assigned (N)` · `Cancelled (N)`
- Counts derived from `deriveStage()` per record.

**Table (10 columns)**

| # | Column | Source | Notes |
|---|---|---|---|
| 1 | Name | `name` | Sortable; click opens detail drawer |
| 2 | Phone | `phonenumber` | |
| 3 | Preferred reach-out | `preferredReachOutTime` | Free text |
| 4 | Reach | `executiveReachedOut` | ✓ green / muted dash |
| 5 | Consult booked | `consultationSlot` | Date + time, or "—" |
| 6 | Done | `consultationCompleted` | ✓ / dash |
| 7 | Physio booked | `physioSlot` + `doctor` | "Date Time — Dr. X" or "—" |
| 8 | Assigned | `physioAssignmentConfirmed` | ✓ / dash |
| 9 | Status | `status` | Existing `StatusBadge` extended with `"enquiry"` (yellow) |
| 10 | ⋯ | — | Opens detail drawer |

Reuses existing `DataTableColumnHeader`, `DataTableFacetedFilter`, `DataTableViewOptions`, `DataTablePagination`. No new table primitives.

### Intake modal

Dialog (Radix) triggered by `+ New Enquiry`. Fields:
- Name (required, min 2)
- Phone (required, number; same validation pattern as existing schemas)
- Preferred reach-out time (required, free text — placeholder: "e.g. 9 AM, Evenings, After 6 PM")
- Note (optional textarea)

Submit calls `useCreateEnquiry`, which first calls the duplicate-phone check (see Edge cases) and only then performs the POST.

### Detail drawer

Right-side `Sheet` (already in shadcn/ui set). Sections top → bottom:

1. **Lead info** — editable name, phone, email, age, location, preferred timing, note
2. **Reach out** — single toggle. Shows "Reached out 2 hours ago" once true.
3. **Online consultation** — date+time picker for `consultationSlot`. Once set, "Mark as done" button toggles `consultationCompleted`.
4. **Physiotherapist assignment** — date+time picker for `physioSlot`, therapist dropdown (`useGetAllTherapist`), "Confirm assignment" button (the field-(f) checkpoint).
5. **Status** — dropdown to override status manually (cancellations).
6. **Delete** — destructive button with `AlertDialog` confirm (mirrors existing pattern in [appointments-details-page.tsx](../../../src/components/pages/appointment/appointments-details-page.tsx)).

### Reused components

Card, Table, DataTablePagination, DataTableViewOptions, DataTableFacetedFilter, Dialog, Sheet, Select, Calendar, Popover, Form, Input, Textarea, Button, Badge, AlertDialog, Skeleton. **Zero new primitives needed.**

### Status badge colors

`enquiry`=yellow, `scheduled`=blue, `ongoing`=indigo, `completed`=green, `cancelled`=destructive. Matches existing `StatusBadge` palette extended with the new `enquiry` case.

## Edge cases & error handling

### Stage-transition guards (UI level)

- "Mark consultation done" disabled until `consultationSlot` is set
- "Book physio" disabled until `consultationCompleted === true`
- "Confirm assignment" disabled until `physioSlot` AND `doctorId` are both set
- Unticking a downstream checkpoint warns: "Unticking will not reverse upstream stages." Allowed (data correction).

### Validation strategy

- Full `enquirySchema` permits most fields optional (per Section 1).
- Per-action mini-schemas enforce per-transition requirements:
  - `bookConsultationSchema` requires `consultationSlot.date + .time`
  - `bookPhysioSchema` requires `physioSlot.date + .time + doctorId`
- Mini-schemas live next to the form components, not in `src/type/schema.ts`.

### Duplicate phone — hard block

On `+ New Enquiry` submit, the create action queries existing records:

```ts
const existing = await findOpenEnquiryByPhone(phonenumber);
// "open" = status NOT IN ('completed', 'cancelled')
if (existing) {
  toast.error("This phone already has an open enquiry");
  openDetailDrawer(existing._id);
  return; // do NOT create new
}
```

A repeat customer whose previous record is `completed` or `cancelled` is allowed to create a new enquiry on the same phone (legitimate re-engagement).

### Existing data compatibility

- Old appointment records lack the new fields. Enquiries page filters by `status === "enquiry"`, so they will not appear there.
- Appointments page treats new fields as `undefined` — already handled because all new fields are optional in the schema.

### Concurrent edits

Last-write-wins. No locking for MVP. Toast on success/failure. The backend's existing PUT already overwrites.

### Empty states

- Zero enquiries total: large "No enquiries yet" placeholder with `+ New Enquiry` button centered
- Filter returns zero: small "No leads in this stage" inside the table (reuses existing `No results` from data table)

### Error UX

- Network failures: toast via `sonner` (already in repo)
- Mutations wait for server confirmation (no optimistic updates for MVP); row shows skeleton/spinner during pending state
- `fetchWithAuth` already handles token refresh — no new auth handling

### Permissions

`src/constant/index.ts` currently grants all roles `["*"]`. New PERMISSIONS keys (`ENQUIRY_*`) added for future role tightening, but no enforcement gating for MVP.

### Time zones

All `*At` timestamps stored as ISO UTC. Displayed via existing `new Date(s).toLocaleString()` pattern (renders in user's local time).

### Out-of-scope for MVP (flagged follow-ups)

- Backend filter/pagination on `/api/appointments?status=` (frontend filters now; server-side when N > ~500)
- Optimistic mutations
- SMS/email on stage transitions
- Audit log of who-changed-what
- Multi-attempt reach-out tracking
- Bulk actions
- A second therapist field for consultations

## Testing

Repo has zero existing tests and no test runner configured. Adding test infrastructure now is scope creep against the "just to start the business" goal.

### Safety nets in place

- TypeScript + Zod schemas catch shape mismatches at compile time
- `useForm` + `zodResolver` validate form submissions
- React Query invalidation keeps UI in sync with server state

### Manual smoke test (mandatory before shipping)

1. **Intake:** `+ New Enquiry` with valid data → row appears with Enquiry badge
2. **Duplicate block:** Try same phone → toast + drawer opens existing record (no new row created)
3. **Reach out toggle:** Mark in drawer → badge becomes "Reached out", timestamp saved
4. **Book consult:** Pick date/time → `consultationSlot` populates, badge → "Consult booked"
5. **Mark consult done:** Toggle in drawer → badge → "Consult done"
6. **Book physio with therapist:** Pick slot + therapist → row shows "Dr. X"
7. **Confirm assignment:** Toggle → badge → "Assigned", row reaches terminal state
8. **Filter chips:** Each chip narrows the table correctly; counts match
9. **Existing appointments page:** Open `/dashboard/appointments` → confirm enquiry-stage records do NOT appear there
10. **Delete:** From drawer → confirm dialog → row removed
11. **Empty state:** Filter to a stage with no leads → "No leads in this stage"
12. **Cancellation:** Set status to cancelled in drawer → moves to Cancelled chip; same phone now allowed for new enquiry
13. **Page refresh mid-funnel:** Reload `/dashboard/enquiries` → all checkpoint state persisted
14. **Role smoke:** Log in as THERAPIST and STAFF → page accessible (all roles have `*` for MVP)

### Backend smoke

- POST `/api/appointments` with `status: "enquiry"` and only the required fields → 200 + record persisted
- PUT `/api/appointments/:id` with each checkpoint update → 200 + field updated
- GET `/api/appointments` returns enquiry records mixed with appointments
- Mongoose schema enum accepts `"enquiry"` (verify after schema change)

### Optional unit test

The `deriveStage()` pure function in `src/components/pages/enquiries/stage.ts` is trivial to unit-test if Vitest is added later. Single file, no DOM.

## Open questions

None — all design choices have been resolved with the user.

## Implementation order (next step: writing-plans)

1. **Backend schema extension** — add fields + status enum value; deploy
2. **Frontend types** — extend Zod schema in `src/type/schema.ts`
3. **Frontend data layer** — `src/actions/enquiries/create-enquiry.ts`, `src/data/enquiry/enquiry.ts`
4. **Pure derivation** — `src/components/pages/enquiries/stage.ts`
5. **Intake modal** — `enquiry-intake-modal.tsx` (with duplicate-phone check)
6. **Table** — `enquiries-columns.tsx` + `EnquiriesPage.tsx` + filter chips
7. **Detail drawer** — `enquiry-detail-drawer.tsx`
8. **Route mount** — `app/(protected)/dashboard/enquiries/{page,layout}.tsx`
9. **Sidebar entry** — `SlimSidebar.tsx`
10. **Existing appointments page filter** — exclude `status === "enquiry"`
11. **Status badge color** — yellow case for `enquiry`
12. **Manual smoke walk** (the 14-step checklist above)
