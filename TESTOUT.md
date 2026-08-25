# TESTOUT - Therapist Leave Scheduling

## Overview

This document covers testing the therapist leave scheduling feature, which has two parts:
1. **Recurring weekly off-days** (e.g., every Sunday)
2. **One-off date blocks** (e.g., vacation from Jan 15-20)

---

## Prerequisites

- Backend running locally or deployed
- Frontend running locally or deployed
- At least one therapist in the system
- Admin or Staff login credentials

---

## Test Cases

### 1. Backend API: Weekly Off-Days

**Endpoint**: `PATCH /api/therapist-leaves/week-off/:doctorId`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Set Sunday off: `PATCH /api/therapist-leaves/week-off/THR-0001` with body `{"weekOffDays": [0]}` | 200 OK, therapist updated |
| 2 | Set weekends off: `PATCH /api/therapist-leaves/week-off/THR-0001` with body `{"weekOffDays": [0, 6]}` | 200 OK, therapist updated |
| 3 | Clear all off-days: `PATCH /api/therapist-leaves/week-off/THR-0001` with body `{"weekOffDays": []}` | 200 OK, therapist available every day |
| 4 | Invalid day: `PATCH /api/therapist-leaves/week-off/THR-0001` with body `{"weekOffDays": [7]}` | 400 error (validation fails) |
| 5 | Non-existent therapist: `PATCH /api/therapist-leaves/week-off/THR-9999` with body `{"weekOffDays": [0]}` | 404 "Therapist not found" |

---

### 2. Backend API: One-Off Date Blocks

**Endpoint**: `POST /api/therapist-leaves`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Create single-day leave: `POST /api/therapist-leaves` with body `{"doctorId": "THR-0001", "startDate": "2026-03-15"}` | 201 Created, leave record returned |
| 2 | Create multi-day leave: `POST /api/therapist-leaves` with body `{"doctorId": "THR-0001", "startDate": "2026-03-20", "endDate": "2026-03-25", "reason": "Vacation"}` | 201 Created |
| 3 | Missing doctorId: `POST /api/therapist-leaves` with body `{"startDate": "2026-03-15"}` | 400 "doctorId and startDate are required" |
| 4 | List leaves: `GET /api/therapist-leaves/THR-0001` | 200 OK, array of leave records |
| 5 | Delete leave: `DELETE /api/therapist-leaves/{leaveId}` | 200 "Leave deleted" |
| 6 | Delete non-existent: `DELETE /api/therapist-leaves/nonexistent` | 404 "Leave not found" |

---

### 3. Backend: Appointment Assignment Blocking

**Endpoint**: `PUT /api/appointments/:id`

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Assign therapist on their off-day | 400 error: "Therapist is off on Sundays. Pick a different date or therapist." |
| 2 | Assign therapist during their leave block | 400 error: "Therapist is on leave from 2026-03-20 to 2026-03-25 (Vacation)." |
| 3 | Assign therapist on a regular day | 200 OK, appointment updated |
| 4 | Reassign to different therapist on the same day | 200 OK if new therapist is available |

---

### 4. Frontend: Availability Tab

**Location**: Therapist drawer > Availability tab

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open therapist drawer, click Availability tab | Tab shows weekly off-day toggles + date blocks section |
| 2 | Click "Sun" button | Button turns red, "Off on: Sun" text appears |
| 3 | Click "Sat" button | Button turns red, "Off on: Sun, Sat" text appears |
| 4 | Click "Sun" again | Button returns to gray (off-day removed) |
| 5 | Add date block: pick From date, optional To date, optional reason, click + | New block appears in list below |
| 6 | Delete a date block: click trash icon on a block | Block removed from list |
| 7 | Refresh page | Off-days and blocks persist (saved to database) |

---

### 5. Frontend: Availability Grid (Appointment Assignment)

**Location**: Appointment details > Assign Therapist card

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Pick a date that is a therapist's off-day | That therapist's row shows all slots as red with "-" markers |
| 2 | Hover over a red slot | Tooltip says "Therapist is off on this day" |
| 3 | Try to click a red slot | Nothing happens (button disabled) |
| 4 | Pick a date that is NOT an off-day | Therapist's row shows green/available slots |
| 5 | Check the legend at the bottom | Shows: "× = booked, ! = within booking gap, - = day off" |

---

### 6. Frontend: Calendar View

**Location**: Therapist calendar page

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | View calendar in week mode with a therapist who has off-days | Off-day events appear as dashed, semi-transparent blocks spanning the full day |
| 2 | Check the event color | Matches the therapist's color but lighter/transparent |
| 3 | Hover over an off-day event | Shows "Therapist Name - Off" |
| 4 | Switch to day view on an off-day | Full-day off event visible |

---

### 7. Integration: End-to-End Flow

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Admin sets therapist THR-0001 to be off every Sunday | Saved successfully |
| 2 | Admin adds a vacation block for THR-0001 from Mar 20-25 | Block appears in list |
| 3 | Staff tries to book THR-0001 on Sunday Mar 15 | Grid shows all slots red, can't click |
| 4 | Staff tries to book THR-0001 on Wednesday Mar 18 | Grid shows available slots, can book |
| 5 | Staff tries to book THR-0001 on Friday Mar 20 | Grid shows all slots red (vacation), can't click |
| 6 | Staff books THR-0001 on Thursday Mar 19 | Success, appointment created |
| 7 | Admin views calendar | Sunday shows dashed off-day event, Mar 20-25 shows vacation blocks |

---

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Therapist with no off-days set | Available every day, no slots blocked |
| Date block with same start and end date | Single-day leave, treated correctly |
| Multiple therapists off on same day | Both show as unavailable independently |
| Therapist assigned before off-days were set | Existing appointments are NOT affected (no retroactive blocking) |
| Leave block in the past | Does not affect current/future bookings |
| Empty weekOffDays array | All days available |

---

## Data Verification

After testing, verify in MongoDB:

```javascript
// Check therapist off-days
db.doctors.find({ doctorId: "THR-0001" }, { weekOffDays: 1, name: 1 })

// Check leave blocks
db.therapistleaves.find({ doctorId: "THR-0001" }).sort({ startDate: 1 })
```

---

## Notes

- Off-day validation is **server-side only** - the frontend grid is visual feedback, the backend enforces the rule
- Weekly off-days are **recurring** - they apply every week automatically
- Leave blocks are **date-range based** - a block from Mar 20-25 means unavailable on all 6 days
- Existing appointments are **not affected** when off-days are set (no retroactive changes)
- The availability check runs on **therapist assignment**, not on initial booking creation
