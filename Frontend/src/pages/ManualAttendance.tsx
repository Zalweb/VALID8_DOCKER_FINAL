import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import NavbarStudentSSGEventOrganizer from "../components/NavbarStudentSSGEventOrganizer";
import { NavbarSSG } from "../components/NavbarSSG";
import { NavbarStudent } from "../components/NavbarStudent";

interface ManualAttendanceProps {
  role: string;
}
// Types
interface Event {
  id: number;
  name: string; // Changed from title
  start_datetime: string; // Changed from date
  end_datetime: string;
  status: string;
}

interface Attendance {
  id: number;
  student_id: number;
  student: Student; // Add this to include student details
  event_id: number;
  time_in: string;
  time_out?: string;
  status: string;
  method: string;
  notes?: string;
}

interface Student {
  id: number;
  student_id: string; // The actual student ID (like "2020-1234")
  name: string;
}

export const ManualAttendance: React.FC<ManualAttendanceProps> = ({ role }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventIdFromQuery = Number(searchParams.get("eventId"));
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(
    Number.isFinite(eventIdFromQuery) && eventIdFromQuery > 0
      ? eventIdFromQuery
      : null
  );
  const [studentId, setStudentId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "">("");
  const [activeAttendances, setActiveAttendances] = useState<Attendance[]>([]);
  // Add new state for mark absent functionality
  const [markingAbsent, setMarkingAbsent] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      throw new Error("No authentication token found");
    }

    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        navigate("/login");
        throw new Error("Session expired. Please login again.");
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          errorData = JSON.parse(errorText);
          console.error("API Error Response:", errorData);

          if (errorData.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === "object") {
            errorMessage = JSON.stringify(errorData);
          }
        } catch (e) {
          console.error("API Error (non-JSON):", errorText);
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      return response;
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      throw err;
    }
  };

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (Number.isFinite(eventIdFromQuery) && eventIdFromQuery > 0) {
      setSelectedEventId(eventIdFromQuery);
    }
  }, [eventIdFromQuery]);

  // Fetch active attendances when event is selected
  useEffect(() => {
    if (selectedEventId) {
      fetchActiveAttendances();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      console.log("Fetching events from:", `${BASE_URL}/events`);
      const response = await fetchWithAuth(`${BASE_URL}/events`);
      if (!response.ok) {
        console.error("Failed to fetch events, status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText);
      }
      const eventsData = await response.json();
      console.log("Received events:", eventsData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching events:", error);
      setMessage("Failed to fetch events");
      setMessageType("error");
    }
  };

  const fetchActiveAttendances = async () => {
    if (!selectedEventId) return;

    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/attendance/events/${selectedEventId}/attendances?active_only=true`
      );
      const attendancesWithStudents = await response.json();

      // Transform the data to match your frontend interface
      const formattedAttendances = attendancesWithStudents.map((item: any) => ({
        ...item.attendance,
        student: {
          id: item.attendance.student_id,
          student_id: item.student_id,
          name: item.student_name,
        },
      }));

      setActiveAttendances(formattedAttendances);
    } catch (error) {
      console.error("Error fetching attendances:", error);
    }
  };

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 5000);
  };

  const handleTimeIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !studentId.trim()) {
      showMessage("Please select an event and enter a student ID", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/attendance/manual`, {
        method: "POST",
        body: JSON.stringify({
          event_id: selectedEventId,
          student_id: studentId.trim(),
          notes: notes.trim() || null,
        }),
      });

      const result = await response.json();
      showMessage(`Time in recorded successfully for ${studentId}`, "success");
      setStudentId("");
      setNotes("");
      fetchActiveAttendances(); // Refresh active attendances
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Failed to record time in",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTimeOut = async (
    attendanceId: number,
    studentDisplayId: string
  ) => {
    setLoading(true);
    try {
      const response = await fetchWithAuth(
        `${BASE_URL}/attendance/${attendanceId}/time-out`,
        {
          method: "POST",
        }
      );

      const result = await response.json();
      showMessage(
        `Time out recorded successfully for ${studentDisplayId}`,
        "success"
      );
      fetchActiveAttendances(); // Refresh active attendances
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Failed to record time out",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // NEW: Handle mark absent functionality
  const handleMarkAbsent = async () => {
    if (!selectedEventId) {
      showMessage("Please select an event first", "error");
      return;
    }

    const confirmMessage = `This will mark all students who timed in but didn't time out as ABSENT for the selected event. Are you sure?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    setMarkingAbsent(true);
    try {
      // Fixed: Send event_id as query parameter instead of request body
      const response = await fetchWithAuth(
        `${BASE_URL}/attendance/mark-absent-no-timeout?event_id=${selectedEventId}`,
        {
          method: "POST",
          // Remove the body since event_id is now in query params
        }
      );

      const result = await response.json();
      showMessage(
        `Successfully marked ${result.updated_count} students as absent`,
        "success"
      );
      fetchActiveAttendances(); // Refresh active attendances
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : "Failed to mark students absent",
        "error"
      );
    } finally {
      setMarkingAbsent(false);
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (timeString: string) => {
    return new Date(timeString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get selected event details for display
  const selectedEvent = events.find((event) => event.id === selectedEventId);

  return (
    <div className="attendance-container">
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : (
        <NavbarStudent />
      )}
      <div className="attendance-header">
        <h1>Manual Attendance</h1>
        <p>Record student time in and time out manually</p>
      </div>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <div className="attendance-content">
        {/* Time In Form */}
        <div className="attendance-card">
          <h2>Record Time In</h2>
          <form onSubmit={handleTimeIn} className="attendance-form">
            <div className="form-group">
              <label htmlFor="event-select">Select Event *</label>
              <select
                id="event-select"
                value={selectedEventId || ""}
                onChange={(e) =>
                  setSelectedEventId(Number(e.target.value) || null)
                }
                required
                className="form-control"
              >
                <option value="">Choose an event...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name} - {formatDate(event.start_datetime)}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="student-id">Student ID *</label>
              <input
                id="student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter student ID"
                required
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes (Optional)</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className="form-control"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? "Recording..." : "Record Time In"}
            </button>
          </form>
        </div>

        {/* Active Attendances */}
        {selectedEventId && (
          <div className="attendance-card">
            <div className="card-header-with-action">
              <div>
                <h2>Active Attendances</h2>
                <p className="card-subtitle">
                  Students who haven't timed out yet
                </p>
              </div>
              {/* NEW: Mark Absent Button */}
              {activeAttendances.length > 0 && (
                <button
                  onClick={handleMarkAbsent}
                  disabled={markingAbsent}
                  className="btn btn-warning btn-mark-absent"
                  title="Mark all active attendances as absent (for students who didn't time out)"
                >
                  {markingAbsent ? "Marking Absent..." : "Mark All as Absent"}
                </button>
              )}
            </div>

            {selectedEvent && (
              <div className="event-info">
                <strong>Event:</strong> {selectedEvent.name} (
                {activeAttendances.length} active)
              </div>
            )}

            {activeAttendances.length === 0 ? (
              <div className="empty-state">
                <p>No active attendances found for this event.</p>
              </div>
            ) : (
              <div className="attendance-list">
                {activeAttendances.map((attendance) => (
                  <div key={attendance.id} className="attendance-item">
                    <div className="attendance-info">
                      <div className="student-info">
                        <span className="student-id">
                          Student: {attendance.student.student_id} -{" "}
                          {attendance.student.name}
                        </span>
                        <span className="time-in">
                          Time In: {formatTime(attendance.time_in)} on{" "}
                          {formatDate(attendance.time_in)}
                        </span>
                        {attendance.notes && (
                          <span className="notes">
                            Notes: {attendance.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        handleTimeOut(
                          attendance.id,
                          attendance.student.student_id
                        )
                      }
                      disabled={loading}
                      className="btn btn-secondary"
                    >
                      {loading ? "Recording..." : "Record Time Out"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .attendance-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .attendance-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .attendance-header h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 2.5rem;
          font-weight: 600;
        }

        .attendance-header p {
          color: #666;
          font-size: 1.1rem;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background-color: #d4edda;
          border: 1px solid #c3e6cb;
          color: #155724;
        }

        .message.error {
          background-color: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .attendance-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
        }

        @media (max-width: 768px) {
          .attendance-content {
            grid-template-columns: 1fr;
          }
        }

        .attendance-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 25px;
          border: 1px solid #e1e5e9;
        }

        .attendance-card h2 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
          font-size: 1.5rem;
          font-weight: 600;
        }

        .card-subtitle {
          color: #666;
          margin-bottom: 20px;
          font-size: 0.9rem;
        }

        /* NEW: Card header with action button */
        .card-header-with-action {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }

        .card-header-with-action h2 {
          margin: 0 0 5px 0;
        }

        .card-header-with-action .card-subtitle {
          margin-bottom: 0;
        }

        .btn-mark-absent {
          flex-shrink: 0;
          margin-left: 15px;
          font-size: 0.9rem;
          padding: 8px 16px;
        }

        /* NEW: Event info section */
        .event-info {
          background-color: #f8f9fa;
          padding: 10px 15px;
          border-radius: 6px;
          margin-bottom: 15px;
          font-size: 0.9rem;
          color: #495057;
          border-left: 4px solid #007bff;
        }

        .attendance-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 6px;
          font-weight: 500;
          color: #333;
          font-size: 0.9rem;
        }

        .form-control {
          padding: 12px;
          border: 2px solid #e1e5e9;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
        }

        .form-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background-color: #007bff;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #0056b3;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background-color: #545b62;
          transform: translateY(-1px);
        }

        /* NEW: Warning button style */
        .btn-warning {
          background-color: #ffc107;
          color: #212529;
        }

        .btn-warning:hover:not(:disabled) {
          background-color: #e0a800;
          transform: translateY(-1px);
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        .attendance-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .attendance-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e1e5e9;
        }

        .attendance-info {
          flex: 1;
        }

        .student-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .student-id {
          font-weight: 600;
          color: #333;
          font-size: 1rem;
        }

        .time-in {
          color: #666;
          font-size: 0.9rem;
        }

        .notes {
          color: #666;
          font-size: 0.85rem;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .card-header-with-action {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .btn-mark-absent {
            margin-left: 0;
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .attendance-item {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
