import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaPlayCircle,
  FaClipboardCheck,
  FaRegListAlt,
  FaClipboard,
  FaBars,
  FaTimes,
  FaThList,
  FaUserCheck,
} from "react-icons/fa";
import logoValid8 from "../assets/images/logo-valid83_transparent.png";
import userprofile from "../assets/images/userprofile.png";
import "../css/NavbarStudentSSG.css";

export const NavbarStudentSSG = () => {
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
        <div className="ssg-hamburger" onClick={toggleSidebar}>
          <FaBars />
        </div>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div
        className={`ssg-sidebar ${sidebarOpen ? "open" : ""} ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        {/* Header with Logo, Title, and Close Button */}
        <div className="ssg-sidebar-header">
          <div className="header-content-wrapper">
            <img src={logoValid8} alt="Valid 8 logo" className="sidebar-logo" />
            <h1 className="ssg-title">
              Student
              <br />
              Officer
            </h1>
          </div>
          {sidebarOpen && (
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="ssg-nav">
          <ul className="ssg-nav-menu">
            {/* Menu Toggle Button */}
            <li className="menu-toggle-item">
              <button
                className="ssg-nav-link menu-toggle-btn"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse menu" : "Expand menu"}
              >
                <FaThList className="nav-icon" />
                <span className="nav-text">Menu</span>
              </button>
            </li>

            <li>
              <NavLink
                to="/studentssg_home"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
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
                to="/studentssg_upcoming_events"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
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
                to="/studentssg_ongoing_events"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
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
                to="/studentssg_events_attended"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Events Attended"
              >
                <FaClipboardCheck className="nav-icon" />
                <span className="nav-text">Events Attended</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/studentssg_events"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Events"
              >
                <FaRegListAlt className="nav-icon" />
                <span className="nav-text">Events</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/studentssg_records"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Records"
              >
                <FaClipboard className="nav-icon" />
                <span className="nav-text">Records</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/studentssg_manual_attendance"
                className={({ isActive }) =>
                  isActive ? "ssg-nav-link active" : "ssg-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Manual Attendance"
              >
                <FaUserCheck className="nav-icon" />
                <span className="nav-text">Manual Attendance</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="ssg-sidebar-footer">
          <NavLink
            to="/studentssg_profile"
            className={({ isActive }) =>
              isActive ? "ssg-profile-link active" : "ssg-profile-link"
            }
            onClick={() => setSidebarOpen(false)}
            title="Profile"
          >
            <img
              src={userprofile}
              alt="user profile"
              className="ssg-profile-img"
            />
            <span className="profile-text">Profile</span>
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`ssg-content ${sidebarOpen ? "shifted" : ""} ${
          isExpanded ? "content-expanded" : "content-collapsed"
        }`}
      ></div>
    </>
  );
};

export default NavbarStudentSSG;
