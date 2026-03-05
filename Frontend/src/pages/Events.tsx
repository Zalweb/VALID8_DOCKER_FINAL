import { useState, useEffect } from "react";
import { NavbarAdmin } from "../components/NavbarAdmin";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import { NavbarSSG } from "../components/NavbarSSG";
import { FaFilter, FaSearch, FaUsers } from "react-icons/fa";
import { fetchEventsByStatus } from "../api/eventsApi";
import "../css/Events.css";

interface EventsProps {
  role: string;
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

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
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
  ssg_members?: SSGMember[]; // Use SSGMember instead of SSGProfile
}

export const Events: React.FC<EventsProps> = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "ongoing" | "completed" | "cancelled"
  >("all");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const [upcoming, ongoing, completed, cancelled] = await Promise.all([
          fetchEventsByStatus("upcoming"),
          fetchEventsByStatus("ongoing"),
          fetchEventsByStatus("completed"),
          fetchEventsByStatus("cancelled"),
        ]);
        setEvents([...upcoming, ...ongoing, ...completed, ...cancelled]);
      } catch (err) {
        setError("Failed to fetch events. Please try again later.");
        console.error("Error fetching events:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

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
    return departments.map((d) => d.name).join(", ") || "N/A";
  };

  const formatPrograms = (programs: Program[] = []) => {
    return programs.map((p) => p.name).join(", ") || "N/A";
  };

  // Then update formatSSGMembers:
  const formatSSGMembers = (members: SSGMember[] = []) => {
    if (!members || members.length === 0) return "N/A";

    return members.map((m) => (
      <div key={m.user_id} className="ssg-member-item">
        <FaUsers className="member-icon" />
        <span>
          {m.user.first_name} {m.user.last_name}
          {m.position && ` (${m.position})`}
        </span>
      </div>
    ));
  };

  const filteredEvents = events
    .filter((event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((event) => {
      if (filter === "upcoming") return event.status === "upcoming";
      if (filter === "ongoing") return event.status === "ongoing";
      if (filter === "completed") return event.status === "completed";
      if (filter === "cancelled") return event.status === "cancelled";
      return true;
    });

  return (
    <div className="events-page">
      {role === "admin" && <NavbarAdmin />}
      {role === "student-ssg" && <NavbarStudentSSG />}
      {role === "ssg" && <NavbarSSG />}
      {role === "student-ssg-eventorganizer" && (
        <NavbarStudentSSGEventOrganizer />
      )}

      <div className="events-container">
        <div className="events-header">
          <h2>Events</h2>
          <p className="subtitle">View and manage all events</p>
        </div>

        <div className="search-filter-section">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <button
              className="filter-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              <FaFilter /> Filter
            </button>
            {dropdownOpen && (
              <div className="filter-dropdown">
                <button
                  className={`dropdown-item ${
                    filter === "all" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilter("all");
                    setDropdownOpen(false);
                  }}
                >
                  All Events
                </button>
                <button
                  className={`dropdown-item ${
                    filter === "upcoming" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilter("upcoming");
                    setDropdownOpen(false);
                  }}
                >
                  Upcoming
                </button>
                <button
                  className={`dropdown-item ${
                    filter === "ongoing" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilter("ongoing");
                    setDropdownOpen(false);
                  }}
                >
                  Ongoing
                </button>
                <button
                  className={`dropdown-item ${
                    filter === "completed" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilter("completed");
                    setDropdownOpen(false);
                  }}
                >
                  Completed
                </button>
                <button
                  className={`dropdown-item ${
                    filter === "cancelled" ? "active" : ""
                  }`}
                  onClick={() => {
                    setFilter("cancelled");
                    setDropdownOpen(false);
                  }}
                >
                  Cancelled
                </button>
              </div>
            )}
          </div>
        </div>

        {loading && <div className="loading-indicator">Loading events...</div>}
        {error && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="table-responsive">
            <table className="events-table">
              <thead>
                <tr>
                  <th>Event Name</th>
                  <th>Department(s)</th>
                  <th>Program(s)</th>
                  <th>SSG Members</th>
                  <th>Date & Time</th>
                  <th>Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <tr key={event.id}>
                      <td data-label="Event Name">{event.name}</td>
                      <td data-label="Department(s)">
                        {formatDepartments(event.departments)}
                      </td>
                      <td data-label="Program(s)">
                        {formatPrograms(event.programs)}
                      </td>
                      <td data-label="SSG Members" className="ssg-members-cell">
                        <div className="ssg-members-list">
                          {formatSSGMembers(event.ssg_members)}
                        </div>
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="no-results">
                      No matching events found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
