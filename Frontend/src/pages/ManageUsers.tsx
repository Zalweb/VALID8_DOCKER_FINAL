import { useState, useEffect, useRef } from "react";
import { NavbarAdmin } from "../components/NavbarAdmin";
import { AiFillEdit, AiFillCloseCircle } from "react-icons/ai";
import search_logo from "../assets/images/search_logo.png";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import "../css/ManageUsers.css";

// Define interfaces based on your API schemas
interface User {
  id: number;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  is_active: boolean;
  created_at: string;
  roles: UserRole[];
  student_profile?: StudentProfile;
  ssg_profile?: SSGProfile;
}

interface UserRole {
  role: {
    name: string;
  };
}

interface StudentProfile {
  id: number;
  student_id?: string;
  year_level?: number;
  department?: Department;
  program?: Program;
  department_id?: number; // Add this field to match your state management
  program_id?: number; // Add this field to match your state management
}

interface SSGProfile {
  id: number;
  position: string;
}

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
  department_ids?: number[];
}

// Enum for roles
enum RoleEnum {
  ADMIN = "admin",
  STUDENT = "student",
  SSG = "ssg",
  EVENT_ORGANIZER = "event-organizer",
}

// Enum for SSG positions
enum SSGPositionEnum {
  PRESIDENT = "President",
  VICE_PRESIDENT = "Vice President",
  SECRETARY = "Secretary",
  TREASURER = "Treasurer",
  AUDITOR = "Auditor",
  PIO = "Public Information Officer",
  REPRESENTATIVE = "Representative",
  OTHER = "Other",
}

Modal.setAppElement("#root");

