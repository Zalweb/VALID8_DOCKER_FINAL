import { useState, useEffect } from "react";
import { NavbarAdmin } from "../components/NavbarAdmin";
import { Link, useNavigate } from "react-router-dom";
import {} from "../css/CreateUsers.css";

// Updated to match backend API structure
interface UserCreate {
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  password: string;
  roles: string[]; // Use lowercase role values to match backend
}

interface StudentProfileCreate {
  user_id: number;
  student_id: string;
  department_id: number;
  program_id: number;
  year_level: number;
  // Face encoding will be handled separately with image
}

interface SSGProfileCreate {
  user_id: number;
  position: string;
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

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const USER_API = `${BASE_URL}/users`;
const DEPARTMENT_API = `${BASE_URL}/departments`;
const PROGRAM_API = `${BASE_URL}/programs`;
const SSG_POSITIONS_API = `${BASE_URL}/users/ssg-positions/`;
console.log("Fetching SSG positions from:", SSG_POSITIONS_API);

// Match backend role values
const availableRoles = [
  { value: "student", label: "Student" },
  { value: "ssg", label: "SSG Officer" },
  { value: "event-organizer", label: "Event Organizer" },
  { value: "admin", label: "Admin" },
];

const yearLevels = [1, 2, 3, 4, 5];

export const CreateUsers: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // User state with properly named fields to match backend
  const [user, setUser] = useState<UserCreate>({
    first_name: "",
    middle_name: "",
    last_name: "",
    email: "",
    password: "",
    roles: [],
  });

  // Additional state for password confirmation (front-end only)
  const [confirmPassword, setConfirmPassword] = useState("");

  // State for form data that will be used in separate API calls
  const [studentId, setStudentId] = useState("");
  const [yearLevel, setYearLevel] = useState<number>(1);
  const [departmentId, setDepartmentId] = useState<number | null>(null);
  const [programId, setProgramId] = useState<number | null>(null);
  const [ssgPosition, setSSGPosition] = useState("");

  // Data from API
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [ssgPositions, setSSGPositions] = useState<
    { value: string; label: string }[]
  >([]);
  const [filteredPrograms, setFilteredPrograms] = useState<Program[]>([]);

  // Dropdown states
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [departmentDropdownOpen, setDepartmentDropdownOpen] = useState(false);
  const [programDropdownOpen, setProgramDropdownOpen] = useState(false);
  const [positionDropdownOpen, setPositionDropdownOpen] = useState(false);

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

  // Fetch departments, programs, and ssg positions on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments with authentication
        const deptResponse = await fetchWithAuth(DEPARTMENT_API);
        const deptData = await deptResponse.json();
        setDepartments(deptData);

        // Fetch programs with authentication
        const programResponse = await fetchWithAuth(PROGRAM_API);
        const programData = await programResponse.json();
        setPrograms(programData);

