# Executive Enquiries Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/dashboard/enquiries` — an executive-facing page that tracks inbound leads through a funnel (enquiry → reach out → consultation → physio assignment) by extending the existing `Appointment` entity in place.

**Architecture:** Add `"enquiry"` to the status enum, add per-stage checkpoint booleans + timestamps and two slot fields (`consultationSlot`, `physioSlot`) on the existing `appointments` collection. Reuse the existing `/api/appointments` endpoint for all CRUD. Frontend gets a new page with a filterable funnel table and a detail-drawer (Sheet) for advancing leads. Hard-block creating a new enquiry if an "open" record (status not in `completed`/`cancelled`) already exists for that phone.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind 4, shadcn/ui (Radix), TanStack Query / Table, Zustand, react-hook-form, Zod, sonner (toasts), MongoDB + Mongoose backend (sibling repo).

**Spec:** [`docs/superpowers/specs/2026-05-26-executive-enquiries-dashboard-design.md`](../specs/2026-05-26-executive-enquiries-dashboard-design.md) (commit `20b87c9`)

**Testing policy:** No automated tests. Manual smoke walk at the end (see Task 14). Per-task "verify" steps replace the usual "run tests" step.

---

## File Structure

**New files (frontend, in `C:\workspace\backend-mdw\WellnessFrontend\`):**

| Path | Responsibility |
|---|---|
| `src/actions/enquiries/create-enquiry.ts` | Server action — POST to `/api/appointments` with `status: "enquiry"` |
| `src/data/enquiry/enquiry.ts` | TanStack Query hooks: `useCreateEnquiry`, `useGetAllEnquiries`, helper `findOpenEnquiryByPhone` |
| `src/components/pages/enquiries/stage.ts` | Pure function `deriveStage(record)` returning the funnel stage |
| `src/components/pages/enquiries/enquiry-status-badge.tsx` | Badge component with colors per funnel stage |
| `src/components/pages/enquiries/enquiry-intake-modal.tsx` | `+ New Enquiry` Dialog with duplicate-phone block |
| `src/components/pages/enquiries/enquiry-detail-drawer.tsx` | Right-side Sheet for editing/advancing a lead |
| `src/components/pages/enquiries/enquiries-columns.tsx` | TanStack Table column definitions (10 columns) |
| `src/components/pages/enquiries/EnquiriesPage.tsx` | Page composition: header, filter chips, table, intake modal |
| `src/app/(protected)/dashboard/enquiries/page.tsx` | Route entry — renders `<EnquiriesPage />` |
| `src/app/(protected)/dashboard/enquiries/layout.tsx` | Layout shell matching sibling routes |

**Modified files (frontend):**

| Path | Change |
|---|---|
| `src/type/schema.ts` | Add `enquirySchema` + `EnquiryType`; keep `slotBookingZodSchema` as an alias to the new schema for back-compat |
| `src/data/appointment/appointment.ts` | Make `useGetAllAppointments` filter out records where `status === "enquiry"` |
| `src/constant/index.ts` | Add `ENQUIRY_VIEW`, `ENQUIRY_CREATE`, `ENQUIRY_EDIT`, `ENQUIRY_DELETE` to `PERMISSIONS` |
| `src/components/SlimSidebar.tsx` | Add "Enquiries" entry to `navLinks` |

**Modified files (backend, sibling repo `C:\workspace\backend-mdw\`):**

| Path | Change |
|---|---|
| Mongoose Appointment model file (path varies — e.g. `src/models/appointment.js` or similar) | Add new fields + extend status enum; see Task 1 |

---

## Task 1: Backend — extend Appointment model

**Repo:** `C:\workspace\backend-mdw\` (sibling)

**Files:**
- Modify: the Mongoose schema for `appointments` (locate it under `models/`, `schemas/`, or wherever schemas live in that repo)
- Modify: any endpoint validator (e.g. Joi/Zod) that whitelists fields for POST/PUT `/api/appointments`

- [ ] **Step 1: Find the Appointment Mongoose schema**

In a terminal at `C:\workspace\backend-mdw\`:

```bash
grep -rn "appointments" --include="*.js" --include="*.ts" -l models schemas src 2>nul
```

Locate the file that defines the `appointments` Mongoose schema. Open it.

- [ ] **Step 2: Extend the schema with the new fields**

Inside the schema definition object (alongside existing `name`, `phonenumber`, `slot`, etc.), add:

```js
// New funnel field: client-stated reach-out time preference (free text)
preferredReachOutTime: { type: String },

// Checkpoint: executive reached out
executiveReachedOut:   { type: Boolean, default: false },
executiveReachedOutAt: { type: Date },

// Checkpoint: online consultation booked + completed
consultationSlot:        { date: { type: String }, time: { type: String } },
consultationCompleted:   { type: Boolean, default: false },
consultationCompletedAt: { type: Date },

// Checkpoint: physio assignment booked + confirmed
physioSlot:                    { date: { type: String }, time: { type: String } },
physioAssignmentConfirmed:     { type: Boolean, default: false },
physioAssignmentConfirmedAt:   { type: Date },
```

Then locate the `status` field. If it has an `enum:`, add `"enquiry"` as the first allowed value:

```js
status: {
  type: String,
  enum: ["enquiry", "scheduled", "ongoing", "completed", "cancelled"],
  default: "enquiry",
},
```

If `status` had no enum constraint, just leave it as-is — the frontend will only ever set valid values.

- [ ] **Step 3: Whitelist new fields in the POST/PUT handlers**

Find the POST `/api/appointments` and PUT `/api/appointments/:id` handlers (usually under `routes/`, `controllers/`, or `src/routes/appointments.*`).

If they use an explicit allowlist of fields (Joi schema, manual destructure, etc.), add each of the new field names to the allowlist:

```
preferredReachOutTime, executiveReachedOut, executiveReachedOutAt,
consultationSlot, consultationCompleted, consultationCompletedAt,
physioSlot, physioAssignmentConfirmed, physioAssignmentConfirmedAt
```

If they pass the whole `req.body` to Mongoose, no change needed — Mongoose will silently ignore unknown fields anyway, and now they'll be persisted because we added them to the schema.

- [ ] **Step 4: Restart the backend and smoke-test with curl**

Restart your backend server. In a new terminal:

```bash
curl -X POST http://localhost:<backend-port>/api/appointments ^
  -H "Content-Type: application/json" ^
  -H "Cookie: accessToken=<paste-from-browser>" ^
  -d "{\"name\":\"Test Lead\",\"phonenumber\":9999999999,\"preferredReachOutTime\":\"9 AM\",\"status\":\"enquiry\"}"
```

Expected: 200/201 response with a record body. Then GET the record back and confirm the new fields persisted with their defaults.

- [ ] **Step 5: Commit (backend repo)**

```bash
cd C:\workspace\backend-mdw
git add <path-to-model> <path-to-routes>
git commit -m "feat(appointments): add enquiry funnel fields and 'enquiry' status"
```

---

## Task 2: Frontend — extend Zod schema with `enquirySchema`

**Files:**
- Modify: `src/type/schema.ts`

- [ ] **Step 1: Add `enquirySchema` and keep `slotBookingZodSchema` as alias**

Open `src/type/schema.ts`. Find `slotBookingZodSchema` (around line 64) and **replace** that block with:

```ts
// Superset schema for the executive enquiry funnel.
// Existing appointment records validate against this because every legacy
// field stays optional or unchanged. Stage transitions are driven by the
// checkpoint booleans below.
export const enquirySchema = z.object({
  _id: z.string().optional(),

  // ── Always required (the bare enquiry) ──
  name: z.string().min(2, "Name must be at least 2 characters"),
  phonenumber: z.number(),
  preferredReachOutTime: z.string().min(1, "Preferred reach-out time is required"),
  status: z
    .enum(["enquiry", "scheduled", "ongoing", "completed", "cancelled"])
    .default("enquiry"),

  // ── Optional / collected as the funnel progresses ──
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  age: z.number().optional(),
  location: z.string().optional(),
  category: z.string().optional(),
  note: z.string().optional(),
  typeOfappointment: z.enum(["consultation", "appointment"]).optional(),

  // ── Checkpoint: executive reached out ──
  executiveReachedOut: z.boolean().default(false),
  executiveReachedOutAt: z.string().datetime().optional(),

  // ── Checkpoint: online consultation ──
  consultationSlot: z
    .object({ date: z.string(), time: z.string() })
    .optional(),
  consultationCompleted: z.boolean().default(false),
  consultationCompletedAt: z.string().datetime().optional(),

  // ── Checkpoint: physio assignment ──
  physioSlot: z.object({ date: z.string(), time: z.string() }).optional(),
  doctorId: z.string().optional(),
  doctor: z.string().optional(),
  physioAssignmentConfirmed: z.boolean().default(false),
  physioAssignmentConfirmedAt: z.string().datetime().optional(),

  // ── Legacy fields preserved for back-compat with existing appointment records ──
  slot: z.object({ date: z.string(), time: z.string() }).optional(),
  therapyStartTime: z.string().optional(),
  therapyEndTime: z.string().optional(),
});

export type EnquiryType = z.infer<typeof enquirySchema>;

// Back-compat aliases — existing call sites import these names.
// New code should import `enquirySchema` / `EnquiryType` directly.
export const slotBookingZodSchema = enquirySchema;
export type slotBookingZodType = EnquiryType;
```

Make sure no other top-level export named `slotBookingZodSchema` or `slotBookingZodType` remains in the file (delete the originals).

- [ ] **Step 2: Verify TypeScript compiles**

In a terminal at `C:\workspace\backend-mdw\WellnessFrontend`:

```bash
npx tsc --noEmit
```

Expected: zero errors. Any existing call site that used `slotBookingZodSchema` / `slotBookingZodType` keeps working because the new schema is a superset (all old fields still validate; previously-required-but-now-optional fields don't break since omission is allowed). If you see errors complaining about `slot.time` or `slot.date` being undefined, that's an existing call site assuming `slot` is non-null — leave it for now; existing records still have `slot`, only enquiries lack it.

- [ ] **Step 3: Commit**

```bash
git add src/type/schema.ts
git commit -m "feat(schema): extend appointment schema with enquiry funnel fields"
```

---

## Task 3: Pure stage-derivation function

**Files:**
- Create: `src/components/pages/enquiries/stage.ts`

- [ ] **Step 1: Create the directory + file**

In the project root:

```bash
mkdir src\components\pages\enquiries
```

Then create `src/components/pages/enquiries/stage.ts`:

```ts
import type { EnquiryType } from "@/type/schema";

export type FunnelStage =
  | "enquiry"
  | "reached_out"
  | "consult_booked"
  | "consult_done"
  | "physio_booked"
  | "assigned"
  | "cancelled";

/**
 * Derive the funnel stage of a single enquiry record from its persistent state.
 * Order matters — checks proceed from terminal state backwards.
 */
export function deriveStage(r: EnquiryType): FunnelStage {
  if (r.status === "cancelled") return "cancelled";
  if (r.physioAssignmentConfirmed) return "assigned";
  if (r.physioSlot?.date && r.physioSlot?.time) return "physio_booked";
  if (r.consultationCompleted) return "consult_done";
  if (r.consultationSlot?.date && r.consultationSlot?.time) return "consult_booked";
  if (r.executiveReachedOut) return "reached_out";
  return "enquiry";
}

/**
 * Human-readable labels for chips and badges. Keep in sync with FunnelStage.
 */
export const STAGE_LABELS: Record<FunnelStage, string> = {
  enquiry: "Enquiry",
  reached_out: "Reached out",
  consult_booked: "Consult booked",
  consult_done: "Consult done",
  physio_booked: "Physio booked",
  assigned: "Assigned",
  cancelled: "Cancelled",
};

/** Ordered list used to render the filter chips. */
export const STAGE_ORDER: FunnelStage[] = [
  "enquiry",
  "reached_out",
  "consult_booked",
  "consult_done",
  "physio_booked",
  "assigned",
  "cancelled",
];
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/enquiries/stage.ts
git commit -m "feat(enquiries): add pure stage-derivation function"
```

---

## Task 4: Server action — create enquiry

**Files:**
- Create: `src/actions/enquiries/create-enquiry.ts`

- [ ] **Step 1: Create the directory + action**

```bash
mkdir src\actions\enquiries
```

Create `src/actions/enquiries/create-enquiry.ts`:

```ts
"use server";

import { base_url } from "@/constant";
import { fetchWithAuth } from "@/lib/fetchwithauth";
import type { ApiResponse } from "@/type/api";
import type { EnquiryType } from "@/type/schema";

export type CreateEnquiryInput = Pick<
  EnquiryType,
  "name" | "phonenumber" | "preferredReachOutTime" | "note"
>;

export default async function createEnquiry(
  values: CreateEnquiryInput,
): Promise<ApiResponse<EnquiryType>> {
  try {
    const payload: Partial<EnquiryType> = {
      ...values,
      status: "enquiry",
      executiveReachedOut: false,
      consultationCompleted: false,
      physioAssignmentConfirmed: false,
    };

    const response = await fetchWithAuth(`${base_url}/api/appointments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      return {
        success: false,
        message: result.message ?? `Request failed with status ${response.status}`,
      };
    }

    const result = await response.json();
    return {
      success: true,
      message: result.message || "Enquiry created successfully",
      data: result.data,
    };
  } catch (err) {
    console.error("[createEnquiry]", err);
    return { success: false, message: "Network error, please try again" };
  }
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/actions/enquiries/create-enquiry.ts
git commit -m "feat(enquiries): add create-enquiry server action"
```

---

## Task 5: Data hooks — `useCreateEnquiry`, `useGetAllEnquiries`, duplicate helper

**Files:**
- Create: `src/data/enquiry/enquiry.ts`

- [ ] **Step 1: Create directory + hooks file**

```bash
mkdir src\data\enquiry
```

Create `src/data/enquiry/enquiry.ts`:

```ts
"use client";

import createEnquiry, {
  type CreateEnquiryInput,
} from "@/actions/enquiries/create-enquiry";
import getAllAppointments from "@/actions/appointments/get-all-appointments";
import type { EnquiryType, UserType } from "@/type/schema";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

/** Status values considered "open" — duplicate-phone check rejects only these. */
const OPEN_STATUSES = new Set<EnquiryType["status"]>([
  "enquiry",
  "scheduled",
  "ongoing",
]);

export const enquiriesQueryOptions = (user: UserType) => ({
  queryKey: ["enquiries", user] as const,
  queryFn: async (): Promise<EnquiryType[]> => {
    const result = await getAllAppointments(user);
    if (!result.success) throw new Error(result.message);
    return result.data ?? [];
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
});

/** Returns ALL appointment-collection records (enquiries + booked). The page filters by status. */
export function useGetAllEnquiries(user: UserType) {
  return useQuery(enquiriesQueryOptions(user));
}

/**
 * Find an open (non-completed, non-cancelled) record with the given phonenumber.
 * Used by the intake modal to hard-block duplicates.
 */
export function findOpenEnquiryByPhone(
  records: EnquiryType[] | undefined,
  phonenumber: number,
): EnquiryType | undefined {
  if (!records) return undefined;
  return records.find(
    (r) => r.phonenumber === phonenumber && OPEN_STATUSES.has(r.status),
  );
}

export function useCreateEnquiry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (values: CreateEnquiryInput) => {
      const result = await createEnquiry(values);
      if (!result.success) throw new Error(result.message);
      return result;
    },
    onSuccess: (result) => {
      toast.success("Enquiry created", { description: result.message });
      // Invalidate both keys — enquiries page and appointments page share data.
      queryClient.invalidateQueries({ queryKey: ["enquiries"] });
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/data/enquiry/enquiry.ts
git commit -m "feat(enquiries): add data hooks and duplicate-phone helper"
```

---

## Task 6: Status badge component

**Files:**
- Create: `src/components/pages/enquiries/enquiry-status-badge.tsx`

- [ ] **Step 1: Create the badge**

Create `src/components/pages/enquiries/enquiry-status-badge.tsx`:

```tsx
"use client";

import { Badge } from "@/components/ui/badge";
import {
  STAGE_LABELS,
  deriveStage,
  type FunnelStage,
} from "./stage";
import type { EnquiryType } from "@/type/schema";

const STAGE_CLASSES: Record<FunnelStage, string> = {
  enquiry: "border-yellow-600 text-yellow-700 bg-yellow-50",
  reached_out: "border-blue-600 text-blue-700 bg-blue-50",
  consult_booked: "border-indigo-600 text-indigo-700 bg-indigo-50",
  consult_done: "border-emerald-600 text-emerald-700 bg-emerald-50",
  physio_booked: "border-pink-600 text-pink-700 bg-pink-50",
  assigned: "border-green-700 text-green-800 bg-green-100",
  cancelled: "border-red-600 text-red-700 bg-red-50",
};

export function EnquiryStatusBadge({ record }: { record: EnquiryType }) {
  const stage = deriveStage(record);
  return (
    <Badge variant="outline" className={STAGE_CLASSES[stage]}>
      {STAGE_LABELS[stage]}
    </Badge>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/enquiries/enquiry-status-badge.tsx
git commit -m "feat(enquiries): add status badge component"
```

---

## Task 7: Intake modal with duplicate-phone block

**Files:**
- Create: `src/components/pages/enquiries/enquiry-intake-modal.tsx`

- [ ] **Step 1: Create the modal component**

Create `src/components/pages/enquiries/enquiry-intake-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { CirclePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { findOpenEnquiryByPhone, useCreateEnquiry } from "@/data/enquiry/enquiry";
import type { EnquiryType } from "@/type/schema";

const intakeFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phonenumber: z
    .number({ invalid_type_error: "Phone is required" })
    .refine((n) => String(n).length >= 10, "Phone must be at least 10 digits"),
  preferredReachOutTime: z
    .string()
    .min(1, "Required — e.g. 9 AM, Evenings, After 6 PM"),
  note: z.string().optional(),
});

type IntakeFormValues = z.infer<typeof intakeFormSchema>;

interface EnquiryIntakeModalProps {
  /** Current cached enquiries — used for the duplicate-phone block. */
  existingRecords: EnquiryType[] | undefined;
  /** Called with the duplicate record when the user hits a block. */
  onDuplicateFound: (record: EnquiryType) => void;
}

export function EnquiryIntakeModal({
  existingRecords,
  onDuplicateFound,
}: EnquiryIntakeModalProps) {
  const [open, setOpen] = useState(false);
  const createMutation = useCreateEnquiry();

  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      phonenumber: undefined as unknown as number,
      preferredReachOutTime: "",
      note: "",
    },
  });

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) form.reset();
  }

  function onSubmit(values: IntakeFormValues) {
    const dup = findOpenEnquiryByPhone(existingRecords, values.phonenumber);
    if (dup) {
      toast.error("This phone already has an open enquiry", {
        description: `Opening "${dup.name}" instead.`,
      });
      setOpen(false);
      form.reset();
      onDuplicateFound(dup);
      return;
    }

    createMutation.mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset();
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1">
          <CirclePlus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Enquiry
          </span>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>New enquiry</DialogTitle>
          <DialogDescription>
            Log an inbound lead. You can fill in slots and the assigned
            therapist later from the detail drawer.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 mt-2"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phonenumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="10-digit phone"
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preferredReachOutTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred reach-out time</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 9 AM, Evenings, After 6 PM"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What did the lead say?"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </span>
              ) : (
                "Create enquiry"
              )}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/enquiries/enquiry-intake-modal.tsx
git commit -m "feat(enquiries): add intake modal with duplicate-phone block"
```

---

## Task 8: Detail drawer (Sheet) for advancing a lead

**Files:**
- Create: `src/components/pages/enquiries/enquiry-detail-drawer.tsx`

- [ ] **Step 1: Create the drawer**

Create `src/components/pages/enquiries/enquiry-detail-drawer.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import {
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/data/appointment/appointment";
import { useGetAllTherapist } from "@/data/therapist/therapist";
import type { EnquiryType, TherapistformType } from "@/type/schema";
import { EnquiryStatusBadge } from "./enquiry-status-badge";

interface EnquiryDetailDrawerProps {
  /** Record being viewed; null means drawer closed. */
  record: EnquiryType | null;
  /** Called when the drawer should close (Cancel, X, after delete, etc.). */
  onClose: () => void;
}

export function EnquiryDetailDrawer({
  record,
  onClose,
}: EnquiryDetailDrawerProps) {
  const open = record !== null;
  const { mutate: update, isPending: isUpdating } = useUpdateAppointment();
  const { mutate: del, isPending: isDeleting } = useDeleteAppointment();
  const { data: therapists } = useGetAllTherapist();

  // Local edit buffer keeps the form responsive without writing every keystroke.
  // Re-syncs to the latest record prop whenever the parent re-renders with
  // fresh data (e.g. after a server update). Unsaved local edits are lost on
  // re-sync — acceptable for MVP because saves happen on every blur and toggle.
  const [draft, setDraft] = useState<EnquiryType | null>(record);
  useEffect(() => {
    setDraft(record);
  }, [record]);

  if (!record || !draft) return null;

  function patch(partial: Partial<EnquiryType>) {
    setDraft({ ...draft!, ...partial });
  }

  function save(extra?: Partial<EnquiryType>) {
    const next = { ...draft!, ...(extra ?? {}) };
    update(next, {
      onSuccess: () => {
        setDraft(next);
        if (extra) toast.success("Updated");
      },
    });
  }

  function handleDelete() {
    if (!draft?._id) return;
    del(draft._id, { onSuccess: () => onClose() });
  }

  function toggleReachedOut(checked: boolean) {
    save({
      executiveReachedOut: checked,
      executiveReachedOutAt: checked ? new Date().toISOString() : undefined,
    });
  }

  function toggleConsultDone(checked: boolean) {
    if (checked && !draft?.consultationSlot?.date) {
      toast.error("Book the consultation slot first");
      return;
    }
    save({
      consultationCompleted: checked,
      consultationCompletedAt: checked ? new Date().toISOString() : undefined,
    });
  }

  function toggleAssignmentConfirmed(checked: boolean) {
    if (
      checked &&
      (!draft?.physioSlot?.date || !draft?.physioSlot?.time || !draft?.doctorId)
    ) {
      toast.error("Book the physio slot and pick a therapist first");
      return;
    }
    save({
      physioAssignmentConfirmed: checked,
      physioAssignmentConfirmedAt: checked
        ? new Date().toISOString()
        : undefined,
    });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {draft.name || "Unnamed"} <EnquiryStatusBadge record={draft} />
          </SheetTitle>
          <SheetDescription>
            Advance the lead through the funnel. All changes save on click.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 space-y-6">
          {/* ── Section: Lead info ── */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Lead info</h3>
            <div className="grid grid-cols-2 gap-3">
              <LabeledInput
                label="Name"
                value={draft.name ?? ""}
                onChange={(v) => patch({ name: v })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Phone"
                type="number"
                value={String(draft.phonenumber ?? "")}
                onChange={(v) => patch({ phonenumber: Number(v) })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Email"
                value={draft.email ?? ""}
                onChange={(v) => patch({ email: v })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Age"
                type="number"
                value={String(draft.age ?? "")}
                onChange={(v) => patch({ age: Number(v) })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Location"
                value={draft.location ?? ""}
                onChange={(v) => patch({ location: v })}
                onBlur={() => save()}
              />
              <LabeledInput
                label="Preferred reach-out"
                value={draft.preferredReachOutTime ?? ""}
                onChange={(v) => patch({ preferredReachOutTime: v })}
                onBlur={() => save()}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Note</label>
              <Textarea
                value={draft.note ?? ""}
                onChange={(e) => patch({ note: e.target.value })}
                onBlur={() => save()}
              />
            </div>
          </section>

          {/* ── Section: Reach out ── */}
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">1. Executive reach-out</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.executiveReachedOut ?? false}
                onChange={(e) => toggleReachedOut(e.target.checked)}
              />
              Mark as reached out
            </label>
            {draft.executiveReachedOutAt && (
              <p className="text-xs text-muted-foreground">
                Reached out at{" "}
                {new Date(draft.executiveReachedOutAt).toLocaleString()}
              </p>
            )}
          </section>

          {/* ── Section: Online consultation ── */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">
              2. Online consultation
            </h3>
            <SlotPicker
              label="Consultation slot"
              value={draft.consultationSlot}
              onChange={(slot) => save({ consultationSlot: slot })}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.consultationCompleted ?? false}
                disabled={!draft.consultationSlot?.date}
                onChange={(e) => toggleConsultDone(e.target.checked)}
              />
              Mark consultation done
            </label>
            {draft.consultationCompletedAt && (
              <p className="text-xs text-muted-foreground">
                Completed at{" "}
                {new Date(draft.consultationCompletedAt).toLocaleString()}
              </p>
            )}
          </section>

          {/* ── Section: Physio assignment ── */}
          <section className="space-y-3 border-t pt-4">
            <h3 className="text-sm font-semibold">
              3. Physiotherapist assignment
            </h3>
            <SlotPicker
              label="Physio slot"
              value={draft.physioSlot}
              onChange={(slot) => save({ physioSlot: slot })}
            />
            <div>
              <label className="text-xs text-muted-foreground">
                Therapist
              </label>
              <Select
                value={draft.doctorId ?? ""}
                onValueChange={(id) => {
                  const t = therapists?.find(
                    (x: TherapistformType) => x.doctorId === id,
                  );
                  save({
                    doctorId: id,
                    doctor: t?.name ?? "",
                  });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pick a therapist" />
                </SelectTrigger>
                <SelectContent>
                  {(therapists ?? []).map((t: TherapistformType) => (
                    <SelectItem key={t.doctorId} value={t.doctorId}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.physioAssignmentConfirmed ?? false}
                disabled={
                  !draft.physioSlot?.date ||
                  !draft.physioSlot?.time ||
                  !draft.doctorId
                }
                onChange={(e) => toggleAssignmentConfirmed(e.target.checked)}
              />
              Confirm assignment (therapist is available)
            </label>
            {draft.physioAssignmentConfirmedAt && (
              <p className="text-xs text-muted-foreground">
                Confirmed at{" "}
                {new Date(draft.physioAssignmentConfirmedAt).toLocaleString()}
              </p>
            )}
          </section>

          {/* ── Section: Status override ── */}
          <section className="space-y-2 border-t pt-4">
            <h3 className="text-sm font-semibold">Status override</h3>
            <Select
              value={draft.status ?? "enquiry"}
              onValueChange={(v) =>
                save({ status: v as EnquiryType["status"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="enquiry">Enquiry</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </section>

          {/* ── Section: Footer actions ── */}
          <section className="flex justify-between items-center border-t pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={isDeleting || isUpdating}
                >
                  {isDeleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting…
                    </span>
                  ) : (
                    "Delete enquiry"
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete enquiry?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently removes the record. Cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <SheetClose asChild>
              <Button variant="outline">Close</Button>
            </SheetClose>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ── Local helpers ──

function LabeledInput({
  label,
  value,
  onChange,
  onBlur,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    </div>
  );
}

function SlotPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { date: string; time: string } | undefined;
  onChange: (slot: { date: string; time: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const date = value?.date ? new Date(value.date) : undefined;

  const TIME_SLOTS = [
    "9:30", "10:30", "11:30", "12:30", "13:30", "14:30",
    "15:30", "16:30", "17:30", "18:30", "19:30", "20:30",
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="text-xs text-muted-foreground">{label} date</label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("w-full justify-start text-left font-normal")}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                if (d)
                  onChange({
                    date: format(d, "yyyy-MM-dd"),
                    time: value?.time ?? "",
                  });
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div>
        <label className="text-xs text-muted-foreground">Time</label>
        <Select
          value={value?.time ?? ""}
          onValueChange={(t) =>
            onChange({ date: value?.date ?? "", time: t })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOTS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors. Note: the drawer imports `useUpdateAppointment` and `useDeleteAppointment` from `@/data/appointment/appointment` — those already exist (do not duplicate them). It also uses the existing `useGetAllTherapist`.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/enquiries/enquiry-detail-drawer.tsx
git commit -m "feat(enquiries): add detail drawer with stage-transition guards"
```

---

## Task 9: Table column definitions

**Files:**
- Create: `src/components/pages/enquiries/enquiries-columns.tsx`

- [ ] **Step 1: Create columns**

Create `src/components/pages/enquiries/enquiries-columns.tsx`:

```tsx
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTableColumnHeader } from "@/components/tables/data-table-column-header";
import type { EnquiryType } from "@/type/schema";
import { EnquiryStatusBadge } from "./enquiry-status-badge";

function CheckOrDash({
  checked,
  disabled = false,
}: {
  checked: boolean | undefined;
  disabled?: boolean;
}) {
  if (checked) {
    return <Check className="inline h-4 w-4 text-green-600" />;
  }
  return (
    <span className={disabled ? "text-muted-foreground/40" : "text-muted-foreground"}>
      —
    </span>
  );
}

function SlotCell({
  slot,
  trailing,
}: {
  slot: { date: string; time: string } | undefined;
  trailing?: string | null;
}) {
  if (!slot?.date || !slot?.time) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="leading-tight">
      <div>
        {slot.date} {slot.time}
      </div>
      {trailing && (
        <div className="text-xs text-muted-foreground">{trailing}</div>
      )}
    </div>
  );
}

interface MakeColumnsParams {
  /** Called when the user clicks a row or the ⋯ button to open the drawer. */
  onOpenDetail: (record: EnquiryType) => void;
}

export function makeEnquiryColumns({
  onOpenDetail,
}: MakeColumnsParams): ColumnDef<EnquiryType>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="font-medium text-left hover:underline"
          onClick={() => onOpenDetail(row.original)}
        >
          {row.original.name || "—"}
        </button>
      ),
    },
    {
      accessorKey: "phonenumber",
      header: "Phone",
      cell: ({ row }) => row.original.phonenumber ?? "—",
    },
    {
      accessorKey: "preferredReachOutTime",
      header: "Preferred",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.preferredReachOutTime ?? "—"}
        </span>
      ),
    },
    {
      id: "reach",
      header: () => <span title="Executive reached out">Reach</span>,
      cell: ({ row }) => (
        <CheckOrDash checked={row.original.executiveReachedOut} />
      ),
    },
    {
      id: "consultSlot",
      header: "Consult booked",
      cell: ({ row }) => <SlotCell slot={row.original.consultationSlot} />,
    },
    {
      id: "consultDone",
      header: "Done",
      cell: ({ row }) => (
        <CheckOrDash
          checked={row.original.consultationCompleted}
          disabled={!row.original.consultationSlot?.date}
        />
      ),
    },
    {
      id: "physioSlot",
      header: "Physio booked",
      cell: ({ row }) => (
        <SlotCell
          slot={row.original.physioSlot}
          trailing={row.original.doctor ?? null}
        />
      ),
    },
    {
      id: "assigned",
      header: "Assigned",
      cell: ({ row }) => (
        <CheckOrDash
          checked={row.original.physioAssignmentConfirmed}
          disabled={
            !row.original.physioSlot?.date || !row.original.doctorId
          }
        />
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => <EnquiryStatusBadge record={row.original} />,
    },
    {
      id: "action",
      cell: ({ row }) => (
        <Button
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => onOpenDetail(row.original)}
        >
          <span className="sr-only">Open detail</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      ),
    },
  ];
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/enquiries/enquiries-columns.tsx
git commit -m "feat(enquiries): add table column definitions"
```

---

## Task 10: Page composition with filter chips + table + state wiring

**Files:**
- Create: `src/components/pages/enquiries/EnquiriesPage.tsx`

- [ ] **Step 1: Create the page component**

Create `src/components/pages/enquiries/EnquiriesPage.tsx`:

```tsx
"use client";

import { useMemo, useState } from "react";
import {
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/tables/data-table-pagination";
import { QueryWrapper } from "@/components/query-wrapper";

import { useAuthStore } from "@/providers/permission-provider";
import { useGetAllEnquiries } from "@/data/enquiry/enquiry";
import type { EnquiryType } from "@/type/schema";

import {
  STAGE_LABELS,
  STAGE_ORDER,
  deriveStage,
  type FunnelStage,
} from "./stage";
import { makeEnquiryColumns } from "./enquiries-columns";
import { EnquiryIntakeModal } from "./enquiry-intake-modal";
import { EnquiryDetailDrawer } from "./enquiry-detail-drawer";

function EnquiriesTableSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: 7 }).map((_, j) => (
            <div
              key={j}
              className="h-8 flex-1 rounded bg-muted animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

const CHIP_CLASSES: Record<FunnelStage | "all", string> = {
  all: "bg-foreground text-background",
  enquiry: "bg-yellow-100 text-yellow-800",
  reached_out: "bg-blue-100 text-blue-800",
  consult_booked: "bg-indigo-100 text-indigo-800",
  consult_done: "bg-emerald-100 text-emerald-800",
  physio_booked: "bg-pink-100 text-pink-800",
  assigned: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function EnquiriesPage() {
  const { user } = useAuthStore();
  const { id, role, userEmail } = user || {};
  const {
    data: allRecords,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetAllEnquiries({ role, id, userEmail });

  const [activeFilter, setActiveFilter] = useState<FunnelStage | "all">("all");
  const [openDetail, setOpenDetail] = useState<EnquiryType | null>(null);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [nameFilter, setNameFilter] = useState("");

  // Frontend-side filtering: scope to enquiry-funnel records and the active chip.
  // "Enquiry-funnel" means anything we want to surface on this page — we exclude
  // legacy bookings that have no funnel fields at all (no preferredReachOutTime
  // and no consultationSlot/physioSlot). This keeps the page free of historical
  // appointments while still showing all new records.
  const enquiryRecords = useMemo<EnquiryType[]>(() => {
    if (!allRecords) return [];
    return allRecords.filter((r: EnquiryType) => {
      const isEnquiryFunnel =
        r.status === "enquiry" ||
        r.preferredReachOutTime !== undefined ||
        r.executiveReachedOut === true ||
        r.consultationSlot !== undefined ||
        r.physioSlot !== undefined;
      return isEnquiryFunnel;
    });
  }, [allRecords]);

  const stageCounts = useMemo(() => {
    const counts: Record<FunnelStage, number> = {
      enquiry: 0,
      reached_out: 0,
      consult_booked: 0,
      consult_done: 0,
      physio_booked: 0,
      assigned: 0,
      cancelled: 0,
    };
    for (const r of enquiryRecords) counts[deriveStage(r)]++;
    return counts;
  }, [enquiryRecords]);

  const visibleRecords = useMemo(() => {
    if (activeFilter === "all") return enquiryRecords;
    return enquiryRecords.filter((r) => deriveStage(r) === activeFilter);
  }, [enquiryRecords, activeFilter]);

  const columns = useMemo(
    () =>
      makeEnquiryColumns({
        onOpenDetail: (r) => setOpenDetail(r),
      }),
    [],
  );

  const table = useReactTable({
    data: visibleRecords,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter: nameFilter,
    },
    onGlobalFilterChange: setNameFilter,
    globalFilterFn: (row, _columnId, value) => {
      const q = String(value).toLowerCase();
      if (!q) return true;
      const r = row.original as EnquiryType;
      return (
        (r.name ?? "").toLowerCase().includes(q) ||
        String(r.phonenumber ?? "").includes(q)
      );
    },
  });

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle>Enquiries</CardTitle>
            <CardDescription>
              Track inbound leads from first call to physiotherapist assignment.
            </CardDescription>
          </div>
          <EnquiryIntakeModal
            existingRecords={enquiryRecords}
            onDuplicateFound={(rec) => setOpenDetail(rec)}
          />
        </CardHeader>

        <CardContent>
          <QueryWrapper
            isLoading={isLoading}
            isError={isError}
            error={error}
            onRetry={refetch}
            skeleton={<EnquiriesTableSkeleton />}
          >
            {/* Filter chips */}
            <div className="flex gap-2 flex-wrap mb-4 text-xs">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`px-3 py-1 rounded-full font-semibold ${
                  activeFilter === "all"
                    ? CHIP_CLASSES.all
                    : "bg-muted text-muted-foreground"
                }`}
              >
                All ({enquiryRecords.length})
              </button>
              {STAGE_ORDER.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  onClick={() => setActiveFilter(stage)}
                  className={`px-3 py-1 rounded-full font-medium ${
                    activeFilter === stage
                      ? CHIP_CLASSES[stage]
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {STAGE_LABELS[stage]} ({stageCounts[stage]})
                </button>
              ))}
            </div>

            {/* Search row */}
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Filter by name or phone..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="max-w-sm"
              />
              {(nameFilter || activeFilter !== "all") && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setNameFilter("");
                    setActiveFilter("all");
                  }}
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext(),
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center text-muted-foreground"
                      >
                        {enquiryRecords.length === 0
                          ? "No enquiries yet. Click + New Enquiry to log one."
                          : "No leads in this stage."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4">
              <DataTablePagination table={table} />
            </div>
          </QueryWrapper>
        </CardContent>
      </Card>

      <EnquiryDetailDrawer
        record={openDetail}
        onClose={() => setOpenDetail(null)}
      />
    </>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pages/enquiries/EnquiriesPage.tsx
git commit -m "feat(enquiries): add page composition with filter chips and table"
```

---

## Task 11: Mount the route

**Files:**
- Create: `src/app/(protected)/dashboard/enquiries/page.tsx`
- Create: `src/app/(protected)/dashboard/enquiries/layout.tsx`

- [ ] **Step 1: Create the layout**

```bash
mkdir "src\app\(protected)\dashboard\enquiries"
```

Create `src/app/(protected)/dashboard/enquiries/layout.tsx`:

```tsx
export default function EnquiriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Create the page entry**

Create `src/app/(protected)/dashboard/enquiries/page.tsx`:

```tsx
import EnquiriesPage from "@/components/pages/enquiries/EnquiriesPage";

export default function Page() {
  return <EnquiriesPage />;
}
```

- [ ] **Step 3: Verify TS compiles + dev server starts**

```bash
npx tsc --noEmit
```

Expected: zero errors. Then in another terminal:

```bash
npm run dev
```

Visit `http://localhost:3000/dashboard/enquiries`. Expected: page loads (empty table + chips visible). Login first if redirected to `/auth/login`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(protected)/dashboard/enquiries"
git commit -m "feat(enquiries): mount /dashboard/enquiries route"
```

---

## Task 12: Sidebar entry

**Files:**
- Modify: `src/components/SlimSidebar.tsx`

- [ ] **Step 1: Import the icon and add the nav entry**

Open `src/components/SlimSidebar.tsx`. Find the lucide-react import (line 6–12) and add `Inbox`:

```tsx
import {
  CalendarClock,
  Home,
  Inbox,
  PanelLeft,
  Settings,
  UserPlus,
} from "lucide-react";
```

Then find `const navLinks` (around line 41) and add a new entry between "Book Slot" and "Therapist List":

```tsx
const navLinks = [
  {
    title: "Dasboard",
    icon: <Home className="h-5 w-5" />,
    href: "/dashboard",
  },
  {
    title: "Enquiries",
    icon: <Inbox className="h-5 w-5" />,
    href: "/dashboard/enquiries",
  },
  {
    title: "Book Slot",
    icon: <CalendarClock className="h-5 w-5" />,
    href: "/dashboard/appointments",
  },
  {
    title: "Therapist List",
    icon: <UserPlus className="h-5 w-5" />,
    href: "/dashboard/alltherapist",
  },
];
```

- [ ] **Step 2: Verify visually**

The dev server should hot-reload. Refresh `/dashboard` — the sidebar should now show the Inbox icon. Hover to see the "Enquiries" tooltip. Click → navigates to `/dashboard/enquiries`.

- [ ] **Step 3: Commit**

```bash
git add src/components/SlimSidebar.tsx
git commit -m "feat(enquiries): add Enquiries entry to sidebar"
```

---

## Task 13: Hide enquiry records from the existing appointments page + add permissions

**Files:**
- Modify: `src/data/appointment/appointment.ts`
- Modify: `src/constant/index.ts`

- [ ] **Step 1: Filter enquiry records out of the appointments query**

Open `src/data/appointment/appointment.ts`. Find `appointmentsQueryOptions` (around line 11) and modify the `queryFn`:

```ts
export const appointmentsQueryOptions = (user: UserType) => ({
  queryKey: ["appointments", user],
  queryFn: async () => {
    const result = await getAllAppointments(user);
    if (!result.success) throw new Error(result.message);
    // Hide enquiry-stage records — they live on /dashboard/enquiries.
    const records = (result.data ?? []) as { status?: string }[];
    return records.filter((r) => r.status !== "enquiry");
  },
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchInterval: 5 * 60 * 1000,
  retry: 3,
});
```

- [ ] **Step 2: Add enquiry permission keys**

Open `src/constant/index.ts`. Find the `PERMISSIONS` object (around line 1–21). Add four new entries inside it (anywhere before the closing `} as const;`):

```ts
ENQUIRY_VIEW: "enquiry.view",
ENQUIRY_CREATE: "enquiry.create",
ENQUIRY_EDIT: "enquiry.edit",
ENQUIRY_DELETE: "enquiry.delete",
```

Final shape:

```ts
export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",

  ENQUIRY_VIEW: "enquiry.view",
  ENQUIRY_CREATE: "enquiry.create",
  ENQUIRY_EDIT: "enquiry.edit",
  ENQUIRY_DELETE: "enquiry.delete",

  APPOINTMENT_VIEW: "appointment.view",
  APPOINTMENT_CREATE: "appointment.create",
  APPOINTMENT_EDIT: "appointment.edit",
  APPOINTMENT_DELETE: "appointment.delete",

  THERAPIST_VIEW: "therapist.view",
  THERAPIST_CREATE: "therapist.create",
  THERAPIST_EDIT: "therapist.edit",
  THERAPIST_DELETE: "therapist.delete",

  ADMIN_VIEW: "admin.view",
  ADMIN_CREATE: "admin.create",
  ADMIN_EDIT: "admin.edit",

  EXPORT_DATA: "export.data",
  USER_FORCE_LOGOUT: "user.force_logout",
  MODULE_LOCK: "module.lock",
} as const;
```

No role-permission mapping changes — all roles already get `["*"]`.

- [ ] **Step 3: Verify TS compiles + appointments page still loads**

```bash
npx tsc --noEmit
```

Expected: zero errors. Then in the running dev server, visit `/dashboard/appointments`. Confirm existing appointments still load. If you create an enquiry on `/dashboard/enquiries`, it should NOT appear here.

- [ ] **Step 4: Commit**

```bash
git add src/data/appointment/appointment.ts src/constant/index.ts
git commit -m "feat(enquiries): hide enquiry records from appointments page; add perms"
```

---

## Task 14: Manual smoke walk

**Files:** none — this is the verification step.

- [ ] **Step 1: Ensure both servers are running**

Backend at `C:\workspace\backend-mdw\` and frontend at `C:\workspace\backend-mdw\WellnessFrontend\` (npm run dev). Log in as any user with `*` permissions.

- [ ] **Step 2: Walk the 14-point smoke checklist from the spec**

For each, observe the expected behavior and note pass/fail:

1. **Intake:** Open `/dashboard/enquiries` → `+ New Enquiry` → fill Anita / 9812345678 / "9 AM" / note → Submit → row appears with "Enquiry" badge. ✅
2. **Duplicate block:** `+ New Enquiry` again with 9812345678 → toast "This phone already has an open enquiry" + Anita's detail drawer opens. No duplicate row created.
3. **Reach out toggle:** In Anita's drawer → tick "Mark as reached out" → drawer closes? (No — it stays). Re-open drawer or watch badge update to "Reached out". Refresh page → state persists.
4. **Book consult:** In drawer → pick date+time for consultation slot → row shows date/time in "Consult booked" column; badge → "Consult booked".
5. **Mark consult done:** In drawer → tick "Mark consultation done" → row's "Done" column shows green ✓; badge → "Consult done".
6. **Book physio with therapist:** In drawer → pick physio date+time → pick a therapist from dropdown → "Physio booked" column shows date/time + therapist name; badge → "Physio booked".
7. **Confirm assignment:** In drawer → tick "Confirm assignment" → "Assigned" column shows ✓; badge → "Assigned".
8. **Filter chips:** Click each chip → table narrows correctly; counts in parens match visible rows; click "All" to reset.
9. **Existing appointments page:** Open `/dashboard/appointments` → confirm Anita does NOT appear (she's an enquiry-funnel record).
10. **Delete:** In drawer → "Delete enquiry" → confirm → row vanishes from table; toast confirms.
11. **Empty state — total:** With zero enquiries, table shows "No enquiries yet. Click + New Enquiry to log one."
12. **Empty state — filter:** Create one enquiry; click "Assigned" chip → table shows "No leads in this stage."
13. **Cancellation:** Create a new enquiry → drawer → Status override → "Cancelled" → row gets red "Cancelled" badge → re-create with same phone → no longer blocked (allowed because status is cancelled).
14. **Refresh persistence:** Mid-funnel (e.g. consult done) → hard-refresh the page → all state persists.
15. **Role smoke (bonus):** If you have test users for THERAPIST and STAFF roles, log in as each → page is accessible.

- [ ] **Step 3: If anything failed, file follow-up tasks**

Don't try to fix in this plan — capture them as separate tickets/notes. Mark this step done when the walk has been completed and any failures recorded.

- [ ] **Step 4: Final commit if any tweaks were made**

If the smoke walk turned up small fixes (typos, off-by-one, missing toast), commit each as its own small fix-commit. Otherwise this task is done with no commit needed.

---

## Notes & out-of-scope reminders (do NOT implement here)

- Backend filter/pagination on `/api/appointments?status=` — frontend filters now
- Optimistic mutations on checkpoint toggles
- SMS/email on stage transitions
- Audit log of who-changed-what
- Multi-attempt reach-out tracking
- Bulk actions
- A separate `consultationTherapistId` (vs single `doctorId`)
- Automated unit / integration / e2e tests
- Refactoring existing inline `StatusBadge` definitions in `dashboard-recent-sales-table.tsx` and `appoitmentstable.tsx` into a shared component

These are tracked in the spec's "Out-of-scope for MVP" section.
