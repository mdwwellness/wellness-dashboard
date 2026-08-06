# MDW Wellness — System Blueprint

> **What this is.** The curated map of *what's connected to what* across the two repos —
> frontend (`WellnessFrontend`, Next.js) and backend (`WellnessBackend`, Express + Mongoose).
> For each core entity: where it's **created**, **shown**, and **mutated**, the one **service that owns it**,
> and a **change-checklist** so a change reaches *every* side. This is the anti-"missing-side-details" doc.
>
> **How to use it.** Before changing an entity, read its Change-checklist — it lists every place to touch.
> Hand-maintained (I update it when we change an entity); cross-check against the Graphify graph for drift.
> Companion to [`KANBAN.md`](KANBAN.md) (the *what to do*); this is the *where it lives*.
>
> _Last swept: 2026-07-13 · Frontend `C:\workspace\backend-mdw\WellnessFrontend` · Backend `C:\workspace\WellnessBackend`_

---

## How the two sides talk

- **Frontend → backend:** every call goes through `fetchWithAuth()` — `src/lib/fetchwithauth.ts`.
  Base URL from `src/constant/index.ts` (`BACKEND_BASE_URL || BACKEND_BASE_URL_LOCAL || http://localhost:10000`).
  Auth = JWT in cookies (`accessToken`/`refreshToken`), auto-refresh on 401.
- **Frontend data layer:** TanStack Query. Keys: `["appointments",user]`, `["enquiries",user]`, `["customers",user]`,
  `["invoices"]`, `["services"]`, `["therapists"]`. Appointment/enquiry mutations invalidate all three of
  appointments/enquiries/invoices to keep views in sync.