        // Fetch SSG positions with authentication
        const ssgPositionsResponse = await fetchWithAuth(SSG_POSITIONS_API);
        const positionsData = await ssgPositionsResponse.json();
        setSSGPositions(positionsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load necessary data. Please try again."
        );
      }
    };

    fetchData();
  }, []);

  // Update filtered programs when department changes
  useEffect(() => {
    if (departmentId) {
      const filtered = programs.filter((program) =>
        program.department_ids.includes(departmentId)
      );
      setFilteredPrograms(filtered);
    } else {
      setFilteredPrograms(programs);
    }
  }, [departmentId, programs]);

  const validateFields = () => {
    const errors: Record<string, string> = {};

    if (!user.first_name.trim()) {
      errors.first_name = "First name is required";
    }

    if (!user.last_name.trim()) {
      errors.last_name = "Last name is required";
    }

    if (!user.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(user.email)) {
      errors.email = "Email is invalid";
    }

    if (!user.password) {
      errors.password = "Password is required";
    } else if (user.password.length < 8) {
      errors.password = "Password must be at least 8 characters";
    }

    if (user.password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (user.roles.length === 0) {
      errors.roles = "At least one role must be selected";
    }

    if (user.roles.includes("student")) {
      if (!studentId.trim()) {
        errors.studentId = "Student ID is required";
      }

      if (!departmentId) {
        errors.department = "Department is required";
      }

      if (!programId) {
        errors.program = "Program is required";
      }
    }

    if (user.roles.includes("ssg") && !ssgPosition) {
      errors.position = "Position is required for SSG Officers";
    }

    return errors;
  };

  const toggleRoleSelection = (role: string) => {
    const newRoles = user.roles.includes(role)
      ? user.roles.filter((r) => r !== role)
      : [...user.roles, role];
    setUser({ ...user, roles: newRoles });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Step 1: Create the user
      const userResponse = await fetchWithAuth(USER_API, {
        method: "POST",
        body: JSON.stringify(user),
      });

      const createdUser = await userResponse.json();
      const userId = createdUser.id;

      // Flag to track if any operations failed
      let hasErrors = false;
      let errorMessage = "";

      // Step 2: If user is a student, create student profile
      if (user.roles.includes("student")) {
        try {
          const studentProfileData: StudentProfileCreate = {
            user_id: userId,
            student_id: studentId,
            department_id: departmentId!,
            program_id: programId!,
            year_level: yearLevel,
          };

          await fetchWithAuth(`${USER_API}/admin/students/`, {
            method: "POST",
            body: JSON.stringify(studentProfileData),
          });

          // Handle face encoding with image if available
        } catch (err) {
          console.error("Error creating student profile:", err);
          hasErrors = true;
          errorMessage = "User created but failed to create student profile.";
        }
      }

      // Step 3: If user is an SSG officer, create SSG profile
      if (user.roles.includes("ssg") && !hasErrors) {
        try {
          const ssgProfileData: SSGProfileCreate = {
            user_id: userId,
            position: ssgPosition,
          };

          await fetchWithAuth(`${USER_API}/ssg-profiles/`, {
            method: "POST",
            body: JSON.stringify(ssgProfileData),
          });
        } catch (err) {
          console.error("Error creating SSG profile:", err);
          hasErrors = true;
          errorMessage = hasErrors
            ? errorMessage + " Also failed to create SSG profile."
            : "User created but failed to create SSG profile.";
        }
      }

      // Set success or partial success message
      if (hasErrors) {
        setSuccessMessage(
          `User created with ID ${userId}, but there were some issues: ${errorMessage}`
        );
      } else {
        setSuccessMessage("User created successfully!");
        // Only reset form if completely successful
        setUser({
          first_name: "",
          middle_name: "",
          last_name: "",
          email: "",
          password: "",
          roles: [],
        });
        setConfirmPassword("");
        setStudentId("");
        setYearLevel(1);
        setDepartmentId(null);
        setProgramId(null);
        setSSGPosition("");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setError(err instanceof Error ? err.message : "Failed to create user");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-user-page">
      <NavbarAdmin />
      <div className="create-user-container compact-form">
        <header className="create-user-header">
          <div className="header-content">
            <h2>Create New User</h2>
          </div>
        </header>

        {error && (
          <div className="alert alert-danger error-message" role="alert">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success success-message" role="alert">
            {successMessage}
          </div>
        )}

        <form className="create-user-form compact-form" onSubmit={handleSubmit}>
          <section className="form-section compact-section">
            <h3 className="section-title">Basic Information</h3>

            <div className="form-group compact-group">
              <label htmlFor="first_name">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                value={user.first_name}
                onChange={(e) =>
                  setUser({ ...user, first_name: e.target.value })
                }
                className={validationErrors.first_name ? "input-error" : ""}
              />
              {validationErrors.first_name && (
                <div className="error-message compact-error">
                  {validationErrors.first_name}
                </div>
              )}
            </div>

            <div className="form-group compact-group">
              <label htmlFor="middle_name">Middle Name (Optional)</label>
              <input
                type="text"
                id="middle_name"
                value={user.middle_name}
                onChange={(e) =>
                  setUser({ ...user, middle_name: e.target.value })
                }
              />
            </div>

            <div className="form-group compact-group">
              <label htmlFor="last_name">
                Last Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="last_name"
                value={user.last_name}
                onChange={(e) =>
                  setUser({ ...user, last_name: e.target.value })
                }
                className={validationErrors.last_name ? "input-error" : ""}
              />
              {validationErrors.last_name && (
                <div className="error-message compact-error">
                  {validationErrors.last_name}
                </div>
              )}
            </div>

            <div className="form-group compact-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={user.email}
                onChange={(e) => setUser({ ...user, email: e.target.value })}
                className={validationErrors.email ? "input-error" : ""}
              />
              {validationErrors.email && (
                <div className="error-message compact-error">
                  {validationErrors.email}
                </div>
              )}
            </div>

            <div className="form-group compact-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={user.password}
                onChange={(e) => setUser({ ...user, password: e.target.value })}
                className={validationErrors.password ? "input-error" : ""}
              />
              {validationErrors.password && (
                <div className="error-message compact-error">
                  {validationErrors.password}
                </div>
              )}
            </div>

            <div className="form-group compact-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={
                  validationErrors.confirmPassword ? "input-error" : ""
                }
              />
              {validationErrors.confirmPassword && (
                <div className="error-message compact-error">
                  {validationErrors.confirmPassword}
                </div>
              )}
            </div>
          </section>

          <section className="form-section compact-section">
            <h3 className="section-title">User Roles</h3>
            <div className="form-group compact-group">
              <label>
                Select User Roles <span className="required">*</span>
              </label>
              <div className="dropdown-wrapper compact-dropdown">
                <div className="dropdown">
                  <button
                    type="button"
                    className={`dropdown-btn compact-btn ${
                      validationErrors.roles ? "input-error" : ""
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setRoleDropdownOpen(!roleDropdownOpen);
                    }}
                  >
                    {user.roles.length > 0 ? (
                      <div className="selected-roles compact-roles">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="selected-role-badge compact-badge"
                          >
                            {availableRoles.find((r) => r.value === role)
                              ?.label || role}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span>Select Roles</span>
                    )}
                    <span className="icon">{roleDropdownOpen ? "▲" : "▼"}</span>
                  </button>
                  {validationErrors.roles && (
                    <div className="error-message compact-error">
                      {validationErrors.roles}
                    </div>
                  )}
                  {roleDropdownOpen && (
                    <div className="dropdown-content compact-content">
                      {availableRoles.map((role) => (
                        <label
                          key={role.value}
                          className="dropdown-item radio-style compact-item"
                        >
                          <input
                            type="checkbox"
                            checked={user.roles.includes(role.value)}
                            onChange={() => toggleRoleSelection(role.value)}
                            className="radio-input"
                          />
                          <span className="radio-custom"></span>
                          {role.label}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {user.roles.includes("student") && (
            <section className="form-section compact-section">
              <h3 className="section-title">Student Details</h3>
              <div className="form-group compact-group">
                <label htmlFor="studentId">
                  Student ID <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="studentId"
                  placeholder="e.g., CS-2023-001"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className={validationErrors.studentId ? "input-error" : ""}
                />
                {validationErrors.studentId && (
                  <div className="error-message compact-error">
                    {validationErrors.studentId}
                  </div>
                )}
              </div>

              <div className="form-group compact-group">
                <label htmlFor="yearLevel">
                  Year Level <span className="required">*</span>
                </label>
                <select
                  id="yearLevel"
                  value={yearLevel}
                  onChange={(e) => setYearLevel(parseInt(e.target.value))}
                  className="compact-select"
                >
                  {yearLevels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group compact-group">
                <label>
                  Department <span className="required">*</span>
                </label>
                <div className="dropdown-wrapper compact-dropdown">
                  <div className="dropdown">
                    <button
                      type="button"
                      className={`dropdown-btn compact-btn ${
                        validationErrors.department ? "input-error" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setDepartmentDropdownOpen(!departmentDropdownOpen);
                      }}
                    >
                      {departmentId
                        ? departments.find((d) => d.id === departmentId)?.name
                        : "Select Department"}
                      <span className="icon">
                        {departmentDropdownOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {validationErrors.department && (
                      <div className="error-message compact-error">
                        {validationErrors.department}
                      </div>
                    )}
                    {departmentDropdownOpen && (
                      <div className="dropdown-content compact-content">
                        {departments.map((dept) => (
                          <div
                            key={dept.id}
                            className="dropdown-item compact-item"
                            onClick={() => {
                              setDepartmentId(dept.id);
                              setDepartmentDropdownOpen(false);
                              setProgramId(null);
                            }}
                          >
                            {dept.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-group compact-group">
                <label>
                  Program <span className="required">*</span>
                </label>
                <div className="dropdown-wrapper compact-dropdown">
                  <div className="dropdown">
                    <button
                      type="button"
                      className={`dropdown-btn compact-btn ${
                        validationErrors.program ? "input-error" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setProgramDropdownOpen(!programDropdownOpen);
                      }}
                      disabled={!departmentId}
                    >
                      {programId
                        ? programs.find((p) => p.id === programId)?.name
                        : departmentId
                        ? "Select Program"
                        : "Select Department First"}
                      <span className="icon">
                        {programDropdownOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {validationErrors.program && (
                      <div className="error-message compact-error">
                        {validationErrors.program}
                      </div>
                    )}
                    {programDropdownOpen && (
                      <div className="dropdown-content compact-content">
                        {filteredPrograms.map((prog) => (
                          <div
                            key={prog.id}
                            className="dropdown-item compact-item"
                            onClick={() => {
                              setProgramId(prog.id);
                              setProgramDropdownOpen(false);
                            }}
                          >
                            {prog.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {user.roles.includes("ssg") && (
            <section className="form-section compact-section">
              <h3 className="section-title">SSG Officer Details</h3>
              <div className="form-group compact-group">
                <label>
                  Position <span className="required">*</span>
                </label>
                <div className="dropdown-wrapper compact-dropdown">
                  <div className="dropdown">
                    <button
                      type="button"
                      className={`dropdown-btn compact-btn ${
                        validationErrors.position ? "input-error" : ""
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        setPositionDropdownOpen(!positionDropdownOpen);
                      }}
                    >
                      {ssgPosition || "Select Position"}
                      <span className="icon">
                        {positionDropdownOpen ? "▲" : "▼"}
                      </span>
                    </button>
                    {validationErrors.position && (
                      <div className="error-message compact-error">
                        {validationErrors.position}
                      </div>
                    )}
                    {positionDropdownOpen && (
                      <div className="dropdown-content compact-content">
                        {ssgPositions.map((pos) => (
                          <div
                            key={pos.value}
                            className="dropdown-item compact-item"
                            onClick={() => {
                              setSSGPosition(pos.value);
                              setPositionDropdownOpen(false);
                            }}
                          >
                            {pos.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          <div className="form-actions compact-actions">
            <Link to="/manage-users" className="btn btn-secondary compact-btn">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn btn-primary compact-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  <span className="sr-only">Creating...</span>
                </>
              ) : (
                "Create User"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUsers;
