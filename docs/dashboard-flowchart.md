# MDW Wellness Dashboard - Flowcharts

Backend API: WellnessBackend on Render

Base URL: `https://wellness-backend-1-wya5.onrender.com`

All diagrams below use GitHub-safe Mermaid syntax: quoted labels only, no slash-shaped nodes, no special node shapes.

---

## 1. App entry and authentication

```mermaid
graph TD
    A["User opens app"] --> B{"Has refreshToken cookie?"}
    B -->|"No"| C["Login page"]
    B -->|"Yes"| D{"accessToken valid?"}
    D -->|"Yes"| E["Enter dashboard"]
    D -->|"No or expired"| F["Refresh token API call"]
    F -->|"Success"| G["Set new accessToken cookie"]
    G --> E
    F -->|"Fail"| H["Clear cookies"]
    H --> C
    C --> I["Staff enters email and password"]
    I --> J["Login API via server action"]
    J -->|"Success"| K["Set access and refresh cookies"]
    K --> L["Store user in auth store"]
    L --> E
    J -->|"Fail"| C
```

---

## 2. Dashboard shell and role-based navigation

```mermaid
graph TD
    E["Enter dashboard"] --> R{"User role?"}
    R -->|"Therapist"| TNav["Sidebar: Dashboard and Book Slot only"]
    R -->|"Admin or Staff"| FNav["Full sidebar navigation"]
    TNav --> TGuard{"Route allowed?"}
    TGuard -->|"Allowed routes"| TPage["Show page"]
    TGuard -->|"Blocked route"| TRedirect["Redirect to appointments"]
    FNav --> FPage["Show any dashboard page"]
    FPage --> Pages["Dashboard pages"]
    TPage --> Pages
    Pages --> P1["Home analytics"]
    Pages --> P2["Enquiries"]
    Pages --> P3["Follow-ups"]
    Pages --> P4["Customers"]
    Pages --> P5["Services"]
    Pages --> P6["Appointments Book Slot"]
    Pages --> P7["Therapists"]
    Pages --> P8["Settings"]
```

---

## 3. Data layer

```mermaid
graph TD
    UI["Page drawer or form"] --> Hook["TanStack Query hook"]
    Hook --> Action["Server action"]
    Action --> Auth["fetchWithAuth"]
    Auth --> API["WellnessBackend API"]
    API --> Mongo["MongoDB"]
    Mongo --> API
    API --> Action
    Action --> Hook
    Hook --> UI
    UI --> Toast["Toast notification"]
```

| Domain | Frontend hook | Backend endpoint |
|--------|---------------|------------------|
| Enquiries / Appointments | useGetAllEnquiries, useGetAllAppointments | GET api appointments |
| Create lead / book slot | useCreateEnquiry, useBookAppointment | POST api appointments |
| Update funnel / checklist | useUpdateAppointment | PATCH api appointments by id |
| Services | useGetServices | GET api services |
| Therapists | useGetAllTherapist | GET api therapists |
| Staff users | useGetAllUsers | GET api users getallusers |
| Login / refresh | login action, middleware | POST api users login and refresh |
| Customers | useGetCustomers client-side | GET api appointments grouped by phone |
| Dashboard KPIs | derived in components | enquiries therapists services lists |

---

## 4. Lead sources

```mermaid
graph TD
    S1["Public patient site"] -->|"Booking form"| BE["Create appointment API"]
    S2["New Enquiry modal"] -->|"Staff intake"| BE
    S3["Book Slot form"] -->|"Staff booking"| BE
    S4["Recommend a service"] -->|"Therapist follow-up"| BE
    S5["Book new session"] -->|"Customer drawer"| BE
    BE --> DB["MongoDB"]
    DB --> ENQ["Enquiries table"]
    DB --> APPT["Appointments table"]
    DB --> CUST["Customers view"]
```

---

## 5. Enquiry funnel

```mermaid
graph TD
    Start["New lead"] --> E1["Enquiry untouched"]
    E1 -->|"No answer"| FU["Follow-up"]
    FU --> FUPage["Follow-ups page"]
    FU -->|"Connected"| E2["Reached out"]
    E1 -->|"Reached out"| E2
    E2 --> E3["Consult booked"]
    E3 --> E4["Consult done"]
    E4 --> E5["Physio booked"]
    E5 --> E6["Assigned"]
    E6 --> E7["Payment recorded"]
    E7 --> E8["Ongoing"]
    E8 --> E9["Completed"]
    E1 -->|"Cancel"| CX["Cancelled"]
    E2 --> CX
    E3 --> CX
    E4 --> CX
    E5 --> CX
    E6 --> CX
    E7 --> CX
    E8 --> CX
```

---

## 6. Enquiries page

