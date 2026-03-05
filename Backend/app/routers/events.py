import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_current_user
from app.database import get_db
from app.models.attendance import Attendance as AttendanceModel
from app.models.department import Department as DepartmentModel
from app.models.event import Event as EventModel, EventStatus as ModelEventStatus
from app.models.program import Program as ProgramModel
from app.models.user import SSGProfile
from app.models.user import User as UserModel
from app.schemas.event import (
    Event as EventSchema,
    EventCreate,
    EventStatus,
    EventUpdate,
    EventWithRelations,
)


router = APIRouter(prefix="/events", tags=["events"])
logger = logging.getLogger(__name__)


def ensure_event_permissions(current_user: UserModel) -> None:
    if not any(
        role.role.name in ["ssg", "admin", "event-organizer"]
        for role in current_user.roles
    ):
        raise HTTPException(status_code=403, detail="Not authorized to manage events")


def validate_event_datetimes(
    start_datetime: datetime,
    end_datetime: datetime,
    late_threshold_minutes: Optional[int] = None,
) -> None:
    if start_datetime >= end_datetime:
        raise HTTPException(
            status_code=400, detail="End datetime must be after start datetime"
        )
    if late_threshold_minutes is not None and late_threshold_minutes < 0:
        raise HTTPException(
            status_code=400, detail="Late threshold minutes must be 0 or greater"
        )


def apply_event_relationships(
    db: Session,
    db_event: EventModel,
    department_ids: Optional[list[int]],
    program_ids: Optional[list[int]],
    ssg_member_ids: Optional[list[int]],
) -> None:
    if department_ids is not None:
        departments = (
            db.query(DepartmentModel)
            .filter(DepartmentModel.id.in_(department_ids))
            .all()
        )
        if len(departments) != len(department_ids):
            missing = set(department_ids) - {department.id for department in departments}
            raise HTTPException(404, f"Departments not found: {missing}")
        db_event.departments = departments

    if program_ids is not None:
        programs = (
            db.query(ProgramModel)
            .options(joinedload(ProgramModel.departments))
            .filter(ProgramModel.id.in_(program_ids))
            .all()
        )
        if len(programs) != len(program_ids):
            missing = set(program_ids) - {program.id for program in programs}
            raise HTTPException(404, f"Programs not found: {missing}")
        db_event.programs = programs

    if ssg_member_ids is not None:
        ssg_profiles = (
            db.query(SSGProfile)
            .options(joinedload(SSGProfile.user))
            .filter(SSGProfile.user_id.in_(ssg_member_ids))
            .all()
        )
        if len(ssg_profiles) != len(ssg_member_ids):
            missing = set(ssg_member_ids) - {profile.user_id for profile in ssg_profiles}
            raise HTTPException(404, f"SSG members not found: {missing}")
        db_event.ssg_members = ssg_profiles


