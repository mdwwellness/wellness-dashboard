# Your Wellness Dashboard — Owner's Guide

A plain-English tour of the back-office website your team uses to run
the business. No technical knowledge required.

---

## What this dashboard is, in one paragraph

This is a **private website** that you and your team log into to manage
your wellness business. It tracks **enquiries** (people who reached out
but haven't booked yet), **appointments** (confirmed bookings and
sessions), **therapists** (who works for you and what they do), and
**staff accounts** (who can log into the dashboard).

Your customers **never see this dashboard.** They reach out to you via
WhatsApp, phone, or walk-in. Your team uses the dashboard to track them
from "interested" all the way through "regular customer."

---

## Who logs in and what they can do

When you create someone's account, you assign them a **role**. The role
determines what they can do. Think of it like job titles inside the
system.

| Role | Who this is in real life |
|---|---|
| **Super Admin** | You, the owner. Can do everything. |
| **Admin** | A trusted senior manager. Full access, same as Super Admin in practice. |
| **Staff** | Your day-to-day office staff. Handle bookings and leads. |
| **Customer Care** | The executives who answer WhatsApp and convert leads. The Enquiries screen is built for them. |
| **Therapist** | Your therapists. They only see their own appointments. They can't see other therapists' schedules or your business numbers. |

You create staff accounts on the **Settings** screen.

---

## The five screens

The dashboard has five main areas. Icons for them are on the left side
of the screen. They are:

### 1. Home — your business at a glance

**The address:** `/dashboard`

**What's here:**
- Four big number cards: total therapists, active therapists, total
  patients, total appointments
- A list of recent appointments at the bottom

**What you can do here:**
Look at the numbers. That's it — this screen is read-only.

**When to open:**
- Mornings, for a 30-second business pulse check
- Before a meeting where you need quick numbers
- Weekly review

**Designed for:** You and your senior managers. Therapists and front-line
staff won't get much from this screen — they live in other places.

---

### 2. Enquiries — your leads pipeline (NEW)

**The address:** `/dashboard/enquiries`

**What's here:**
Every customer who's reached out to you, organized by how far along
they are in your sales/booking process. Coloured chips at the top
show how many leads are at each stage:

- **Enquiry** — just got in touch, no contact yet
- **Reached out** — your team has called/messaged them
- **Consult booked** — they have an online consultation scheduled
- **Consult done** — consultation happened
- **Physio booked** — they have a physio session scheduled
- **Assigned** — therapist confirmed and locked in (this is the success state)
- **Cancelled** — the lead didn't convert

**What you can do here:**

- **Log a new lead** the moment someone reaches out (WhatsApp, phone,
  walk-in). Click `+ New Enquiry`, fill in their name, phone, and when
  they want to be called back.
- **Move a lead forward** by clicking on it to open the side panel,
  then:
  1. Tick "Mark as reached out" once you've called them
  2. Book their online consultation (date and time)
  3. Tick "Mark consultation done" after the consult happens
  4. Book their physio session and pick which therapist
  5. Verify the therapist is actually free, then tick "Confirm
     assignment"
- **Edit lead details** (their name, phone, email, age, location, notes)
- **Cancel a lead** that didn't convert
- **Delete a record** that was a mistake

**When to open:**
- **First thing in the morning** — check overnight WhatsApp enquiries
  and log them
- **Throughout the day** — move leads to their next step
- **End of day** — make sure nothing is stuck. A lead sitting in
  "Reached out" for 3 days means someone forgot to follow up.

**Designed for:** Your **Customer Care** team. This is where they spend
most of their day. Admins can use it too. Therapists don't need it.

**Important quirk:** A new lead stays on this Enquiries screen the whole
way through the funnel — even after they're "Assigned." It does NOT
automatically appear on the Appointments screen. If you want it to show
up there too, someone has to manually change the lead's Status from
"enquiry" to "scheduled" using the Status dropdown in the lead's side
panel.

---

### 3. Appointments — confirmed bookings only

**The address:** `/dashboard/appointments`

**What's here:**
Every confirmed booking — consultations and physio sessions that are on
the calendar. **Enquiry-stage leads are NOT shown here** — they're on
the Enquiries screen.

**What you can do here:**

- **Book an appointment directly** with a full form (skipping the
  enquiry funnel) — use this when a customer walks in or calls already
  knowing what they want
- **Search and filter** appointments by category, name, etc.
- **Edit any appointment** — change time, mark as ongoing/completed,
  edit notes
- **Delete** an appointment

**When to open:**
- When a customer is ready to book RIGHT NOW with no back-and-forth
- To see today's confirmed schedule
- To update a session as it's happening or after it's done

**Designed for:** Everyone on the back-office team. **Therapists log in
and see only their own appointments** here.

---

### 4. Therapist List — your team of therapists

**The address:** `/dashboard/alltherapist`

**What's here:**
Every therapist you have, with their specializations, contact details,
and whether they're currently active.

**What you can do here:**

- **Add a new therapist** — name, ID code, email, phone, gender, what
  therapies they do (multi-select), their bio
- **Edit** an existing therapist's details
- **Deactivate** a therapist — keeps their record and history but hides
  them from "active" counts (use this when someone leaves but you want
  to keep records)
- **Delete** a therapist (only if you really want their history gone)
- **See per-therapist appointments** by clicking into them

**When to open:**
- Onboarding a new therapist
- A therapist changed their phone, email, or specialization
- Someone left — deactivate them
- You need to look up a therapist's specialty

**Designed for:** You and your admins. Therapists don't manage other
therapists.

**Important — TWO STEPS for a new therapist who needs to log in:**

If you hire a therapist and they need to log into the dashboard
themselves (to see their own schedule), you have to do TWO things:
1. **Therapist List → Add Therapist** — creates them in the directory
2. **Settings → Add User** with role "Therapist" — creates their login

