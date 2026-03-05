# Late Status Support

This backend now supports `late` as a valid attendance status.

## What Was Added

- Database enum `attendancestatus` includes `late`
- SQLAlchemy enum in `app/models/attendance.py` includes `late`
- Pydantic enum in `app/schemas/attendance.py` includes `late`

## What The Backend Does

### 1. Accepts `late` as a sign-in status

These sign-in flows now accept either:

- `present`
- `late`

They reject:

- `absent`
- `excused`

because those are handled by different flows.

Updated endpoints:

- `POST /attendance/face-scan`
- `POST /attendance/manual`
- `POST /attendance/bulk`

### 2. Attendance rate treats `late` as attended

Attendance summaries now count both `present` and `late` as attended.

Formula used:

`attendance_rate = (present + late) / total_records * 100`

### 3. Reports now include late-aware totals

Updated report behavior:

- student overview attendance counts `present` and `late`
- student attendance report counts `late`
- overall summary includes `late_count`
- monthly status charts include `late`

### 4. Auto-absence cleanup also covers late sign-ins

`POST /attendance/mark-absent-no-timeout` now updates both:

- `present`
- `late`

when the event is completed and no timeout was recorded.

## API Input Details

### Manual attendance

Request body now supports:

```json
{
  "event_id": 1,
  "student_id": "20230001",
  "status": "late",
  "notes": "Arrived after call time"
}
```

If `status` is omitted, it defaults to `present`.

### Bulk attendance

Each record now supports `status`.

Example:

```json
{
  "records": [
    {
      "event_id": 1,
      "student_id": "20230001",
      "status": "present"
    },
    {
      "event_id": 1,
      "student_id": "20230002",
      "status": "late"
    }
  ]
}
```

### Face scan attendance

This endpoint accepts a `status` query parameter.

Example:

`POST /attendance/face-scan?event_id=1&student_id=20230001&status=late`

If `status` is omitted, it defaults to `present`.

## Important Limitation

This does **not** automatically decide whether a student is late based on event start time.

It only:

- stores `late` correctly
- validates it
- includes it in reporting

If you want automatic late detection, you still need a separate event-time rule such as:

- event start time
- late threshold minutes
- status decision based on server time

## Files Updated

- `app/models/attendance.py`
- `app/schemas/attendance.py`
- `app/routers/attendance.py`
- `alembic/versions/64f27651f1b0_add_late_to_attendance_status.py`
