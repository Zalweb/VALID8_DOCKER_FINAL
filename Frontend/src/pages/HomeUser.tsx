import React from "react";
import { Link } from "react-router-dom";
import { NavbarStudent } from "../components/NavbarStudent";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import { NavbarEventOrganizer } from "../components/NavbarEventOrganizer";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import { NavbarSSG } from "../components/NavbarSSG";
import NavbarAdmin from "../components/NavbarAdmin";

// Import colorful icons
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaPlayCircle,
  FaUsers,
  FaClipboardList,
  FaPlus,
  FaCogs,
  FaChartBar,
  FaFileAlt,
  FaUserShield,
} from "react-icons/fa";

interface HomeUserProps {
  role: string;
}

export const HomeUser: React.FC<HomeUserProps> = ({ role }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  console.log("Role:", role); // Debugging to check role

  // Define card data with colorful icons
  const cardData = {
    student: [
      {
        title: "Upcoming Events",
        description: "Stay informed about upcoming school events.",
        icon: <FaCalendarAlt style={{ color: "#007bff" }} />, // Blue color
        link: "/student_upcoming_events",
      },
      {
        title: "Ongoing Events",
        description: "See events that are happening right now.",
        icon: <FaPlayCircle style={{ color: "#fd7e14" }} />,
        link: "/student_ongoing_events",
      },
      {
        title: "Events Attended",
        description: "Check and review the events you've attended.",
        icon: <FaCheckCircle style={{ color: "#28a745" }} />, // Green color
        link: "/student_events_attended",
      },
    ],
    ssg: [
      {
        title: "Events",
        description: "View and manage currently ongoing events.",
        icon: <FaClipboardList style={{ color: "#ffc107" }} />, // Yellow color
        link: "/ssg_events",
      },
      {
        title: "Records",
        description: "Access records and event history.",
        icon: <FaChartBar style={{ color: "#6c757d" }} />, // Gray color
        link: "/ssg_records",
      },
      {
        title: "Manual Attendance",
        description: "Records Attendance.",
        icon: <FaUsers style={{ color: "#6c757d" }} />, // Gray color
        link: "/ssg_manual_attendance",
      },
    ],
    "event-organizer": [
      {
        title: "Create Event",
        description: "Plan and schedule new events.",
        icon: <FaPlus style={{ color: "#007bff" }} />, // Blue color
        link: "/event_organizer_create_event",
      },
      {
        title: "Manage Events",
        description: "Modify, update, or remove existing events.",
        icon: <FaCogs style={{ color: "#6f42c1" }} />, // Purple color
        link: "/event_organizer_manage_event",
      },
    ],
    admin: [
      {
        title: "Events",
        description: "Monitor and oversee all ongoing events.",
        icon: <FaClipboardList style={{ color: "#ffc107" }} />, // Yellow color
        link: "/admin_events",
      },
      {
        title: "Manage Users",
        description: "Create, update, and manage user accounts and roles.",
        icon: <FaUserShield style={{ color: "#dc3545" }} />, // Red color
        link: "/admin_manage_users",
      },
      {
        title: "Create Users",
        description: "Create, update, and manage user accounts and roles.",
        icon: <FaCheckCircle style={{ color: "#dc3545" }} />, // Red color
        link: "/admin_create_users",
      },
      {
        title: "Create Department & Programm",
        description: "Create, update, and manage departments & programs.",
        icon: <FaPlus style={{ color: "#dc3545" }} />, // Red color
        link: "/admin_create_department_program",
      },
    ],
    "student-ssg": [
      {
        title: "Upcoming Events",
        description: "Stay informed about upcoming school events.",
        icon: <FaCalendarAlt style={{ color: "#007bff" }} />,
        link: "/studentssg_upcoming_events",
      },
      {
        title: "Ongoing Events",
        description: "Open live events and go directly to attendance tools.",
        icon: <FaPlayCircle style={{ color: "#fd7e14" }} />,
        link: "/studentssg_ongoing_events",
      },
      {
        title: "Events Attended",
        description: "Check and review the events you've attended.",
        icon: <FaCheckCircle style={{ color: "#28a745" }} />, // Green color
        link: "/studentssg_events_attended",
      },
      {
        title: "Events",
        description: "View and manage currently ongoing events.",
        icon: <FaClipboardList style={{ color: "#ffc107" }} />,
        link: "/studentssg_events",
      },
      {
        title: "Manual Attendance",
        description: "Record Attendance",
        icon: <FaUsers style={{ color: "#17a2b8" }} />, // Teal color
        link: "/studentssg_manual_attendance",
      },
      {
        title: "Records",
        description: "Access records and event history.",
        icon: <FaChartBar style={{ color: "#6c757d" }} />, // Gray color
        link: "/studentssg_records",
      },
    ],
    "student-ssg-eventorganizer": [
      {
        title: "Upcoming Events",
        description: "Stay informed about upcoming school events.",
        icon: <FaCalendarAlt style={{ color: "#007bff" }} />,
        link: "/student_ssg_eventorganizer_upcoming_events",
      },
      {
        title: "Ongoing Events",
        description: "View live events and launch attendance actions.",
        icon: <FaPlayCircle style={{ color: "#fd7e14" }} />,
        link: "/student_ssg_eventorganizer_ongoing_events",
      },
      {
        title: "Events Attended",
        description: "Check and review the events you've attended.",
        icon: <FaCheckCircle style={{ color: "#28a745" }} />, // Green color
        link: "/student_ssg_eventorganizer_events_attended",
      },
      {
        title: "Events",
        description: "View and manage currently ongoing events.",
        icon: <FaClipboardList style={{ color: "#ffc107" }} />,
        link: "/student_ssg_eventorganizer_events",
      },
      {
        title: "Manual Attendance",
        description: "Record Attendance.",
        icon: <FaPlus style={{ color: "#17a2b8" }} />, // Teal color
        link: "/student_ssg_eventorganizer_manual_attendance",
      },
      {
        title: "Records",
        description: "Access records and event history.",
        icon: <FaChartBar style={{ color: "#6c757d" }} />, // Gray color
        link: "/student_ssg_eventorganizer_records",
      },
      {
        title: "Create Event",
        description: "Plan and schedule new events.",
        icon: <FaPlus style={{ color: "#007bff" }} />, // Blue color
        link: "/student_ssg_eventorganizer_create_event",
      },
      {
        title: "Manage Events",
        description: "Modify, update, or remove existing events.",
        icon: <FaCogs style={{ color: "#6f42c1" }} />, // Purple color
        link: "/student_ssg_eventorganizer_manage_event",
      },
    ],
  };

  // Choose appropriate card set based on role
  const cards = cardData[role] || cardData.student;

  return (
    <div
      className="home-user-container"
      style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Dynamically select the navbar based on the role */}
      {role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "event-organizer" ? (
        <NavbarEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : role === "student" ? (
        <NavbarStudent />
      ) : role === "admin" ? (
        <NavbarAdmin />
      ) : null}

      <main
        className="flex-grow-1"
        style={{ padding: "2rem 1rem 2rem 3rem", backgroundColor: "#f5f7fa" }} // Changed right padding from 1rem to 3rem
      >
        {/* Welcoming Description */}
        <div
          className="welcome-section text-center mb-5"
          style={{ marginRight: "2rem" }}
        >
          {" "}
          {/* Added marginRight */}
          <h2 className="mb-3" style={{ color: "#343a40", fontWeight: "600" }}>
            Welcome{" "}
            {role.charAt(0).toUpperCase() + role.slice(1).replace("-", " ")}!
          </h2>
          <p
            className="text-muted"
            style={{ maxWidth: "600px", margin: "0 auto" }}
          >
            Your central hub for managing events, tracking attendance, and
            staying organized.
          </p>
        </div>

        {/* Dashboard Cards Section */}
        <div className="container" style={{ paddingRight: "2rem" }}>
          {" "}
          {/* Added paddingRight */}
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 row-cols-xl-4 g-4 justify-content-center">
            {cards.map((card, index) => (
              <div className="col" key={index}>
                <Link to={card.link} className="text-decoration-none">
                  <div className="card h-100 shadow-sm border-0 hover-effect">
                    <div className="card-body text-center p-4 d-flex flex-column align-items-center">
                      <div
                        className="icon-wrapper mb-3"
                        style={{ fontSize: "2rem" }}
                      >
                        {card.icon}
                      </div>
                      <h5
                        className="card-title mb-2"
                        style={{ color: "#343a40" }}
                      >
                        {card.title}
                      </h5>
                      <p
                        className="card-text text-muted"
                        style={{ fontSize: "0.9rem" }}
                      >
                        {card.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer
        className="mt-auto py-3"
        style={{
          backgroundColor: "#f8f9fa",
          borderTop: "1px solid #dee2e6",
          paddingRight: "0rem",
          paddingLeft: "1rem",
        }} // Added paddingRight
      >
        <div className="container text-center">
          <p className="mb-0 text-muted" style={{ fontSize: "0.875rem" }}>
            Developed by: A.B.C.C
          </p>
        </div>
      </footer>

      {/* Add some custom styles */}
      <style>{`
    .hover-effect {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      border-radius: 0.5rem;
    }
    .hover-effect:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    .icon-wrapper {
      transition: transform 0.3s ease;
    }
    .hover-effect:hover .icon-wrapper {
      transform: scale(1.1);
    }
    
    @media (min-width: 992px) {
      .home-user-container {
        margin-left: 5rem; /* Changed from 1.5rem to 4rem (approx 2 inches) */
      }
    }
  `}</style>
    </div>
  );
};

export default HomeUser;
