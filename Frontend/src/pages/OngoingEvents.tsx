import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaSearch } from "react-icons/fa";
import { fetchEventsByStatus } from "../api/eventsApi";
import { NavbarStudent } from "../components/NavbarStudent";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import "../css/UpcomingEvents.css";

interface OngoingEventsProps {
  role: string;
}

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
}

interface SSGProfile {
  id: number;
  position: string;
}

interface Event {
  id: number;
  name: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  departments?: Department[];
  programs?: Program[];
  ssg_members?: SSGProfile[];
}

interface StudentAttendanceResponse {
  student_id: string;
  student_name: string;
  total_records: number;
  attendances: Array<{
    id: number;
    event_id: number;
    event_name: string;
  }>;
}

type AttendanceAction = {
  label: string;
  to: string;
  variant: "primary" | "secondary";
};

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAttendanceActions = (
  role: string,
  eventId: number
): AttendanceAction[] => {
  if (role === "student-ssg") {
    return [
      {
        label: "Manual Attendance",
        to: `/studentssg_manual_attendance?eventId=${eventId}`,
        variant: "primary",
      },
      {
        label: "Face Scan",
        to: `/studentssg_face_scan?eventId=${eventId}`,
        variant: "secondary",
      },
    ];
  }

  if (role === "student-ssg-eventorganizer") {
    return [
      {
        label: "Manual Attendance",
        to: `/student_ssg_eventorganizer_manual_attendance?eventId=${eventId}`,
        variant: "primary",
      },
    ];
  }

  return [];
};

export const OngoingEvents: React.FC<OngoingEventsProps> = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submittedEventIds, setSubmittedEventIds] = useState<number[]>([]);
  const [submittingEventId, setSubmittingEventId] = useState<number | null>(
    null
  );
  const [actionMessage, setActionMessage] = useState("");
  const [actionType, setActionType] = useState<"success" | "error" | "">("");

  const showAttendanceActions =
    role === "student-ssg" || role === "student-ssg-eventorganizer";
  const showStudentPresentAction = role === "student";
  const showActionColumn = showAttendanceActions || showStudentPresentAction;
  const columnCount = showActionColumn ? 7 : 6;

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await fetchEventsByStatus("ongoing");
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching ongoing events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
  }, []);

  useEffect(() => {
    const loadStudentAttendance = async () => {
      if (!showStudentPresentAction) {
        return;
      }

      const token = localStorage.getItem("authToken");
      if (!token) {
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/attendance/me/records`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch student attendance");
        }

        const data: StudentAttendanceResponse[] = await response.json();
        const attendedEventIds =
          data[0]?.attendances?.map((attendance) => attendance.event_id) ?? [];
        setSubmittedEventIds(attendedEventIds);
      } catch (error) {
        console.error("Error fetching student attendance records:", error);
      }
    };

    loadStudentAttendance();
  }, [showStudentPresentAction]);

  const formatDateTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDepartments = (departments: Department[] = []) => {
    return departments.map((department) => department.name).join(", ") || "N/A";
  };

  const formatPrograms = (programs: Program[] = []) => {
    return programs.map((program) => program.name).join(", ") || "N/A";
  };

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      event.status === "ongoing"
  );

  const showFeedback = (message: string, type: "success" | "error") => {
    setActionMessage(message);
    setActionType(type);

    window.setTimeout(() => {
      setActionMessage("");
      setActionType("");
    }, 4000);
  };

  const handleStudentPresent = async (eventId: number) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      showFeedback("Please log in again to record attendance.", "error");
      return;
    }

    setSubmittingEventId(eventId);

    try {
      const response = await fetch(`${BASE_URL}/attendance/self-check-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to record attendance");
      }

      setSubmittedEventIds((current) =>
        current.includes(eventId) ? current : [...current, eventId]
      );
      showFeedback(
        `You are now marked ${String(data.status || "present")} for this event.`,
        "success"
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to record attendance";

      if (message.toLowerCase().includes("already recorded")) {
        setSubmittedEventIds((current) =>
          current.includes(eventId) ? current : [...current, eventId]
        );
      }

      showFeedback(message, "error");
    } finally {
      setSubmittingEventId(null);
    }
  };

  return (
    <div className="upcoming-page">
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : (
        <NavbarStudent />
      )}

      <div className="upcoming-container">
        <div className="upcoming-header">
          <h2>Ongoing Events</h2>
          <p className="subtitle">
            View events happening now
            {showAttendanceActions ? " and open attendance tools" : ""}
          </p>
          {actionMessage && (
            <div className={`action-feedback ${actionType}`}>
              {actionMessage}
            </div>
          )}
        </div>

        <div className="search-filter-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="upcoming-table">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Department(s)</th>
                <th>Program(s)</th>
                <th>Date & Time</th>
                <th>Location</th>
                <th>Status</th>
                {showActionColumn && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columnCount}>Loading events...</td>
                </tr>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const attendanceActions = getAttendanceActions(role, event.id);

                  return (
                    <tr key={event.id}>
                      <td data-label="Event Name">{event.name}</td>
                      <td data-label="Department(s)">
                        {formatDepartments(event.departments)}
                      </td>
                      <td data-label="Program(s)">
                        {formatPrograms(event.programs)}
                      </td>
                      <td data-label="Date & Time">
                        {formatDateTime(event.start_datetime)} -{" "}
                        {formatDateTime(event.end_datetime)}
                      </td>
                      <td data-label="Location">{event.location}</td>
                      <td data-label="Status">
                        <span className={`status-badge ${event.status}`}>
                          {event.status.charAt(0).toUpperCase() +
                            event.status.slice(1)}
                        </span>
                      </td>
                      {showActionColumn && (
                        <td data-label="Actions" className="action-cell">
                          {showStudentPresentAction ? (
                            <div className="action-links">
                              <button
                                type="button"
                                className="action-link primary action-button"
                                onClick={() => handleStudentPresent(event.id)}
                                disabled={
                                  submittingEventId === event.id ||
                                  submittedEventIds.includes(event.id)
                                }
                              >
                                {submittedEventIds.includes(event.id)
                                  ? "Already Present"
                                  : submittingEventId === event.id
                                  ? "Submitting..."
                                  : "Present"}
                              </button>
                            </div>
                          ) : (
                            <div className="action-links">
                              {attendanceActions.map((action) => (
                                <Link
                                  key={action.to}
                                  to={action.to}
                                  className={`action-link ${action.variant}`}
                                >
                                  {action.label}
                                </Link>
                              ))}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={columnCount} className="no-results">
                    No ongoing events found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OngoingEvents;
