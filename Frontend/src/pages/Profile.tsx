import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoutButton from "../components/LogoutButton";
import NavbarStudent from "../components/NavbarStudent";
import NavbarAdmin from "../components/NavbarAdmin";
import NavbarEventOrganizer from "../components/NavbarEventOrganizer";
import NavbarSSG from "../components/NavbarSSG";
import NavbarStudentSSG from "../components/NavbarStudentSSG";
import NavbarStudentSSGEventOrganizer from "../components/NavbarStudentSSGEventOrganizer";
import defaultAvatar from "../assets/images/userprofile1.png";
import { FaSave, FaEdit, FaSpinner, FaTimes, FaCheck } from "react-icons/fa";
import "../css/Profile.css";

// Corrected interfaces
interface Role {
  id: number;
  name: string;
}

interface UserRoleResponse {
  role: Role;
}

interface UserData {
  id: number;
  email: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  is_active: boolean;
  created_at: string;
  roles: UserRoleResponse[];
  student_profile?: {
    id: number;
    student_id: string;
    department_id: number;
    program_id: number;
    year_level: number;
  };
  ssg_profile?: {
    id: number;
    position: string;
  };
}

interface ProfileProps {
  role: string;
}

export const Profile: React.FC<ProfileProps> = ({ role }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEmail, setEditedEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Improved fetchWithAuth function with better error handling
  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("access_token");
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
        localStorage.removeItem("access_token");
        navigate("/login");
        throw new Error("Session expired. Please login again.");
      }

      // If response is not OK, try to parse error details
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          // Try to parse error as JSON
          errorData = JSON.parse(errorText);
          console.error("API Error Response:", errorData);

          // Extract error message from common API error formats
          if (errorData.detail) {
            errorMessage =
              typeof errorData.detail === "string"
                ? errorData.detail
                : JSON.stringify(errorData.detail);
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === "object") {
            // Handle validation errors that might be nested
            errorMessage = JSON.stringify(errorData);
          }
        } catch (e) {
          // If not JSON, use raw error text
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

  // Check if user is logged in before fetching data
  const checkAuthentication = (): boolean => {
    const token =
      localStorage.getItem("authToken") || localStorage.getItem("access_token");
    if (!token) {
      setError("You must be logged in to access this page");
      setIsLoading(false);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);

      if (!checkAuthentication()) return;

      try {
        const response = await fetchWithAuth(`${BASE_URL}/users/me/`);
        const data = await response.json();

        setUserData(data);
        setEditedEmail(data.email);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load profile. Please try again later."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [BASE_URL, navigate]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditedEmail(e.target.value);
  };

  // Modify your handleSave function to include success handling
  const handleSave = async () => {
    if (!userData) return;

    if (!checkAuthentication()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      // Only send email update
      const updateData = {
        email: editedEmail,
      };

      // Using PATCH to update just the email field
      await fetchWithAuth(`${BASE_URL}/users/${userData.id}`, {
        method: "PATCH",
        body: JSON.stringify(updateData),
      });

      // Show success message
      setSuccessMessage("Email successfully updated!");

      // Refresh user data after update
      const response = await fetchWithAuth(`${BASE_URL}/users/me/`);
      const updatedData = await response.json();

      setUserData(updatedData);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setIsEditing(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !userData) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error && !userData) {
    return (
      <div className="profile-error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="profile-error">
        <p>Could not load profile data.</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Helper function to render a login prompt if not authenticated
  const renderLoginPrompt = () => (
    <div className="profile-page">
      {/* Navbar Selection */}
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "student" ? (
        <NavbarStudent />
      ) : role === "admin" ? (
        <NavbarAdmin />
      ) : role === "event-organizer" ? (
        <NavbarEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : (
        <h1>Role Not Found</h1>
      )}

      <div className="profile-container">
        <div className="error-message">
          <FaTimes className="error-icon" />
          {error}
        </div>
        <div className="login-prompt">
          <p>Please log in to access your profile.</p>
          <button onClick={() => navigate("/login")} className="primary-button">
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );

  // Return login prompt if authentication error occurs
  if (!isLoading && error?.includes("log in")) {
    return renderLoginPrompt();
  }

  const fullName = `${userData.first_name} ${
    userData.middle_name ? userData.middle_name + " " : ""
  }${userData.last_name}`;

  const userRoles = userData.roles
    ? userData.roles.map((roleResponse) => roleResponse.role.name).join(", ")
    : "No roles assigned";

  return (
    <div className="profile-page">
      {/* Navbar Selection */}
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "student" ? (
        <NavbarStudent />
      ) : role === "admin" ? (
        <NavbarAdmin />
      ) : role === "event-organizer" ? (
        <NavbarEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : (
        <h1>Role Not Found</h1>
      )}

      <div className="profile-container">
        <div className="profile-header">
          <h1>User Profile</h1>
          {!isEditing && (
            <button className="edit-button" onClick={() => setIsEditing(true)}>
              <FaEdit /> Edit Profile
            </button>
          )}
        </div>

        <div className="avatar-container">
          <img
            src={defaultAvatar}
            alt="user profile"
            className="profile-avatar"
          />
        </div>

        <div className="profile-info">
          <div className="info-item">
            <label>Name:</label>
            <p>{fullName}</p>
          </div>

          <div className="info-item">
            <label>Role:</label>
            <p>{userRoles}</p>
          </div>

          <div className="info-item">
            <label>Email:</label>
            {isEditing ? (
              <input
                type="email"
                value={editedEmail}
                onChange={handleEmailChange}
                className="email-input"
              />
            ) : (
              <p>{userData.email}</p>
            )}
          </div>

          {userData.student_profile && (
            <div className="info-item">
              <label>Student ID:</label>
              <p>{userData.student_profile.student_id}</p>
            </div>
          )}

          {userData.student_profile && (
            <div className="info-item">
              <label>Year Level:</label>
              <p>{userData.student_profile.year_level}</p>
            </div>
          )}

          {userData.ssg_profile && (
            <div className="info-item">
              <label>Position:</label>
              <p>{userData.ssg_profile.position}</p>
            </div>
          )}
        </div>

        {successMessage && (
          <div className="success-message">
            <FaCheck className="success-icon" />
            {successMessage}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {isEditing ? (
          <div className="action-buttons">
            <button
              className="save-button"
              onClick={handleSave}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner-icon" /> Saving...
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setIsEditing(false);
                setEditedEmail(userData.email);
                setError(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="logout-container">
            <LogoutButton />
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
