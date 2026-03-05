import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaPlayCircle,
  FaClipboardCheck,
  FaBars,
  FaTimes,
  FaThList,
} from "react-icons/fa";
import logoValid8 from "../assets/images/logo-valid83_transparent.png";
import userprofile from "../assets/images/userprofile.png";
import "../css/NavbarStudentStyles.css";

export const NavbarStudent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Hamburger Icon - Only shows when sidebar is closed */}
      {!sidebarOpen && (
        <div className="student-hamburger" onClick={toggleSidebar}>
          <FaBars />
        </div>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div
        className={`student-sidebar ${sidebarOpen ? "open" : ""} ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        {/* Header with Logo, Title, and Close Button */}
        <div className="student-sidebar-header">
          <div className="header-content-wrapper">
            <img src={logoValid8} alt="Valid 8 logo" className="sidebar-logo" />
            <h1 className="student-title">Student</h1>
          </div>
          {sidebarOpen && (
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="student-nav">
          <ul className="student-nav-menu">
            {/* Menu Toggle Button */}
            <li className="menu-toggle-item">
              <button
                className="student-nav-link menu-toggle-btn"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse menu" : "Expand menu"}
              >
                <FaThList className="nav-icon" />
                <span className="nav-text">Menu</span>
              </button>
            </li>

            <li>
              <NavLink
                to="/student_home"
                className={({ isActive }) =>
                  isActive ? "student-nav-link active" : "student-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Home"
              >
                <FaHome className="nav-icon" />
                <span className="nav-text">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/student_upcoming_events"
                className={({ isActive }) =>
                  isActive ? "student-nav-link active" : "student-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Upcoming Events"
              >
                <FaCalendarAlt className="nav-icon" />
                <span className="nav-text">Upcoming Events</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/student_ongoing_events"
                className={({ isActive }) =>
                  isActive ? "student-nav-link active" : "student-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Ongoing Events"
              >
                <FaPlayCircle className="nav-icon" />
                <span className="nav-text">Ongoing Events</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/student_events_attended"
                className={({ isActive }) =>
                  isActive ? "student-nav-link active" : "student-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Events Attended"
              >
                <FaClipboardCheck className="nav-icon" />
                <span className="nav-text">Events Attended</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="student-sidebar-footer">
          <NavLink
            to="/student_profile"
            className={({ isActive }) =>
              isActive ? "student-profile-link active" : "student-profile-link"
            }
            onClick={() => setSidebarOpen(false)}
            title="Profile"
          >
            <img
              src={userprofile}
              alt="user profile"
              className="student-profile-img"
            />
            <span className="profile-text">Profile</span>
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`student-content ${sidebarOpen ? "shifted" : ""} ${
          isExpanded ? "content-expanded" : "content-collapsed"
        }`}
      ></div>
    </>
  );
};

export default NavbarStudent;