The **email must be EXACTLY the same** on both. If the emails don't
match, the therapist will log in fine but will see an empty appointment
list, because the system uses the email to match the two records.

---

### 5. Settings — your profile and staff accounts

**The address:** `/dashboard/settings`

**What's here:**
Two sections:
1. **Your profile** — your name, email, phone, password, date of birth
2. **Staff user management** — list of everyone who can log into the
   dashboard (visible to admins)

**What you can do here:**

- **Your profile**: update your details, change your password
- **Staff section** (for admins):
  - **Add a new staff member** — name, email, phone, password, role
  - **Edit** an existing staff member's details or role
  - **Delete** a staff member

**When to open:**
- Hiring someone — create their login here
- Someone left — delete their account
- Promoting someone — change their role
- Changing your own password

**Designed for:** The profile section is for everyone. The staff
management section should only be used by Super Admin / Admin (though
right now the system doesn't strictly enforce this — see "Things to
watch out for" below).

---

## A day in the life — how a customer flows through your business

```
Sunday 11 PM:
  Customer "Anita" sends a WhatsApp to your business:
  "hi, I have lower back pain, can I get a session?"

Monday 8:30 AM:
  Your Customer Care opens /dashboard/enquiries
  → + New Enquiry
  → Name: Anita / Phone: 9812345678 / Preferred: 9 AM - 11 AM
  → Anita's row appears with yellow "Enquiry" chip

Monday 10:00 AM:
  Customer Care calls Anita
  → Anita: "yes please, can I get an online consult tomorrow?"
  → CC opens Anita's row, in the side panel:
     • Tick "Mark as reached out" → chip turns blue "Reached out"
     • Pick date + time for consultation → chip turns indigo "Consult booked"

Tuesday 11:30 AM:
  Online consultation happens. Doctor says Anita needs 4 physio sessions.
  → CC opens Anita's row:
     • Tick "Mark consultation done" → chip turns green "Consult done"
     • Pick physio date + time, assign Dr. Reddy → chip turns pink "Physio booked"

Tuesday 12:00 PM:
  CC calls Dr. Reddy to confirm she's actually free at that time.
  → Dr. Reddy: "yes I'm free, book it"
  → CC opens Anita's row, ticks "Confirm assignment"
  → Chip turns dark green "Assigned" — funnel complete!

Going forward:
  The 4 physio sessions can be tracked on /dashboard/appointments
  (after CC changes Anita's status from "enquiry" to "scheduled").
```

---

## What you (the owner) should personally check, weekly

You don't need to do operational work — that's what the team is for —
but checking these once a week keeps a pulse on the business:

| What | Where | What it tells you |
|---|---|---|
| Total new leads this week | Enquiries → "All" chip number, compared to last week | Are inquiries growing? |
| Lead conversion | "Assigned" chip vs "Enquiry" + "Reached out" chips | Where's your funnel leaking? |
| Stale leads | Click each chip, sort by oldest, look for week-old entries | Customer Care needs nudging if there are old "Reached out" leads with no consultation booked |
| Active therapists | Home → "Active Doctors" card | Matches your actual headcount? |
| Appointments this month | Home → "Total Appointments" card | Growth check |
| Cancelled leads | Enquiries → "Cancelled" chip | High cancellation rate = quality issue with leads or your team's handling |

---

## What to do when something breaks

If you or anyone on your team sees an error message — examples:

- "Forbidden" / "Role not allowed"
- "Missing required fields"
- A blank screen where there should be data
- An action that seems to do nothing

**Do these three things:**
1. **Take a screenshot** showing the error and the URL bar
2. **Note exactly what you were clicking** when it happened
3. **Send to your developer** with both

A few things that are **normal, not errors**:
- **First page loads slowly (15-30 seconds)** after a while of nobody
  using it. The server "wakes up" — it's hosted on a service called
  Render that sleeps when idle. Subsequent pages are fast.
- **Numbers don't update immediately** in another tab — refresh that
  tab and the latest data will appear.

---

## Things to watch out for (talk to your developer about these)

Your developer is aware of these — they're listed in the engineering
documentation under "known issues." If you decide to grow the team or
go to production with more traffic, these should be addressed:

| Issue | What it means for the business |
|---|---|
| Any logged-in staff member can technically delete or create user accounts | Right now the system doesn't check who's allowed to add/delete staff. A junior staff member could accidentally (or maliciously) delete another user. Fix before you have more than 3-4 staff. |
| Password-reset flow isn't built yet | If someone forgets their password, you (or your developer) have to reset it manually. Add a "forgot password" flow when you have time. |
| No audit log | If someone deletes a record or changes a status, you can't see who did it or when. Not a problem for a small team; matters more as you grow. |
| Lead doesn't auto-appear on Appointments | After a lead is "Assigned" on Enquiries, the system doesn't automatically also list it on Appointments. Someone has to manually flip the status. Workflow improvement worth making. |

---

## Quick glossary

| Word | What it means in plain English |
|---|---|
| **Lead / Enquiry** | A customer who showed interest but hasn't booked yet |
| **Funnel** | The step-by-step journey from "enquired" to "regular paying customer" |
| **Slot** | A specific date and time for a session |
| **Status** | Where a record is in its life: enquiry → scheduled → ongoing → completed (or cancelled) |
| **Role** | The job title inside the system that determines what someone can do |
| **Dashboard** | This whole website you log into |
| **Backend** | The server that stores all the data. Hosted on a service called Render. You don't interact with it directly. |
| **Frontend** | Same thing as "dashboard" in everyday language — what your browser shows you |

---

If anything in this guide is unclear, ask your developer to update it.
This document lives at `WellnessFrontend/docs/team/owner-guide.md` in
the code repository.