- **Backend shape:** `route → controller → lib service (funnel) → Mongoose model`.
  Auth via `userAuth` (JWT) on every route **except** `POST /api/appointments/public` and `POST /api/users/login`.
  Roles checked **inline** in controllers (`BACK_OFFICE_ROLES = SUPER_ADMIN, ADMIN, STAFF, CUSTOMER_CARE`);
  `middlewares/requireRole.ts` exists but is **not wired** (see Watch-list #3).
- **Human-readable IDs** via `lib/counters.ts` atomic sequences: `CUST-####`, `ENQ-####`, `SRV-####`, `THR-####`, `INV-YYYY-####`.

---

## Customer

**Owned by →** `lib/invoiceGeneration.ts :: ensureCustomerForAppointment` (auto, on every appointment create/update).
Manual roster path: `customerController.createCustomer`. Both allocate via `nextSequence("customer")`.
**Identity key = `phone`** (not name). `customer_id` = `CUST-####`.

**Created by**
- _Backend (auto funnel):_ `ensureCustomerForAppointment` — `lib/invoiceGeneration.ts:46` (finds by phone, else `new Customer`), also reused by `createManualInvoice` — `:628`.
- _Backend (manual roster):_ `createCustomer` — `controllers/customerController.ts:53` → `POST /api/customers` (userAuth).
- _Frontend:_ **no standalone create form.** Born implicitly through appointment/enquiry (name/phone on the booking) and inline in invoice creation (`create-invoice-sheet.tsx`). Action `src/actions/customers/create-customer.ts` (POST /api/customers) exists but has no dedicated UI.

**Shown on**
- Customers page `src/components/pages/customers/CustomersPage.tsx` (+ `customers-columns.tsx`) — **derived** customers, grouped by phone, merged with persisted `/api/customers` in `src/data/customer/customer.ts:47`.
- `customer-detail-drawer.tsx` · `RecordIds` (Customer ID) — `src/components/pages/appointment/record-ids.tsx`.
- Backend read: `getCustomers` `controllers/customerController.ts:21`, `getCustomerById` `:105`.

**Mutated by**
- _Backend:_ `updateCustomer` — `controllers/customerController.ts:118` → `PATCH /api/customers/:customerId` (name/email/address).
- _Frontend:_ **no dedicated update UI** — customer fields ride along on `PUT /api/appointments/:id` from the enquiry/appointment drawers.

**Change-checklist — adding a field to Customer**
1. `WellnessBackend/models/customerModel.ts`
2. `ensureCustomerForAppointment` (set on create) **+** `createCustomer` **+** `updateCustomer`
3. Frontend type: `src/type/customer-record.ts` (`PersistedCustomer` / `CreateCustomerInput`) **+** derived `Customer` in `src/data/customer/customer.ts`
4. Display: `customer-detail-drawer.tsx`, `customers-columns.tsx`, `RecordIds` (if an ID-level field)
5. Invoice snapshot (`invoiceModel.ts` customer_* + `createInvoiceFromAppointment`) if it should appear on bills

---

## Appointment / Enquiry  _(one model: `AppointmentBooking`, split by `status`)_

`status ∈ enquiry · scheduled · ongoing · completed · cancelled`. `enquiryId` = `ENQ-####`.
**Owned by (creation) →** `lib/bookingService.ts :: createBooking` — the **only** sanctioned birth path.
It runs guards (name/phone, past-date, double-booking) then side-effects **`ensureCustomerForAppointment`** + **`maybeCreateInvoiceForAppointment`**.

**Created by**
- _Backend entry points (both funnel through `createBooking`):_
  - `addAppointmentsDetails` — `controllers/appointmentController.ts:29` (source `dashboard`)
  - `addPublicEnquiry` — `controllers/appointmentController.ts:598` (source `public_booking_form`, `foldOpenRepeats`)
  - `createBooking` — `lib/bookingService.ts:45` (`new AppointmentBooking` `:136`, `.save()` `:143`, side-effects `:151`–`:152`)
- _Frontend (both → `POST /api/appointments`, same endpoint, different default status):_
  - `EnquiryIntakeModal` — `src/components/pages/enquiries/enquiry-intake-modal.tsx` → `useCreateEnquiry` (status `enquiry`)
  - `AppointmentBookingForm` — `src/components/pages/appointment/appointmentbookingform.tsx` → `useBookAppointment` (status `scheduled`)

**Shown on**
- Enquiries: `EnquiriesPage.tsx` (status enquiry/scheduled/ongoing) · `enquiry-detail-drawer.tsx` (auto-save on blur, `useUpdateAppointment({silent})`)
- Appointments: `AppointmentBookingpage.tsx` (excludes `enquiry` + `recommended`) · `appointments-details-page.tsx`
- Shared: `RecordIds` (Booking/Customer/Therapist ID + status) · `AppointmentStatusBadge` (`src/components/status-badge.tsx`) · dashboard `HomePageAnalytics.tsx`
- Backend read: `getAllAppointments` `controllers/appointmentController.ts:66` (role-filtered: back-office = all, therapist = own `doctorId`)

**Mutated by**  _(all in-place — **not** via `createBooking**; correct by design)_
- `updateAppointment` — `appointmentController.ts:536` (`findByIdAndUpdate` + `safeSyncInvoiceFromAppointment` `:563`) ← `PUT /api/appointments/:id`
- `addAppointmentRecommendation` — `:142` (`$push` add-on) — **⚠ no invoice sync**, see Watch-list #1 ← `POST …/recommendations`
- `confirmAppointmentRecommendation` — `:243` (+ sync `:311`) ← `POST …/recommendations/confirm`
- `setAddonPaymentStatus` — `:327` (+ sync `:401`) ← `POST …/recommendations/payment`
- `completeSession` — `:417` (atomic ceiling-guarded increment + `lockConfirmedAddonsToInvoice` `:486` + sync `:520`) ← `POST …/complete-session`
- `deleteAppointment` — `:118` ← `DELETE /api/appointments/:id`. Soft-cancel = `updateAppointment` with `status:"cancelled"`.
- _Invoice side-effect:_ `syncInvoiceFromAppointment` — `lib/invoiceGeneration.ts:425` (recalcs line_items/totals, regenerates PDF), via `safeSyncInvoiceFromAppointment` wrapper.

**Change-checklist — adding a field to a booking**
1. `WellnessBackend/models/appointmentsBookingModel.ts`
2. `createBooking` (accept + set it) — `lib/bookingService.ts`
3. If it affects billing → `createInvoiceFromAppointment` **+** `syncInvoiceFromAppointment`
4. Frontend type: `src/type/schema.ts` (`enquirySchema` / `EnquiryType` = `slotBookingZodType`)
5. Create forms: `enquiry-intake-modal.tsx` **and/or** `appointmentbookingform.tsx`
6. Display: `enquiry-detail-drawer.tsx`, `appointments-details-page.tsx`, columns, `RecordIds`
7. Mutation: `src/actions/appointments/update-appointment.ts` (+ specific action if it has its own endpoint)

---

## Invoice

**Owned by →** `lib/invoiceGeneration.ts`. Auto: `maybeCreateInvoiceForAppointment:155` → `createInvoiceFromAppointment:305`.
Manual: `createManualInvoice:607`. `invoice_id` = `INV-YYYY-####`. `appointment_id` is **unique** (idempotency guard).
`syncInvoiceFromAppointment` keeps it in lock-step with its appointment; `locked_addon_items` preserve paid add-ons after `recommendedServices` is cleared.

**Created by**
- _Backend auto:_ fired by `createBooking` / `updateAppointment` when `shouldAutoGenerateInvoice` — `lib/invoiceGeneration.ts:102`.
- _Backend manual:_ `createInvoice` — `controllers/invoiceController.ts:159` → `createManualInvoice` ← `POST /api/invoices`.
- _Frontend:_ `create-invoice-sheet.tsx` → `useCreateInvoice` ← `POST /api/invoices`.

**Shown on**
- `InvoicesPage.tsx` (+ `makeInvoiceColumns`) · `invoice-detail-drawer.tsx` (line-items editor, void) · **PDF** `lib/invoicePdf.ts` (+ `lib/mdwLogo.ts`)
- Backend read (back-office only): `getInvoices` `:17`, `getInvoice` `:52`.

**Mutated by**
- `updateInvoice` — `controllers/invoiceController.ts:68` (recalcs totals, invalidates PDF) ← `PATCH /api/invoices/:id`
- `voidInvoice` — `:129` (soft-void, keeps audit) ← `POST /api/invoices/:id/void`
- `generateInvoicePdf` — `:195` (pdfkit → UploadThing) ← `POST /api/invoices/:id/pdf`
- _Frontend actions:_ `update-invoice.ts`, `void-invoice.ts`, `generate-invoice-pdf.ts`

**Change-checklist — adding a field to Invoice**
1. `WellnessBackend/models/invoiceModel.ts`
2. `createInvoiceFromAppointment` **+** `createManualInvoice` (set it)
3. `syncInvoiceFromAppointment` (keep it fresh on appointment changes)
4. `lib/invoicePdf.ts` if it appears on the PDF
5. Frontend type `src/type/invoice.ts` (`PersistedInvoice`)
6. `invoice-detail-drawer.tsx` + invoice columns
7. `create-invoice-sheet.tsx` if user-entered

---

## Service

**Backend:** `addService` `controllers/serviceController.ts:15` · `getServices:50` · `updateService:59` (serviceId immutable) · `deleteService:90` (blocks delete if referenced).
**Frontend:** `add-service-form.tsx` (POST /api/services) · `ServicesPage.tsx` + `services-columns.tsx` + `service-detail-drawer.tsx` · actions `add/update/delete-service`, `get-all-services`.
**Consumed by:** appointment form (service dropdown), enquiry drawer, invoice line items.
**Type:** `ServiceFormType` / `ServiceType` — `src/type/schema.ts`. Fields incl. `price`, **`recommendedPrice`** (already exists → KANBAN T17), `category`, `isPackage`, `packageUnit`, `packageCount`, `serviceId` (`SRV-####`).

**Change-checklist — adding a field to Service**
1. `WellnessBackend/models/serviceModel.ts` → 2. `addService` + `updateService`
3. Frontend `src/type/schema.ts` (`ServiceFormType`) → 4. `add-service-form.tsx` + `services-columns.tsx` + `service-detail-drawer.tsx`
5. Consumers: appointment form, invoice line-item builder

---

## Therapist  _(model: `Doctor`, linked to a `User` login)_

**Backend:** `addDoctor` `controllers/DoctorController.ts:12` (creates **User** `:50` + **Doctor** `:66` atomically; rollback deletes User `:74`) · `getDoctors:95` · `getPersonalAppointments:119` · `updateDoctorDetails:146` · `deleteDoctor:168` (deactivates User instead of hard-delete).
**Frontend:** `adddoctorform.tsx` (POST /api/therapist) · `AllTherapistPage.tsx` + `doctorslisttable.tsx` + `therapist-detail-drawer.tsx` + `therapist-details-page.tsx` · actions `add/update/delete-therapist`, `get-all-therapist`.
**Consumed by:** appointment form (gender-filtered dropdown), enquiry drawer (assignment), invoice (`therapist_name`).
**Type:** `TherapistformType` — `src/type/schema.ts:255`. Fields: `doctorId` (`THR-####`), `userId`→User, `gender`, `specialization[]`, `isActive`, `bio`, `profileImage`, `certificates[]`.

**Change-checklist — adding a field to Therapist**
1. `WellnessBackend/models/doctorsModel.ts` (+ `userModel.ts` if login-related) → 2. `addDoctor` + `updateDoctorDetails`
3. Frontend `src/type/schema.ts` (`TherapistformType`) → 4. `adddoctorform.tsx` + `doctorslisttable.tsx` + therapist drawers
5. Consumers: appointment form, enquiry assignment, invoice `therapist_name`

---

## Shared / canonical components  _(change once, lands everywhere)_

| Component | File | Consumed by |
|---|---|---|
| `AppointmentStatusBadge` | `src/components/status-badge.tsx` | every appointment/enquiry surface |
| `RecordIds` | `src/components/pages/appointment/record-ids.tsx` | appointment + enquiry drawers, appts table |
| `RefreshButton` | `src/components/refresh-button.tsx` | all six list pages |
| `EnquiryIntakeModal` | `src/components/pages/enquiries/enquiry-intake-modal.tsx` | enquiries page, customer drawer |
| `CustomerSearchField` | `src/components/pages/invoices/customer-search-field.tsx` | invoice create, appointment form |

---

## Watch-list — divergence & known gaps

1. **⚠ Add-on doesn't refresh the invoice.** `addAppointmentRecommendation` (`appointmentController.ts:207`) `$push`es the add-on but never calls `syncInvoiceFromAppointment`, so it won't appear on the invoice until a later confirm/pay/complete. Every *other* money-touching mutation syncs.
2. **Customer exists in 3 shapes** — derived-by-phone, persisted `/api/customers`, and inline-on-booking. A phone typo splits one customer into two. Mitigated by the merge in `src/data/customer/customer.ts`.
3. **`requireRole` is dead code** — `middlewares/requireRole.ts` is defined but no route uses it; roles are enforced inline. This is the hook to wire for the access-control tasks (KANBAN T3/T4).
4. **Therapist name is free-text on the invoice** (`therapist_name`) vs. the canonical therapist list → spelling drift.
5. **Two booking birth flows, one endpoint** — enquiry modal (`enquiry`) vs. booking form (`scheduled`), both `POST /api/appointments`; kept consistent by query invalidation.
6. **`addDoctor` isn't idempotent** — a failed `Doctor.save()` after `User.save()` relies on best-effort rollback (`:74`); a rollback failure orphans the User.

## Invariants — keep these true

- An appointment is **only** born in `createBooking`. Never `new AppointmentBooking(...)` in a controller.
- A customer is **only** born in `ensureCustomerForAppointment` (auto) or `createCustomer` (manual roster).
- An invoice is **only** born in `maybeCreateInvoiceForAppointment` (auto) or `createManualInvoice` (manual).
- Any appointment mutation that touches money calls `safeSyncInvoiceFromAppointment` — the one current exception is Watch-list #1.
