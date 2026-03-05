# Ongoing Events

## What was added

- A dedicated `Ongoing Events` page for:
  - `student`
  - `student-ssg`
  - `student-ssg-eventorganizer`
- New menu entries for the same roles
- New dashboard and home-card links for the same roles
- Direct attendance actions from the ongoing-events page for roles that can record attendance

## Page behavior

File:
- `Frontend/src/pages/OngoingEvents.tsx`

This page:
- fetches only events with status `ongoing`
- keeps the same table layout and styling used by `UpcomingEvents`
- adds attendance action buttons when the role can manage attendance

## New routes

Added in `Frontend/src/App.tsx`:

- `/student_ongoing_events`
- `/studentssg_ongoing_events`
- `/student_ssg_eventorganizer_ongoing_events`

Also fixed:

- `student_ssg_eventorganizer` had a duplicate manual-attendance route
- `Manage Attendance` now uses:
  - `/student_ssg_eventorganizer_manage_attendance`

## Attendance actions

From the ongoing-events table:

- `student`
  - `Present`
- `student-ssg`
  - `Manual Attendance`
  - `Face Scan`
- `student-ssg-eventorganizer`
  - `Manual Attendance`

These buttons open the attendance page with the event already selected through:

- `?eventId=<event_id>`

For `student`, the `Present` button calls:

- `POST /attendance/self-check-in`

That endpoint:
- uses the logged-in student's own profile
- marks the student as `present`
- only accepts ongoing events
- prevents duplicate attendance records for the same event

## Files updated

- `Frontend/src/pages/OngoingEvents.tsx`
- `Frontend/src/App.tsx`
- `Frontend/src/components/NavbarStudent.tsx`
- `Frontend/src/components/NavbarStudentSSG.tsx`
- `Frontend/src/components/NavbarStudentSSGEventOrganizer.tsx`
- `Frontend/src/dashboard/StudentDashboard.tsx`
- `Frontend/src/dashboard/StudentSsgDashboard.tsx`
- `Frontend/src/dashboard/StudentSsgEventOrganizerDashboard.tsx`
- `Frontend/src/pages/HomeUser.tsx`
- `Frontend/src/pages/ManualAttendance.tsx`
- `Frontend/src/pages/FaceScan.tsx`
- `Frontend/src/css/UpcomingEvents.css`

## Important note

Frontend package binaries are not currently installed in this workspace, so a full `tsc`/Vite build could not be executed here.
