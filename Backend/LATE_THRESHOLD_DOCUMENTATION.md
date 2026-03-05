# Late Threshold

## What was added

- Events now store `late_threshold_minutes`
- Event create and update APIs validate it as `>= 0`
- Attendance classification now uses:
  - event `start_datetime`
  - event `late_threshold_minutes`
  - current server time

## Event behavior

When a student checks in:

- before `start_datetime`
  - status becomes `present`
- from event start up to `late_threshold_minutes`
  - status becomes `present`
- after that threshold
  - status becomes `late`

## Backend files changed

- `Backend/app/models/event.py`
- `Backend/app/schemas/event.py`
- `Backend/app/routers/events.py`
- `Backend/app/routers/attendance.py`
- `Backend/alembic/versions/9f1c2ab8d4e7_add_late_threshold_to_events.py`

## Frontend files changed

- `Frontend/src/pages/CreateEvent.tsx`
- `Frontend/src/pages/ManageEvent.tsx`
- `Frontend/src/css/CreateEvent.css`

## Migration

Run the new Alembic revision so the `events` table gets:

- `late_threshold_minutes INTEGER NOT NULL DEFAULT 0`