```mermaid
graph TD
    EP["Enquiries page"] --> Split{"Lead status?"}
    Split -->|"Not reached"| Top["Needs first contact"]
    Split -->|"Engaged"| Bottom["Attended in progress"]
    Top -->|"Row click"| Drawer["Detail drawer"]
    Bottom -->|"Row click"| Drawer
    Top -->|"Stale 24h"| Amber1["Amber highlight"]
    Bottom -->|"Stale 48h"| Amber2["Amber highlight"]
    EP --> NewBtn["New Enquiry"]
    NewBtn --> Modal["Intake modal"]
    Modal --> Dup{"Duplicate phone?"}
    Dup -->|"Yes"| Block["Block with error"]
    Dup -->|"No"| Create["Create appointment"]
    Create --> Top
    Drawer --> Stepper["Funnel stepper"]
    Drawer --> Slots["Slot pickers"]
    Drawer --> Pay["Payment section"]
    Drawer --> Log["Activity log"]
    Drawer --> Save["Auto-save PATCH"]
```

---

## 7. Appointments page

```mermaid
graph TD
    AP["Appointments page"] --> Role{"User role?"}
    Role -->|"Therapist"| Own["Own appointments only"]
    Role -->|"Staff"| All["All appointments"]
    AP --> BookBtn["Book Slot"]
    BookBtn --> BookForm["Booking form"]
    BookForm --> PostAppt["Create appointment"]
    AP -->|"Row click"| ApptDrawer["Detail drawer"]
    ApptDrawer --> Info["Patient and slot info"]
    ApptDrawer --> Rec["Recommend service"]
    Rec --> PickSvc["Pick from catalogue"]
    PickSvc --> Quote["Set quoted price"]
    Quote --> BookRec["Book recommended"]
    ApptDrawer --> Checklist["Work checklist"]
    Checklist --> C1["Arrived"]
    Checklist --> C2["Service performed"]
    Checklist --> C3["Payment collected"]
    Checklist --> C4["Work completed"]
    Checklist --> ActLog["Activity log entry"]
    ActLog --> Patch["Update appointment"]
```

---

## 8. Customers page

```mermaid
graph TD
    CP["Customers page"] --> Fetch["Fetch appointments"]
    Fetch --> Group["Group by phone"]
    Group --> KPI["Four stat cards"]
    KPI --> K1["Total Customers"]
    KPI --> K2["Total Bookings"]
    KPI --> K3["Bookings This Month"]
    KPI --> K4["Returning Customers"]
    Group --> Table["Customer table"]
    Table -->|"Row click"| CD["Detail drawer"]
    CD --> History["Booking history"]
    CD --> BookNew["Book new session"]
    BookNew --> Intake["Intake modal prefilled"]
    Intake --> NewLead["New enquiry created"]
```

---

## 9. Services and therapists

```mermaid
graph TD
    subgraph sgServices ["Services"]
        SV["List services"] -->|"GET"| SAPI["Services API"]
        SV --> Add["Add service"]
        Add -->|"POST"| SAPI
        SV --> SD["Edit or delete"]
        SD -->|"PUT DELETE"| SAPI
        Add --> Pkg{"Is package?"}
        Pkg -->|"Yes"| PkgFields["Package count and unit"]
        Pkg -->|"No"| StdFields["Price HSN category"]
    end
    subgraph sgTherapists ["Therapists"]
        TH["List therapists"] -->|"GET"| TAPI["Therapists API"]
        TH --> AddT["Add therapist"]
        AddT -->|"POST"| TAPI
        AddT --> THRID["Auto therapist ID"]
        AddT --> Upload["Upload profile and certs"]
        TH --> TD["Detail drawer"]
        TD -->|"PATCH"| TAPI
    end
```

---

## 10. Settings

```mermaid
graph TD
    ST["Settings page"] --> Tabs{"Section"}
    Tabs --> Profile["Edit profile"]
    Tabs --> Users["Staff list"]
    Profile -->|"PATCH"| UAPI["Update profile API"]
    Users --> AddU["Add user"]
    AddU -->|"POST"| UAPI2["Register user API"]
    Users --> Del["Delete user"]
    Del -->|"DELETE"| UAPI3["Delete user API"]
    Users --> Note["Therapists added via Therapist page"]
```

---

## 11. End-to-end journey

```mermaid
graph TD
    A["Public booking"] --> B["Lead in Enquiries"]
    B --> C["Open enquiry drawer"]
    C --> D["Reach out"]
    D --> E["Book consult slot"]
    E --> F["Consult done"]
    F --> G["Book physio slot"]
    G --> H["Confirm assignment"]
    H --> I["Record payment"]
    I --> J["Status Ongoing"]
    J --> K["Therapist sees appointment"]
    K --> L["Complete checklist"]
    L --> M["Status Completed"]
    M --> N["Visible in Customers"]
```

---

## 12. Planned invoice flow

```mermaid
graph TD
    P1["Appointment or Customer drawer"] --> P2["Invoice modal"]
    P2 --> P3["Pre-fill line items"]
    P3 --> P4{"Apply discount?"}
    P4 -->|"Recommended"| P5["Use recommended price"]
    P4 -->|"Manual"| P6["Staff discount"]
    P4 -->|"Coupon"| P7["Validate coupon API"]
    P7 --> P8["Apply coupon"]
    P5 --> P9["Create invoice API"]
    P6 --> P9
    P8 --> P9
    P9 --> P10["Invoice issued"]
```