export const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);

  // Edit user state
  const [editedUser, setEditedUser] = useState<Partial<User>>({
    email: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    roles: [],
  });
  const [editStudentProfile, setEditStudentProfile] = useState<
    Partial<StudentProfile>
  >({});
  const [editSSGProfile, setEditSSGProfile] = useState<Partial<SSGProfile>>({});
  const [editProfileImage, setEditProfileImage] = useState<File | null>(null);
  const [editPreviewImage, setEditPreviewImage] = useState<string | null>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const API_URL = `${BASE_URL}/users`;

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

  // Fetch users from API
  const fetchUsers = async () => {
    try {
      const response = await fetchWithAuth(API_URL);
      const data = await response.json();
      setUsers(data);
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  // Fetch departments and programs
  const fetchDepartmentsAndPrograms = async () => {
    try {
      const [deptsResponse, progsResponse] = await Promise.all([
        fetchWithAuth(`${BASE_URL}/departments`),
        fetchWithAuth(`${BASE_URL}/programs`),
      ]);

      const deptsData = await deptsResponse.json();
      const progsData = await progsResponse.json();

      setDepartments(deptsData);
      setPrograms(progsData);
    } catch (err) {
      console.error("Error fetching departments or programs:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartmentsAndPrograms();
  }, []);

  const getFullName = (user: User) => {
    return [user.first_name || "", user.middle_name || "", user.last_name || ""]
      .filter(Boolean)
      .join(" ");
  };

  const handleEditClick = (index: number) => {
    const user = users[index];
    setEditIndex(index);
    setEditedUser({ ...user });

    // Set student profile if exists
    if (user.student_profile) {
      setEditStudentProfile({
        student_id: user.student_profile.student_id,
        year_level: user.student_profile.year_level,
        department_id: user.student_profile.department?.id,
        program_id: user.student_profile.program?.id,
      });
    } else {
      setEditStudentProfile({});
    }

    // Set SSG profile if exists
    if (user.ssg_profile) {
      setEditSSGProfile({
        position: user.ssg_profile.position,
      });
    } else {
      setEditSSGProfile({});
    }

    setEditPreviewImage(null); // Reset preview image
    setValidationErrors({});
  };

  const validateFields = (user: Partial<User>) => {
    const errors: Record<string, string> = {};

    if (!user.first_name?.trim()) {
      errors.first_name = "First name is required";
    }

    if (!user.last_name?.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!user.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      errors.email = "Email is invalid";
    }

    if (!user.roles || user.roles.length === 0) {
      errors.roles = "At least one role must be selected";
    }

    // Validate student profile if user has student role
    const hasStudentRole = user.roles?.some(
      (r) => r.role.name === RoleEnum.STUDENT
    );
    if (hasStudentRole) {
      if (!editStudentProfile?.student_id?.trim()) {
        errors.student_id = "Student ID is required";
      }
      if (!editStudentProfile?.year_level) {
        errors.year_level = "Year level is required";
      }
      if (!editStudentProfile?.program_id) {
        errors.program_id = "Program is required";
      }
      if (!editStudentProfile?.department_id) {
        errors.department_id = "Department is required";
      }
    }

    // Validate SSG profile if user has SSG role
    const hasSSGRole = user.roles?.some((r) => r.role.name === RoleEnum.SSG);
    if (hasSSGRole && !editSSGProfile?.position) {
      errors.position = "Position is required for SSG Officers";
    }

    return errors;
  };

  const handleSaveChanges = async () => {
    if (editIndex === null || !editedUser.id) {
      console.error("No user selected for editing or missing ID");
      return;
    }

    const errors = validateFields(editedUser);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      // Prepare the user update data
      const userUpdateData: any = {
        email: editedUser.email,
        first_name: editedUser.first_name,
        last_name: editedUser.last_name,
        middle_name: editedUser.middle_name,
      };

      // If roles are being updated
      if (editedUser.roles) {
        const roleUpdate = {
          roles: editedUser.roles.map((r) => r.role.name),
        };
        await fetchWithAuth(`${API_URL}/${editedUser.id}/roles`, {
          method: "PUT",
          body: JSON.stringify(roleUpdate),
        });
      }

      // Update user basic info
      await fetchWithAuth(`${API_URL}/${editedUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(userUpdateData),
      });

      // Handle student profile
      const hasStudentRole = editedUser.roles?.some(
        (r) => r.role.name === RoleEnum.STUDENT
      );
      if (hasStudentRole) {
        if (editedUser.student_profile) {
          // Update existing student profile
          await fetchWithAuth(
            `${API_URL}/student-profiles/${editedUser.student_profile.id}`,
            {
              method: "PATCH",
              body: JSON.stringify(editStudentProfile),
            }
          );
        } else {
          // Create new student profile
          const studentProfileCreate = {
            user_id: editedUser.id,
            ...editStudentProfile,
          };
          await fetchWithAuth(`${API_URL}/admin/students/`, {
            method: "POST",
            body: JSON.stringify(studentProfileCreate),
          });
        }
      } else if (editedUser.student_profile) {
        // Remove student profile if role was removed
        await fetchWithAuth(
          `${API_URL}/student-profiles/${editedUser.student_profile.id}`,
          {
            method: "DELETE",
          }
        );
      }

      // Handle SSG profile
      const hasSSGRole = editedUser.roles?.some(
        (r) => r.role.name === RoleEnum.SSG
      );
      if (hasSSGRole) {
        if (editedUser.ssg_profile) {
          // Update existing SSG profile
          await fetchWithAuth(
            `${API_URL}/ssg-profiles/${editedUser.ssg_profile.id}`,
            {
              method: "PUT",
              body: JSON.stringify(editSSGProfile),
            }
          );
        } else {
          // Create new SSG profile
          const ssgProfileCreate = {
            user_id: editedUser.id,
            ...editSSGProfile,
          };
          await fetchWithAuth(`${API_URL}/ssg-profiles/`, {
            method: "POST",
            body: JSON.stringify(ssgProfileCreate),
          });
        }
      } else if (editedUser.ssg_profile) {
        // Remove SSG profile if role was removed
        await fetchWithAuth(
          `${API_URL}/ssg-profiles/${editedUser.ssg_profile.id}`,
          {
            method: "DELETE",
          }
        );
      }

      // Handle profile image upload if changed
      if (editProfileImage) {
        const formData = new FormData();
        formData.append("file", editProfileImage);
        await fetchWithAuth(`${API_URL}/${editedUser.id}/upload-photo`, {
          method: "POST",
          body: formData,
          headers: {
            // Remove Content-Type header for FormData
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
      }

      // Refresh the user list
      await fetchUsers();
      setEditIndex(null);
      setValidationErrors({});
    } catch (err) {
      console.error("Update error:", err);
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteClick = (index: number) => {
    setDeleteIndex(index);
  };

  const handleConfirmDelete = async () => {
    if (deleteIndex === null) return;

    try {
      const userId = users[deleteIndex].id;
      await fetchWithAuth(`${API_URL}/${userId}`, {
        method: "DELETE",
      });

      // Refresh the user list
      await fetchUsers();
      setDeleteIndex(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  const toggleRoleSelection = (roleName: string) => {
    if (!editedUser.roles) return;

    const roleEnumValue = Object.values(RoleEnum).find(
      (r) => r.toLowerCase() === roleName.toLowerCase()
    );
    if (!roleEnumValue) return;

    const newRoles = [...editedUser.roles];
    const existingIndex = newRoles.findIndex(
      (r) => r.role.name === roleEnumValue
    );

    if (existingIndex >= 0) {
      newRoles.splice(existingIndex, 1);
    } else {
      newRoles.push({ role: { name: roleEnumValue } });
    }

    setEditedUser({ ...editedUser, roles: newRoles });
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerEditFileInput = () => {
    editFileInputRef.current?.click();
  };

  const getRoleBadge = (role: UserRole) => {
    const roleName = role.role.name;
    let badgeClass = "";

    switch (roleName) {
      case RoleEnum.ADMIN:
        badgeClass = "badge bg-primary";
        break;
      case RoleEnum.STUDENT:
        badgeClass = "badge bg-success";
        break;
      case RoleEnum.SSG:
      case RoleEnum.EVENT_ORGANIZER:
        badgeClass = "badge bg-warning";
        break;
      default:
        badgeClass = "badge bg-secondary";
    }

    // Format the display name
    let displayName = roleName;
    if (roleName === RoleEnum.EVENT_ORGANIZER) displayName = "Event Organizer";
    if (roleName === RoleEnum.SSG) displayName = "SSG Officer";

    return <span className={badgeClass}>{displayName}</span>;
  };

  const filteredUsers = users.filter((user) => {
    const fullName = getFullName(user);
    const userRoles = user.roles || [];
    const roleNames = userRoles.map((r) => r.role.name).join(", ");
    const studentId = user.student_profile?.student_id || "";
    const yearLevel = user.student_profile?.year_level?.toString() || "";
    const program = user.student_profile?.program?.name || "";
    const position = user.ssg_profile?.position || "";

    return [
      fullName,
      user.email,
      roleNames,
      studentId,
      yearLevel,
      program,
      position,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
  });

  if (isLoading) {
    return (
      <div className="manage-users-page">
        <NavbarAdmin />
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-users-page">
        <NavbarAdmin />
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-users-page">
      <NavbarAdmin />
      <div className="manage-users-container">
        <header className="manage-users-header">
          <h2>User Management</h2>
          <p className="subtitle">
            View and manage all system users and their permissions
          </p>
        </header>

        {/* Search Bar and Add User Button */}
        <div className="search-container">
          <div className="search-box">
            <img src={search_logo} alt="search" className="search-icon" />
            <input
              type="search"
              placeholder="Search users by name, email or role..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Details</th>
                <th>Roles</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id || index}>
                  <td data-label="Name">{getFullName(user)}</td>
                  <td data-label="Email">{user.email}</td>
                  <td data-label="Details">
                    {user.student_profile && (
                      <>
                        {user.student_profile.student_id && (
                          <div>ID: {user.student_profile.student_id}</div>
                        )}
                        {user.student_profile.year_level && (
                          <div>Year: {user.student_profile.year_level}</div>
                        )}
                        {user.student_profile.program && (
                          <div>
                            Program: {user.student_profile.program.name}
                          </div>
                        )}
                        {user.student_profile.department && (
                          <div>
                            Dept: {user.student_profile.department.name}
                          </div>
                        )}
                      </>
                    )}
                    {user.ssg_profile && (
                      <div>Position: {user.ssg_profile.position}</div>
                    )}
                  </td>
                  <td data-label="Roles">
                    <div className="role-badges">
                      {user.roles.map((role, i) => (
                        <span key={i}>{getRoleBadge(role)}</span>
                      ))}
                    </div>
                  </td>
                  <td data-label="Actions" className="actions-cell">
                    <div className="button-group">
                      <button
                        className="btn btn-info"
                        onClick={() => handleEditClick(index)}
                      >
                        <AiFillEdit /> Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteClick(index)}
                      >
                        <AiFillCloseCircle /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="no-results">
                    No matching users found. Try a different search term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Edit User Modal */}
        <Modal
          isOpen={editIndex !== null}
          onRequestClose={() => {
            setEditIndex(null);
            setValidationErrors({});
          }}
          className="user-modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-header">
            <h3>Edit User</h3>
            <button
              onClick={() => {
                setEditIndex(null);
                setValidationErrors({});
              }}
              className="close-button"
            >
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="form-group">
              <label>Profile Image</label>
              <div className="image-upload-container">
                <div className="image-preview" onClick={triggerEditFileInput}>
                  {editPreviewImage ? (
                    <img src={editPreviewImage} alt="Preview" />
                  ) : (
                    <div className="upload-placeholder">
                      Click to upload image
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={handleEditImageChange}
                  accept="image/*"
                  style={{ display: "none" }}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="editFirstName">First Name</label>
              <input
                type="text"
                id="editFirstName"
                value={editedUser.first_name || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, first_name: e.target.value })
                }
                className={validationErrors.first_name ? "input-error" : ""}
              />
              {validationErrors.first_name && (
                <div className="error-message">
                  {validationErrors.first_name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="editMiddleName">Middle Name (Optional)</label>
              <input
                type="text"
                id="editMiddleName"
                value={editedUser.middle_name || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, middle_name: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="editLastName">Last Name</label>
              <input
                type="text"
                id="editLastName"
                value={editedUser.last_name || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, last_name: e.target.value })
                }
                className={validationErrors.last_name ? "input-error" : ""}
              />
              {validationErrors.last_name && (
                <div className="error-message">
                  {validationErrors.last_name}
                </div>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="editEmail">Email</label>
              <input
                type="email"
                id="editEmail"
                value={editedUser.email || ""}
                onChange={(e) =>
                  setEditedUser({ ...editedUser, email: e.target.value })
                }
                className={validationErrors.email ? "input-error" : ""}
              />
              {validationErrors.email && (
                <div className="error-message">{validationErrors.email}</div>
              )}
            </div>

            {/* Student Profile Fields */}
            {editedUser.roles?.some(
              (r) => r.role.name === RoleEnum.STUDENT
            ) && (
              <>
                <div className="form-group">
                  <label htmlFor="editStudentId">Student ID</label>
                  <input
                    type="text"
                    id="editStudentId"
                    placeholder="Student ID"
                    value={editStudentProfile.student_id || ""}
                    onChange={(e) =>
                      setEditStudentProfile({
                        ...editStudentProfile,
                        student_id: e.target.value,
                      })
                    }
                    className={validationErrors.student_id ? "input-error" : ""}
                  />
                  {validationErrors.student_id && (
                    <div className="error-message">
                      {validationErrors.student_id}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="editYearLevel">Year Level</label>
                  <select
                    id="editYearLevel"
                    value={editStudentProfile.year_level || 1}
                    onChange={(e) =>
                      setEditStudentProfile({
                        ...editStudentProfile,
                        year_level: parseInt(e.target.value),
                      })
                    }
                    className={validationErrors.year_level ? "input-error" : ""}
                  >
                    {[1, 2, 3, 4, 5].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                  {validationErrors.year_level && (
                    <div className="error-message">
                      {validationErrors.year_level}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="editDepartment">Department</label>
                  <select
                    id="editDepartment"
                    value={editStudentProfile.department_id || ""}
                    onChange={(e) =>
                      setEditStudentProfile({
                        ...editStudentProfile,
                        department_id: parseInt(e.target.value),
                      })
                    }
                    className={
                      validationErrors.department_id ? "input-error" : ""
                    }
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.department_id && (
                    <div className="error-message">
                      {validationErrors.department_id}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="editProgram">Program</label>
                  <select
                    id="editProgram"
                    value={editStudentProfile.program_id || ""}
                    onChange={(e) =>
                      setEditStudentProfile({
                        ...editStudentProfile,
                        program_id: parseInt(e.target.value),
                      })
                    }
                    className={validationErrors.program_id ? "input-error" : ""}
                  >
                    <option value="">Select Program</option>
                    {programs
                      .filter(
                        (prog) =>
                          !editStudentProfile.department_id ||
                          prog.department_ids?.includes(
                            editStudentProfile.department_id
                          )
                      )
                      .map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {prog.name}
                        </option>
                      ))}
                  </select>
                  {validationErrors.program_id && (
                    <div className="error-message">
                      {validationErrors.program_id}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* SSG Profile Fields */}
            {editedUser.roles?.some((r) => r.role.name === RoleEnum.SSG) && (
              <div className="form-group">
                <label htmlFor="editPosition">Position</label>
                <select
                  id="editPosition"
                  value={editSSGProfile.position || ""}
                  onChange={(e) =>
                    setEditSSGProfile({
                      ...editSSGProfile,
                      position: e.target.value,
                    })
                  }
                  className={validationErrors.position ? "input-error" : ""}
                >
                  <option value="">Select Position</option>
                  {Object.values(SSGPositionEnum).map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
                {validationErrors.position && (
                  <div className="error-message">
                    {validationErrors.position}
                  </div>
                )}
              </div>
            )}

            <div className="form-group">
              <label>Roles</label>
              <div className="role-selection">
                {Object.values(RoleEnum).map((role) => {
                  const displayName =
                    role === RoleEnum.EVENT_ORGANIZER
                      ? "Event Organizer"
                      : role === RoleEnum.SSG
                      ? "SSG Officer"
                      : role.charAt(0).toUpperCase() + role.slice(1);

                  return (
                    <label key={role} className="role-checkbox">
                      <input
                        type="checkbox"
                        checked={
                          editedUser.roles?.some((r) => r.role.name === role) ||
                          false
                        }
                        onChange={() => toggleRoleSelection(role)}
                      />
                      <span className="checkmark"></span>
                      {displayName}
                    </label>
                  );
                })}
              </div>
              {validationErrors.roles && (
                <div className="error-message">{validationErrors.roles}</div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setEditIndex(null);
                setValidationErrors({});
              }}
            >
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveChanges}>
              Save Changes
            </button>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteIndex !== null}
          onRequestClose={() => setDeleteIndex(null)}
          className="confirmation-modal"
          overlayClassName="modal-overlay"
        >
          <div className="modal-header">
            <h3>Confirm Deletion</h3>
          </div>
          <div className="modal-body">
            <p>Are you sure you want to delete this user?</p>
            {deleteIndex !== null && (
              <div className="user-to-delete">
                <p>
                  {getFullName(users[deleteIndex])} ({users[deleteIndex].email})
                </p>
                <p>
                  Roles:{" "}
                  {users[deleteIndex].roles.map((r) => r.role.name).join(", ")}
                </p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              className="btn btn-outline-secondary"
              onClick={() => setDeleteIndex(null)}
            >
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleConfirmDelete}>
              Delete User
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default ManageUsers;
