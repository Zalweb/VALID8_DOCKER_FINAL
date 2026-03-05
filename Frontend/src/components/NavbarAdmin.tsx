import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaRegListAlt,
  FaPlusCircle,
  FaBars,
  FaTimes,
  FaThList,
  FaEdit,
  FaPlus,
} from "react-icons/fa";
import { useUser } from "../context/UserContext";
import logoValid8 from "../assets/images/logo-valid83_transparent.png";
import defaultAvatar from "../assets/images/userprofile1.png";
import "../css/NavbarAdmin.css";

export const NavbarAdmin = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { avatar } = useUser();

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
        <div className="admin-hamburger" onClick={toggleSidebar}>
          <FaBars />
        </div>
      )}

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* Sidebar */}
      <div
        className={`admin-sidebar ${sidebarOpen ? "open" : ""} ${
          isExpanded ? "expanded" : "collapsed"
        }`}
      >
        {/* Header with Logo, Title, and Close Button */}
        <div className="admin-sidebar-header">
          <div className="header-content-wrapper">
            <img src={logoValid8} alt="Valid 8 logo" className="sidebar-logo" />
            <h1 className="admin-title">Admin</h1>
          </div>
          {sidebarOpen && (
            <button className="sidebar-close-btn" onClick={toggleSidebar}>
              <FaTimes />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="admin-nav">
          <ul className="admin-nav-menu">
            {/* Menu Toggle Button */}
            <li className="menu-toggle-item">
              <button
                className="admin-nav-link menu-toggle-btn"
                onClick={toggleExpand}
                title={isExpanded ? "Collapse menu" : "Expand menu"}
              >
                <FaThList className="nav-icon" />
                <span className="nav-text">Menu</span>
              </button>
            </li>

            <li>
              <NavLink
                to="/admin_home"
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
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
                to="/admin_events"
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
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
                to="/admin_manage_users"
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Manage Users"
              >
                <FaEdit className="nav-icon" />
                <span className="nav-text">Manage Users</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin_create_users"
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Create Users"
              >
                <FaPlusCircle className="nav-icon" />
                <span className="nav-text">Create Users</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/admin_create_department_program"
                className={({ isActive }) =>
                  isActive ? "admin-nav-link active" : "admin-nav-link"
                }
                onClick={() => setSidebarOpen(false)}
                title="Create Department & Program"
              >
                <FaPlus className="nav-icon" />
                <span className="nav-text">Create Department & Program</span>
              </NavLink>
            </li>
          </ul>
        </nav>

        {/* User Profile Section */}
        <div className="admin-sidebar-footer">
          <NavLink
            to="/admin_profile"
            className={({ isActive }) =>
              isActive ? "admin-profile-link active" : "admin-profile-link"
            }
            onClick={() => setSidebarOpen(false)}
            title="Profile"
          >
            <img
              src={avatar || defaultAvatar}
              alt="user profile"
              className="admin-profile-img"
            />
            <span className="profile-text">Profile</span>
          </NavLink>
        </div>
      </div>

      {/* Main Content Area */}
      <div
        className={`admin-content ${sidebarOpen ? "shifted" : ""} ${
          isExpanded ? "content-expanded" : "content-collapsed"
        }`}
      ></div>
    </>
  );
};

export default NavbarAdmin;
