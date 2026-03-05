import { useState, useEffect } from "react";
import { NavbarStudent } from "../components/NavbarStudent";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import { FaSearch } from "react-icons/fa";
import { fetchEventsByStatus } from "../api/eventsApi";
import "../css/UpcomingEvents.css";

interface UpcomingEventsProps {
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

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true);
      try {
        const fetchedEvents = await fetchEventsByStatus("upcoming");
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEvents();
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

  const filteredEvents = events.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      event.status === "upcoming"
  );

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
          <h2>Upcoming Events</h2>
          <p className="subtitle">View and manage upcoming events</p>
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
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6}>Loading events...</td>
                </tr>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="no-results">
                    No upcoming events found
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

export default UpcomingEvents;
