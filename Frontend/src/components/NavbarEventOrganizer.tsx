import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaPlusCircle,
  FaClipboardList,
  FaBars,
  FaTimes,
  FaThList,
} from "react-icons/fa";
import logoValid8 from "../assets/images/logo-valid83_transparent.png";
import userprofile from "../assets/images/userprofile.png";
import "../css/NavbarEventOrganizer.css";

export const NavbarEventOrganizer = () => {
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
        <div className="event-organizer-hamburger" onClick={toggleSidebar}>
          <FaBars />
        </div>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div
        className={`event-organizer-sidebar ${sidebarOpen ? "open" : ""} ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        {/* Header with Logo, Title, and Close Button */}
        <div className="event-organizer-sidebar-header">
          <div className="header-content-wrapper">
            <img src={logoValid8} alt="Valid 8 logo" className="sidebar-logo" />
            <h1 className="event-organizer-title">Event Organizer</h1>
          </div>
          {sidebarOpen && (
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="event-organizer-nav">
          <ul className="event-organizer-nav-menu">
            {/* Menu Toggle Button */}
            <li className="menu-toggle-item">
              <button
                className="event-organizer-nav-link menu-toggle-btn"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse menu" : "Expand menu"}
              >
                <FaThList className="nav-icon" />
                <span className="nav-text">Menu</span>
              </button>
            </li>

            <li>
              <NavLink
                to="/event_organizer_home"
                className={({ isActive }) =>
                  isActive
                    ? "event-organizer-nav-link active"
                    : "event-organizer-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
              >
                <FaHome className="nav-icon" />
                <span className="nav-text">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/event_organizer_create_event"
                className={({ isActive }) =>
                  isActive
                    ? "event-organizer-nav-link active"
                    : "event-organizer-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
              >
                <FaPlusCircle className="nav-icon" />
                <span className="nav-text">Create Event</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/event_organizer_manage_event"
                className={({ isActive }) =>
                  isActive
                    ? "event-organizer-nav-link active"
                    : "event-organizer-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
              >
                <FaClipboardList className="nav-icon" />
                <span className="nav-text">Manage Events</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="event-organizer-sidebar-footer">
          <NavLink
            to="/event_organizer_profile"
            className={({ isActive }) =>
              isActive
                ? "event-organizer-profile-link active"
                : "event-organizer-profile-link"
            }
            onClick={() => setSidebarOpen(false)}
          >
            <img
              src={userprofile}
              alt="user profile"
              className="event-organizer-profile-img"
            />
            <span className="profile-text">Profile</span>
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`event-organizer-content ${sidebarOpen ? "shifted" : ""} ${
          isExpanded ? "content-expanded" : "content-collapsed"
        }`}
      ></div>
    </>
  );
};

export default NavbarEventOrganizer;
