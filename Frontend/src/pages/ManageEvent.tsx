import { useState, useEffect } from "react";
import { NavbarEventOrganizer } from "../components/NavbarEventOrganizer";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import Modal from "react-modal";
import "../css/ManageEvent.css";
import { useNavigate } from "react-router-dom";

interface ManageEventProps {
  role: string;
}

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
  department_ids: number[];
}

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface SSGMember {
  user_id: number;
  position: string;
  user: User;
}

// Updated to match the API structure
interface Event {
  id: number;
  name: string;
  start_datetime: string;
  end_datetime: string;
  late_threshold_minutes: number;
  location: string;
  status: string; // Will match EventStatus values
  departments: Department[];
  programs: Program[];
  ssg_members: SSGMember[];

  // For form handling - not in the API response
  department_ids?: number[];
  program_ids?: number[];
  ssg_member_ids?: number[];
}

export const ManageEvent: React.FC<ManageEventProps> = ({ role }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [ssgMembers, setSSGMembers] = useState<SSGMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [isStatusModalOpen, setStatusModalOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<string | null>(null);
  const [eventToUpdate, setEventToUpdate] = useState<number | null>(null);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      navigate("/login");
      throw new Error("No authentication token found");
    }

    // Don't set Content-Type for FormData
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${token}`,
      ...(!isFormData && { "Content-Type": "application/json" }),
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

        try {
          errorData = JSON.parse(errorText);
          console.error("API Error Response:", errorData);
        } catch (e) {
          console.error("API Error (non-JSON):", errorText);
        }

        throw new Error(
          errorData?.detail || `HTTP error! status: ${response.status}`
        );
      }

      return response;
    } catch (err) {
      console.error(`Error fetching ${url}:`, err);
      throw err;
    }
  };

  // Fetch all required data
  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        // Fetch events with relations - FastAPI returns complete objects
        const eventsResponse = await fetchWithAuth(`${BASE_URL}/events`);
        const eventsData = await eventsResponse.json();

        // Add derived fields for form handling with error handling
        const transformedEvents = (
          Array.isArray(eventsData) ? eventsData : []
        ).map((event: Event) => {
          try {
            return {
              ...event,
              late_threshold_minutes: event.late_threshold_minutes ?? 0,
              department_ids: Array.isArray(event.departments)
                ? event.departments
                    .filter((d) => d)
                    .map((d: Department) => d.id)
                : [],
              program_ids: Array.isArray(event.programs)
                ? event.programs.filter((p) => p).map((p: Program) => p.id)
                : [],
              ssg_member_ids: Array.isArray(event.ssg_members)
                ? event.ssg_members
                    .filter((m) => m && m.user_id)
                    .map((m: SSGMember) => m.user_id)
                : [],
            };
          } catch (err) {
            console.error("Error processing event data:", err, event);
            // Return a minimal valid event object if there's an error
            return {
              ...event,
              late_threshold_minutes: event.late_threshold_minutes ?? 0,
              department_ids: [],
              program_ids: [],
              ssg_member_ids: [],
            };
          }
        });

        setEvents(transformedEvents);

        // Fetch departments
        const deptResponse = await fetchWithAuth(`${BASE_URL}/departments`);
        const deptData = await deptResponse.json();
        setDepartments(deptData);

        // Fetch programs
        const programsResponse = await fetchWithAuth(`${BASE_URL}/programs`);
        const programsData = await programsResponse.json();
        setPrograms(programsData);

        // Fetch SSG members with comprehensive error handling
        try {
          const response = await fetchWithAuth(`${BASE_URL}/users/by-role/ssg`);

          // Check if response is empty or null before parsing
          const text = await response.text();
          let ssgData = [];

          try {
            if (text && text.trim() !== "" && text !== "null") {
              ssgData = JSON.parse(text);
            }
          } catch (parseErr) {
            console.error("Error parsing SSG members JSON:", parseErr);
          }

          // Ensure we have the expected data structure and validate each member has a user property
          const transformedMembers = Array.isArray(ssgData)
            ? ssgData
                .filter((member) => member && typeof member === "object")
                .map((user) => ({
                  user_id: user.id,
                  position: user.ssg_profile?.position || "Member",
                  user: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                  },
                }))
            : [];

          setSSGMembers(transformedMembers);
        } catch (ssgErr) {
          console.error("Error fetching SSG members:", ssgErr);
          setSSGMembers([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [BASE_URL, navigate]);

  // Filter events based on search term
  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Event handlers
  const openEditModal = (item: Event) => {
    setEditingEvent({
      ...item,
      late_threshold_minutes: item.late_threshold_minutes ?? 0,
      department_ids: item.departments?.map((d) => d.id) || [],
      program_ids: item.programs?.map((p) => p.id) || [],
      ssg_member_ids: item.ssg_members?.map((m) => m.user_id) || [],
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingEvent(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    if (editingEvent) {
      setEditingEvent({
        ...editingEvent,
        [e.target.name]:
          e.target.name === "late_threshold_minutes"
            ? Number(e.target.value || 0)
            : e.target.value,
      });
    }
  };
  // Fixed saveEditedEvent function - removed duplicate property
  const saveEditedEvent = async () => {
    if (!editingEvent) return;

    // Clean up the ssg_member_ids to remove any null values
    const cleanSsgMemberIds = Array.isArray(editingEvent.ssg_member_ids)
      ? editingEvent.ssg_member_ids.filter(
          (id) => id !== null && id !== undefined
        )
      : [];

    try {
      // Format data to match FastAPI expectations and validate arrays
      const updatePayload = {
        name: editingEvent.name,
        location: editingEvent.location,
        start_datetime: editingEvent.start_datetime,
        end_datetime: editingEvent.end_datetime,
        late_threshold_minutes: Number(editingEvent.late_threshold_minutes || 0),
        department_ids: Array.isArray(editingEvent.department_ids)
          ? editingEvent.department_ids
          : [],
        program_ids: Array.isArray(editingEvent.program_ids)
          ? editingEvent.program_ids
          : [],
        // Only define ssg_member_ids once with the cleaned array
        ssg_member_ids: cleanSsgMemberIds,
      };

      console.log("Sending update payload:", JSON.stringify(updatePayload));

      const response = await fetchWithAuth(
        `${BASE_URL}/events/${editingEvent.id}`,
        {
          method: "PATCH",
          body: JSON.stringify(updatePayload),
        }
      );

      const updatedEvent = await response.json();

      // Transform the updated event to include IDs for form handling
      const transformedEvent = {
        ...updatedEvent,
        late_threshold_minutes: updatedEvent.late_threshold_minutes ?? 0,
        department_ids:
          updatedEvent.departments?.map((d: Department) => d.id) || [],
        program_ids: updatedEvent.programs?.map((p: Program) => p.id) || [],
        ssg_member_ids:
          updatedEvent.ssg_members?.map((m: SSGMember) => m.user_id) || [],
      };

      setEvents(
        events.map((event) =>
          event.id === transformedEvent.id ? transformedEvent : event
        )
      );
      closeEditModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update event");
    }
  };

  // Alternative implementation to use the new endpoint
  const updateEventStatus = async () => {
    if (!eventToUpdate || !statusToUpdate) return;

    try {
      // Convert statusToUpdate to lowercase to match API expectations
      const lowercaseStatus = statusToUpdate.toLowerCase();

      // Send as query parameter, exactly matching the Swagger example
      await fetchWithAuth(
        `${BASE_URL}/events/${eventToUpdate}/status?status=${lowercaseStatus}`,
        {
          method: "PATCH",
          headers: {
            accept: "application/json",
            // Authorization header is added by fetchWithAuth
          },
        }
      );

      // Update local state (keep using the original statusToUpdate for consistency in UI)
      setEvents(
        events.map((event) =>
          event.id === eventToUpdate
            ? { ...event, status: statusToUpdate }
            : event
        )
      );

      console.log("Status update successful");
    } catch (err) {
      console.error("Status update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setStatusModalOpen(false);
      setEventToUpdate(null);
      setStatusToUpdate(null);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      await fetchWithAuth(`${BASE_URL}/events/${itemToDelete}`, {
        method: "DELETE",
      });

      // Update local state
      setEvents(events.filter((event) => event.id !== itemToDelete));
      setDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete event");
    }
  };

  const getStatusBadge = (status: string) => {
    let badgeClass = "";
    switch (status.toLowerCase()) {
      case "upcoming":
        badgeClass = "badge bg-primary";
        break;
      case "ongoing":
        badgeClass = "badge bg-warning text-dark";
        break;
      case "completed":
        badgeClass = "badge bg-success";
        break;
      case "cancelled":
        badgeClass = "badge bg-danger";
        break;
      default:
        badgeClass = "badge bg-secondary";
    }
    return <span className={badgeClass}>{status}</span>;
  };

  // Helper function to format date for better display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper functions for displaying related entities
  const getDepartmentNames = (deps?: Department[]) => {
    if (!deps || deps.length === 0) return "None";
    console.log("Available programs:", getProgramNames(programs));
    return deps.map((dept) => dept.name).join(", ");
  };

  const getProgramNames = (progs?: Program[]) => {
    if (!progs || progs.length === 0) return "None";
    return progs.map((prog) => prog.name).join(", ");
  };

  const getSSGMemberNames = (members?: SSGMember[]) => {
    if (!members || members.length === 0) return "None";
    console.log("Available programs:", getSSGMemberNames(ssgMembers));
    return members
      .filter((member) => member && member.user)
      .map(
        (member) =>
          `${member.user?.first_name || "Unknown"} ${
            member.user?.last_name || ""
          } (${member.position || "Unknown"})`
      )
      .join(", ");
  };

  // This makes the modal more accessible but can be commented out if causing issues
  try {
    Modal.setAppElement("#root");
  } catch (error) {
    console.warn(
      "Could not set app element for Modal. This might affect accessibility:",
      error
    );
  }

  if (isLoading) {
    return (
      <div className="app-container">
        {role === "student-ssg-eventorganizer" ? (
          <NavbarStudentSSGEventOrganizer />
        ) : (
          <NavbarEventOrganizer />
        )}
        <div className="content-wrapper">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-container">
        {role === "student-ssg-eventorganizer" ? (
          <NavbarStudentSSGEventOrganizer />
        ) : (
          <NavbarEventOrganizer />
        )}
        <div className="content-wrapper">
          <div className="error-message">
            <p>❌ Error: {error}</p>
            <button
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : (
        <NavbarEventOrganizer />
      )}

      <div className="content-wrapper">
        <div className="page-header">
          <h1>Manage Events</h1>
          <div className="search-container">
            <input
              type="search"
              placeholder="Search events or locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {filteredEvents.length === 0 ? (
          <div className="no-results">
            <p>No events found. Try a different search term.</p>
          </div>
        ) : (
          <div className="event-cards">
            {filteredEvents.map((event) => (
              <div className="event-card" key={event.id}>
                <div className="event-header">
                  <h3>{event.name}</h3>
                  {getStatusBadge(event.status)}
                </div>

                <div className="event-details">
                  <p>
                    <strong>Date:</strong> {formatDate(event.start_datetime)}
                  </p>
                  <p>
                    <strong>Location:</strong> {event.location}
                  </p>
                  <p>
                    <strong>Late Threshold:</strong> {event.late_threshold_minutes}{" "}
                    minute{event.late_threshold_minutes === 1 ? "" : "s"}
                  </p>
                  <p className="departments">
                    <strong>Departments:</strong>{" "}
                    {getDepartmentNames(event.departments)}
                  </p>
                </div>

                <div className="event-actions">
                  <button
                    className="btn btn-edit"
                    onClick={() => openEditModal(event)}
                  >
                    Edit
                  </button>

                  {/* Replace the existing dropdown with this updated version */}
                  <select
                    className="status-select"
                    onChange={(e) => {
                      if (e.target.value) {
                        setEventToUpdate(event.id);
                        setStatusToUpdate(e.target.value);
                        setStatusModalOpen(true);
                      }
                    }}
                    value=""
                  >
                    <option value="" disabled>
                      Change Status
                    </option>
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  <button
                    className="btn btn-delete"
                    onClick={() => {
                      setItemToDelete(event.id);
                      setDeleteModalOpen(true);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onRequestClose={closeEditModal}
        className="modal-content"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
        contentLabel="Edit Event Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)", // Darker background for better contrast
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          },
          content: {
            position: "relative",
            inset: "auto", // Removes default positioning
            background: "white", // Explicit white background
            borderRadius: "var(--border-radius)",
            padding: 0,
            maxWidth: "550px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            margin: "0",
            border: "none",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)", // Stronger shadow for depth
          },
        }}
      >
        <div className="modal-header">
          <h2>Edit Event</h2>
          <button onClick={closeEditModal} className="close-button">
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="event-name">Event Name</label>
            <input
              type="text"
              id="event-name"
              name="name"
              value={editingEvent?.name || ""}
              onChange={handleEditChange}
              placeholder="Enter event name"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="event-start">Start Date & Time</label>
              <input
                type="datetime-local"
                id="event-start"
                name="start_datetime"
                value={
                  editingEvent?.start_datetime
                    ? new Date(editingEvent.start_datetime)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={handleEditChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="event-end">End Date & Time</label>
              <input
                type="datetime-local"
                id="event-end"
                name="end_datetime"
                value={
                  editingEvent?.end_datetime
                    ? new Date(editingEvent.end_datetime)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={handleEditChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="event-location">Location</label>
            <input
              type="text"
              id="event-location"
              name="location"
              value={editingEvent?.location || ""}
              onChange={handleEditChange}
              placeholder="Enter event location"
            />
          </div>

          <div className="form-group">
            <label htmlFor="event-late-threshold">
              Late Threshold (Minutes)
            </label>
            <input
              type="number"
              id="event-late-threshold"
              name="late_threshold_minutes"
              min="0"
              value={editingEvent?.late_threshold_minutes ?? 0}
              onChange={handleEditChange}
              placeholder="Enter late threshold minutes"
            />
            <small>
              Check-ins after this many minutes from the start time are marked
              late.
            </small>
          </div>

          <div className="form-group">
            <label>Departments</label>
            <select
              multiple
              className="select-multiple"
              value={editingEvent?.department_ids?.map(String) || []}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, (option) =>
                  Number(option.value)
                );
                setEditingEvent((prev) =>
                  prev ? { ...prev, department_ids: options } : null
                );
              }}
            >
              {departments.map((dept) => (
                <option key={dept.id} value={String(dept.id)}>
                  {dept.name}
                </option>
              ))}
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>

          <div className="form-group">
            <label>Programs</label>
            <select
              multiple
              className="select-multiple"
              value={editingEvent?.program_ids?.map(String) || []}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, (option) =>
                  Number(option.value)
                );
                setEditingEvent((prev) =>
                  prev ? { ...prev, program_ids: options } : null
                );
              }}
            >
              {programs.map((program) => (
                <option key={program.id} value={String(program.id)}>
                  {program.name}
                </option>
              ))}
            </select>
            <small>Hold Ctrl/Cmd to select multiple</small>
          </div>

          <div className="form-group">
            <label>Assign SSG Members</label>
            <select
              multiple
              className="select-multiple"
              value={editingEvent?.ssg_member_ids?.map(String) || []}
              onChange={(e) => {
                const options = Array.from(e.target.selectedOptions, (option) =>
                  Number(option.value)
                );
                setEditingEvent((prev) =>
                  prev ? { ...prev, ssg_member_ids: options } : null
                );
              }}
              style={{
                maxHeight: "200px",
                overflow: "auto",
              }}
            >
              {ssgMembers.map((member) => {
                // Check if this member is selected
                const isSelected = editingEvent?.ssg_member_ids?.includes(
                  member.user_id
                );

                return (
                  <option
                    key={member.user_id}
                    value={member.user_id}
                    className={isSelected ? "selected-option" : ""}
                  >
                    {member.user.first_name} {member.user.last_name}
                    {member.position && ` (${member.position})`}
                  </option>
                );
              })}
            </select>
            <small>Hold Ctrl/Cmd to select multiple members</small>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-cancel" onClick={closeEditModal}>
            Cancel
          </button>
          <button className="btn btn-save" onClick={saveEditedEvent}>
            Save Changes
          </button>
        </div>
      </Modal>

      {/* Status Change Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onRequestClose={() => setStatusModalOpen(false)}
        className="modal-content modal-sm"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
        contentLabel="Status Update Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          },
          content: {
            position: "relative",
            inset: "auto",
            background: "white",
            borderRadius: "var(--border-radius)",
            padding: 0,
            maxWidth: "400px",
            width: "100%",
            margin: "0",
            border: "none",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <div className="modal-header">
          <h2>Update Status</h2>
          <button
            onClick={() => setStatusModalOpen(false)}
            className="close-button"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>
            Are you sure you want to change this event's status to{" "}
            <strong>{statusToUpdate?.toLowerCase()}</strong>?
          </p>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-cancel"
            onClick={() => setStatusModalOpen(false)}
          >
            Cancel
          </button>
          <button className="btn btn-save" onClick={updateEventStatus}>
            Update Status
          </button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onRequestClose={() => setDeleteModalOpen(false)}
        className="modal-content modal-sm"
        overlayClassName="modal-overlay"
        ariaHideApp={false}
        contentLabel="Delete Confirmation Modal"
        style={{
          overlay: {
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "1rem",
          },
          content: {
            position: "relative",
            inset: "auto",
            background: "white",
            borderRadius: "var(--border-radius)",
            padding: 0,
            maxWidth: "400px",
            width: "100%",
            margin: "0",
            border: "none",
            boxShadow: "0 5px 15px rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <div className="modal-header">
          <h2>Delete Event</h2>
          <button
            onClick={() => setDeleteModalOpen(false)}
            className="close-button"
          >
            ×
          </button>
        </div>

        <div className="modal-body">
          <p>
            Are you sure you want to delete this event? This action cannot be
            undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-cancel"
            onClick={() => setDeleteModalOpen(false)}
          >
            Cancel
          </button>
          <button className="btn btn-delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManageEvent;