@router.post("/", response_model=EventWithRelations, status_code=status.HTTP_201_CREATED)
def create_event(
    event: EventCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Create a new event."""
    try:
        ensure_event_permissions(current_user)
        validate_event_datetimes(
            event.start_datetime,
            event.end_datetime,
            event.late_threshold_minutes,
        )

        db_event = EventModel(
            name=event.name,
            location=event.location,
            start_datetime=event.start_datetime,
            end_datetime=event.end_datetime,
            late_threshold_minutes=event.late_threshold_minutes,
            status=ModelEventStatus[event.status.value.upper()],
        )
        db.add(db_event)
        db.flush()

        apply_event_relationships(
            db,
            db_event,
            event.department_ids,
            event.program_ids,
            event.ssg_member_ids,
        )

        db.commit()
        db.refresh(db_event)
        return db_event

    except HTTPException as exc:
        db.rollback()
        raise exc
    except IntegrityError:
        db.rollback()
        raise HTTPException(400, "Event creation failed (possible duplicate)")
    except Exception as exc:
        db.rollback()
        logger.error(f"Event creation error: {str(exc)}", exc_info=True)
        raise HTTPException(500, "Internal server error")


@router.get("/", response_model=list[EventSchema])
def read_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[EventStatus] = None,
    start_from: Optional[datetime] = None,
    end_at: Optional[datetime] = None,
    db: Session = Depends(get_db),
):
    """Get paginated list of events with optional filters."""
    query = db.query(EventModel).options(
        joinedload(EventModel.departments),
        joinedload(EventModel.programs),
        joinedload(EventModel.ssg_members).joinedload(SSGProfile.user),
    )

    if status:
        query = query.filter(
            EventModel.status == ModelEventStatus[status.value.upper()]
        )
    if start_from:
        query = query.filter(EventModel.start_datetime >= start_from)
    if end_at:
        query = query.filter(EventModel.end_datetime <= end_at)

    return (
        query.order_by(EventModel.start_datetime).offset(skip).limit(limit).all()
    )


@router.get("/ongoing", response_model=list[EventSchema])
def get_ongoing_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
):
    """Get all ongoing events."""
    return (
        db.query(EventModel)
        .options(
            joinedload(EventModel.departments),
            joinedload(EventModel.programs),
            joinedload(EventModel.ssg_members).joinedload(SSGProfile.user),
        )
        .filter(EventModel.status == ModelEventStatus.ONGOING)
        .order_by(EventModel.start_datetime)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{event_id}", response_model=EventWithRelations)
def read_event(event_id: int, db: Session = Depends(get_db)):
    """Get complete event details with all relationships."""
    event = (
        db.query(EventModel)
        .options(
            joinedload(EventModel.departments),
            joinedload(EventModel.programs).joinedload(ProgramModel.departments),
            joinedload(EventModel.ssg_members).joinedload(SSGProfile.user),
            joinedload(EventModel.attendances),
        )
        .filter(EventModel.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(404, "Event not found")

    return event


@router.patch("/{event_id}", response_model=EventSchema)
def update_event(
    event_id: int,
    event_update: EventUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Update event details."""
    try:
        ensure_event_permissions(current_user)

        db_event = db.query(EventModel).filter(EventModel.id == event_id).first()
        if not db_event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Event not found"
            )

        new_start = (
            event_update.start_datetime
            if event_update.start_datetime is not None
            else db_event.start_datetime
        )
        new_end = (
            event_update.end_datetime
            if event_update.end_datetime is not None
            else db_event.end_datetime
        )

        validate_event_datetimes(
            new_start,
            new_end,
            event_update.late_threshold_minutes,
        )

        if event_update.name is not None:
            db_event.name = event_update.name
        if event_update.location is not None:
            db_event.location = event_update.location

        db_event.start_datetime = new_start
        db_event.end_datetime = new_end

        if event_update.late_threshold_minutes is not None:
            db_event.late_threshold_minutes = event_update.late_threshold_minutes
        if event_update.status is not None:
            db_event.status = ModelEventStatus[event_update.status.value.upper()]

        if event_update.department_ids is not None:
            db_event.departments = []
            db.flush()
        if event_update.program_ids is not None:
            db_event.programs = []
            db.flush()
        if event_update.ssg_member_ids is not None:
            db_event.ssg_members = []
            db.flush()

        apply_event_relationships(
            db,
            db_event,
            event_update.department_ids,
            event_update.program_ids,
            event_update.ssg_member_ids,
        )

        db.commit()
        db.refresh(db_event)
        return db_event

    except HTTPException as exc:
        db.rollback()
        raise exc
    except IntegrityError as exc:
        db.rollback()
        logger.error(f"Integrity error during event update: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Update failed due to data integrity issues",
        )
    except ValueError as exc:
        db.rollback()
        logger.error(f"Value error during event update: {str(exc)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid data format: {str(exc)}",
        )
    except Exception as exc:
        db.rollback()
        logger.error(f"Unexpected error during event update: {str(exc)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error",
        )


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    user_roles = {role.role.name for role in current_user.roles}
    if not ({"admin", "event-organizer"} & user_roles):
        raise HTTPException(403, "Admin or event-organizer access required")

    event = (
        db.query(EventModel)
        .options(
            joinedload(EventModel.attendances),
            joinedload(EventModel.departments),
            joinedload(EventModel.programs),
            joinedload(EventModel.ssg_members),
        )
        .filter(EventModel.id == event_id)
        .first()
    )

    if not event:
        raise HTTPException(404, "Event not found")

    event.departments = []
    event.programs = []
    event.ssg_members = []

    for attendance in event.attendances:
        db.delete(attendance)

    db.delete(event)
    db.commit()


@router.get("/{event_id}/attendees")
def get_event_attendees(
    event_id: int,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """Get attendees for a specific event."""
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    query = db.query(AttendanceModel).filter(AttendanceModel.event_id == event_id)
    if status:
        query = query.filter(AttendanceModel.status == status)

    return (
        query.order_by(AttendanceModel.status, AttendanceModel.time_in)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/{event_id}/stats")
def get_event_stats(event_id: int, db: Session = Depends(get_db)):
    """Get attendance statistics for an event."""
    event = db.query(EventModel).filter(EventModel.id == event_id).first()
    if not event:
        raise HTTPException(404, "Event not found")

    total = (
        db.query(func.count(AttendanceModel.id))
        .filter(AttendanceModel.event_id == event_id)
        .scalar()
    )

    counts = (
        db.query(AttendanceModel.status, func.count(AttendanceModel.id))
        .filter(AttendanceModel.event_id == event_id)
        .group_by(AttendanceModel.status)
        .all()
    )

    return {
        "total": total,
        "statuses": {
            status_value: {
                "count": count,
                "percentage": round((count / total) * 100, 2) if total else 0,
            }
            for status_value, count in counts
        },
    }


@router.patch("/{event_id}/status", response_model=EventSchema)
def update_event_status(
    event_id: int,
    status: EventStatus,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    """Update event status only."""
    try:
        ensure_event_permissions(current_user)

        db_event = db.query(EventModel).filter(EventModel.id == event_id).first()
        if not db_event:
            raise HTTPException(404, "Event not found")

        db_event.status = ModelEventStatus[status.value.upper()]

        db.commit()
        db.refresh(db_event)
        return db_event

    except HTTPException as exc:
        db.rollback()
        raise exc
    except Exception as exc:
        db.rollback()
        logger.error(f"Status update error: {str(exc)}")
        raise HTTPException(500, f"Internal server error: {str(exc)}")
