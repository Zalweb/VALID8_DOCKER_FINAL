import { useState, useEffect } from "react";
import { NavbarEventOrganizer } from "../components/NavbarEventOrganizer";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaUsers,
  FaGraduationCap,
  FaTimes,
  FaChevronDown,
  FaCheck,
  FaSpinner,
  FaInfoCircle,
  FaSearch,
} from "react-icons/fa";
import "../css/CreateEvent.css";

interface CreateEventProps {
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

interface Program {
  id: number;
  name: string;
}

interface Department {
  id: number;
  name: string;
}

interface EventFormData {
  name: string;
  location: string;
  start_datetime: string;
  end_datetime: string;
  late_threshold_minutes: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  ssg_member_ids: number[];
  program_ids: number[];
  department_ids: number[];
}

export const CreateEvent: React.FC<CreateEventProps> = ({ role }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<EventFormData>({
    name: "",
    location: "",
    start_datetime: "",
    end_datetime: "",
    late_threshold_minutes: 0,
    status: "upcoming",
    ssg_member_ids: [],
    program_ids: [],
    department_ids: [],
  });

  const [ssgSearch, setSsgSearch] = useState("");
  const [programSearch, setProgramSearch] = useState("");
  const [departmentSearch, setDepartmentSearch] = useState("");
  const [ssgMembers, setSSGMembers] = useState<SSGMember[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const filteredSSGMembers = ssgMembers.filter((member) => {
    const fullName = `${member.user?.first_name || ""} ${
      member.user?.last_name || ""
    }`.toLowerCase();
    return fullName.includes(ssgSearch.toLowerCase());
  });

  const filteredPrograms = programs.filter((program) =>
    program.name.toLowerCase().includes(programSearch.toLowerCase())
  );

  const filteredDepartments = departments.filter((dept) =>
    dept.name.toLowerCase().includes(departmentSearch.toLowerCase())
  );

  const [ssgDropdownOpen, setSsgDropdownOpen] = useState(false);
  const [programsDropdownOpen, setProgramsDropdownOpen] = useState(false);
  const [departmentsDropdownOpen, setDepartmentsDropdownOpen] = useState(false);

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

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

  const formatDateForAPI = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toISOString();
  };

  const checkAuthentication = (): boolean => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("You must be logged in to access this page");
      setLoading(false);
      return false;
    }
    return true;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      if (!checkAuthentication()) return;

      try {
        const [ssgResponse, programsResponse, deptsResponse] =
          await Promise.all([
            fetchWithAuth(`${BASE_URL}/users/by-role/ssg`),
            fetchWithAuth(`${BASE_URL}/programs/`),
            fetchWithAuth(`${BASE_URL}/departments/`),
          ]);

        const [ssgData, programsData, deptsData] = await Promise.all([
          ssgResponse.json(),
          programsResponse.json(),
          deptsResponse.json(),
        ]);

        const transformedMembers = Array.isArray(ssgData)
          ? ssgData
              .filter((member) => member && typeof member === "object")
              .map((user) => ({
                user_id: user.id,
                position: user.ssg_profile?.position || "Member",
                user: {
                  id: user.id,
                  first_name: user.first_name,
                  last_name: user.last_name,
                  email: user.email,
                },
              }))
          : [];

        setSSGMembers(transformedMembers);
        setPrograms(Array.isArray(programsData) ? programsData : []);
        setDepartments(Array.isArray(deptsData) ? deptsData : []);

        setError(null);
      } catch (err) {
        console.error("Error fetching dropdown data:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dropdown options. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [BASE_URL, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "late_threshold_minutes" ? Number(value || 0) : value,
    }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleDateTimeChange = (
    field: "start_datetime" | "end_datetime",
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const toggleSelection = (
    type: "ssg_member_ids" | "program_ids" | "department_ids",
    id: number
  ) => {
    setFormData((prev) => {
      const currentIds = prev[type];
      const newIds = currentIds.includes(id)
        ? currentIds.filter((itemId) => itemId !== id)
        : [...currentIds, id];
      return { ...prev, [type]: newIds };
    });
    if (validationErrors[type]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[type];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) errors.name = "Event name is required";
    if (!formData.location.trim()) errors.location = "Location is required";
    if (!formData.start_datetime)
      errors.start_datetime = "Start date & time is required";
    if (!formData.end_datetime)
      errors.end_datetime = "End date & time is required";
    if (formData.late_threshold_minutes < 0) {
      errors.late_threshold_minutes =
        "Late threshold minutes must be 0 or greater";
    }

    if (formData.start_datetime && formData.end_datetime) {
      const start = new Date(formData.start_datetime);
      const end = new Date(formData.end_datetime);

      if (start >= end) {
        errors.end_datetime = "End date & time must be after start date & time";
      }
    }

    const now = new Date();
    const start = formData.start_datetime
      ? new Date(formData.start_datetime)
      : null;
    if (start && start < now) {
      errors.start_datetime = "Start date & time should be in the future";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!checkAuthentication()) return;

    if (!validateForm()) {
      setError("Please fix the validation errors before submitting");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiFormData = {
        ...formData,
        start_datetime: formatDateForAPI(formData.start_datetime),
        end_datetime: formatDateForAPI(formData.end_datetime),
      };

      console.log("Submitting event data:", apiFormData);

      const response = await fetchWithAuth(`${BASE_URL}/events/`, {
        method: "POST",
        body: JSON.stringify(apiFormData),
      });

      const result = await response.json();
      setSuccessMessage(`Event "${result.name}" created successfully!`);

      setFormData({
        name: "",
        location: "",
        start_datetime: "",
        end_datetime: "",
        late_threshold_minutes: 0,
        status: "upcoming",
        ssg_member_ids: [],
        program_ids: [],
        department_ids: [],
      });

      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err) {
      console.error("Error creating event:", err);

      if (err instanceof Error) {
        setError(err.message);
      } else if (typeof err === "object" && err !== null) {
        setError(JSON.stringify(err));
      } else {
        setError(
          "Failed to create event. Please check your data and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSelectedItemsLabel = (
    type: "ssg_member_ids" | "program_ids" | "department_ids"
  ) => {
    const selectedIds = formData[type];
    let items: { name: string }[] = [];

    if (type === "ssg_member_ids") {
      items = ssgMembers
        .filter((member) => selectedIds.includes(member.user_id))
        .map((member) => ({
          name: `${member.user?.first_name || "Unknown"} ${
            member.user?.last_name || "User"
          }`,
        }));
    } else if (type === "program_ids") {
      items = programs.filter((program) => selectedIds.includes(program.id));
    } else if (type === "department_ids") {
      items = departments.filter((dept) => selectedIds.includes(dept.id));
    }

    if (items.length === 0) return "Select options";
    if (items.length === 1) return items[0].name;
    if (items.length > 3) return `${items.length} selected`;
    return items.map((item) => item.name).join(", ");
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (!target.closest(".ce-custom-dropdown")) {
        setSsgDropdownOpen(false);
        setProgramsDropdownOpen(false);
        setDepartmentsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const renderLoginPrompt = () => (
    <div className="ce-page-container">
      <div className="ce-navbar-container">
        {role === "student-ssg-eventorganizer" ? (
          <NavbarStudentSSGEventOrganizer />
        ) : (
          <NavbarEventOrganizer />
        )}
      </div>
      <div className="ce-content-container">
        <div className="ce-error-message">
          <FaTimes className="ce-error-icon" />
          {error}
        </div>
        <div className="ce-login-prompt">
          <p>Please log in to access the event creation form.</p>
          <button
            onClick={() => navigate("/login")}
            className="ce-primary-button"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );

  if (!loading && error?.includes("log in")) {
    return renderLoginPrompt();
  }

  if (loading) {
    return (
      <div className="ce-page-container">
        <div className="ce-navbar-container">
          {role === "student-ssg-eventorganizer" ? (
            <NavbarStudentSSGEventOrganizer />
          ) : (
            <NavbarEventOrganizer />
          )}
        </div>
        <div className="ce-loading-container">
          <FaSpinner className="ce-spinner-icon" />
          Loading event data...
        </div>
      </div>
    );
  }

  return (
    <div className="ce-page-container">
      <div className="ce-navbar-container">
        {role === "student-ssg-eventorganizer" ? (
          <NavbarStudentSSGEventOrganizer />
        ) : (
          <NavbarEventOrganizer />
        )}
      </div>

      <div className="ce-content-container">
        {error && (
          <div className="ce-error-message">
            <FaTimes className="ce-error-icon" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ce-dismiss-button"
            >
              Dismiss
            </button>
          </div>
        )}

        {successMessage && (
          <div className="ce-success-message">
            <FaCheck className="ce-success-icon" />
            {successMessage}
            <button
              onClick={() => setSuccessMessage("")}
              className="ce-dismiss-button"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="ce-header-section">
          <h2 className="ce-main-title">Create New Event</h2>
          <p className="ce-subtitle">
            Fill in the details below to create a new event
          </p>
        </div>

        <form onSubmit={handleSubmit} className="ce-event-form">
          <div
            className={`ce-form-group ${
              validationErrors.name ? "ce-error" : ""
            }`}
          >
            <label className="ce-form-label">
              <FaCalendarAlt className="ce-icon" />
              Event Name*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              placeholder="Enter Event Name"
              className={`ce-form-input ${
                validationErrors.name ? "ce-input-error" : ""
              }`}
            />
            {validationErrors.name && (
              <div className="ce-error-text">{validationErrors.name}</div>
            )}
          </div>

          <div
            className={`ce-form-group ${
              validationErrors.location ? "ce-error" : ""
            }`}
          >
            <label className="ce-form-label">
              <FaMapMarkerAlt className="ce-icon" />
              Location*
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              required
              placeholder="Enter Location"
              className={`ce-form-input ${
                validationErrors.location ? "ce-input-error" : ""
              }`}
            />
            {validationErrors.location && (
              <div className="ce-error-text">{validationErrors.location}</div>
            )}
          </div>

          <div className="ce-form-row">
            <div
              className={`ce-form-group ${
                validationErrors.start_datetime ? "ce-error" : ""
              }`}
            >
              <label className="ce-form-label">
                <FaCalendarAlt className="ce-icon" />
                Start Date & Time*
              </label>
              <input
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) =>
                  handleDateTimeChange("start_datetime", e.target.value)
                }
                required
                className={`ce-form-input ${
                  validationErrors.start_datetime ? "ce-input-error" : ""
                }`}
              />
              {validationErrors.start_datetime && (
                <div className="ce-error-text">
                  {validationErrors.start_datetime}
                </div>
              )}
            </div>

            <div
              className={`ce-form-group ${
                validationErrors.end_datetime ? "ce-error" : ""
              }`}
            >
              <label className="ce-form-label">
                <FaCalendarAlt className="ce-icon" />
                End Date & Time*
              </label>
              <input
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) =>
                  handleDateTimeChange("end_datetime", e.target.value)
                }
                required
                className={`ce-form-input ${
                  validationErrors.end_datetime ? "ce-input-error" : ""
                }`}
              />
              {validationErrors.end_datetime && (
                <div className="ce-error-text">
                  {validationErrors.end_datetime}
                </div>
              )}
            </div>
          </div>

          <div
            className={`ce-form-group ${
              validationErrors.late_threshold_minutes ? "ce-error" : ""
            }`}
          >
            <label className="ce-form-label">
              <FaInfoCircle className="ce-icon" />
              Late Threshold (Minutes)
            </label>
            <input
              type="number"
              name="late_threshold_minutes"
              value={formData.late_threshold_minutes}
              onChange={handleInputChange}
              min={0}
              placeholder="Enter how many minutes stay present after the event starts"
              className={`ce-form-input ${
                validationErrors.late_threshold_minutes ? "ce-input-error" : ""
              }`}
            />
            {validationErrors.late_threshold_minutes && (
              <div className="ce-error-text">
                {validationErrors.late_threshold_minutes}
              </div>
            )}
            <div className="ce-helper-text">
              Students who check in after this window will be marked late.
            </div>
          </div>

          <div className="ce-info-box">
            <FaInfoCircle className="ce-info-icon" />
            <span>
              Select SSG members, programs, and departments for this event. At
              least one selection is recommended.
            </span>
          </div>

          {/* SSG Members Dropdown */}
          <div
            className={`ce-form-group ${
              validationErrors.ssg_member_ids ? "ce-error" : ""
            }`}
          >
            <label className="ce-form-label">
              <FaUsers className="ce-icon" />
              Assign SSG Members
            </label>
            <div
              className={`ce-custom-dropdown ${
                ssgDropdownOpen ? "ce-active" : ""
              }`}
            >
              <div
                className={`ce-dropdown-header ${
                  formData.ssg_member_ids.length > 0 ? "ce-has-selection" : ""
                }`}
                onClick={() => {
                  setSsgDropdownOpen(!ssgDropdownOpen);
                  setProgramsDropdownOpen(false);
                  setDepartmentsDropdownOpen(false);
                  setSsgSearch("");
                }}
              >
                <span className="ce-dropdown-header-text">
                  {getSelectedItemsLabel("ssg_member_ids")}
                </span>
                <FaChevronDown
                  className={`ce-dropdown-icon ${
                    ssgDropdownOpen ? "ce-open" : ""
                  }`}
                />
              </div>
              {ssgDropdownOpen && (
                <div className="ce-dropdown-options-container">
                  <div className="ce-dropdown-search">
                    <FaSearch className="ce-search-icon" />
                    <input
                      type="text"
                      placeholder="Search SSG members..."
                      value={ssgSearch}
                      onChange={(e) => setSsgSearch(e.target.value)}
                      className="ce-search-input"
                      autoFocus
                    />
                  </div>
                  <div className="ce-dropdown-options-list">
                    {filteredSSGMembers.length === 0 ? (
                      <div className="ce-dropdown-empty">
                        {ssgSearch
                          ? "No members match your search"
                          : "No SSG members available"}
                      </div>
                    ) : (
                      filteredSSGMembers.map((member) => (
                        <div
                          key={member.user_id}
                          className={`ce-dropdown-option ${
                            formData.ssg_member_ids.includes(member.user_id)
                              ? "ce-selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleSelection("ssg_member_ids", member.user_id)
                          }
                        >
                          <div className="ce-option-content">
                            <div className="ce-member-name">
                              {member.user?.first_name || "Unknown"}{" "}
                              {member.user?.last_name || "User"}
                            </div>
                            <div className="ce-member-position">
                              {member.position}
                            </div>
                          </div>
                          <div
                            className={`ce-checkbox ${
                              formData.ssg_member_ids.includes(member.user_id)
                                ? "ce-checked"
                                : ""
                            }`}
                          >
                            {formData.ssg_member_ids.includes(
                              member.user_id
                            ) && <FaCheck className="ce-check-icon" />}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.ssg_member_ids.length > 0 && (
                    <div className="ce-dropdown-footer">
                      <div className="ce-selected-count">
                        {formData.ssg_member_ids.length} selected
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.ssg_member_ids && (
              <div className="ce-error-text">
                {validationErrors.ssg_member_ids}
              </div>
            )}
          </div>

          {/* Programs Dropdown */}
          <div
            className={`ce-form-group ${
              validationErrors.program_ids ? "ce-error" : ""
            }`}
          >
            <label className="ce-form-label">
              <FaGraduationCap className="ce-icon" />
              Select Programs
            </label>
            <div
              className={`ce-custom-dropdown ${
                programsDropdownOpen ? "ce-active" : ""
              }`}
            >
              <div
                className={`ce-dropdown-header ${
                  formData.program_ids.length > 0 ? "ce-has-selection" : ""
                }`}
                onClick={() => {
                  setProgramsDropdownOpen(!programsDropdownOpen);
                  setSsgDropdownOpen(false);
                  setDepartmentsDropdownOpen(false);
                  setProgramSearch("");
                }}
              >
                <span className="ce-dropdown-header-text">
                  {getSelectedItemsLabel("program_ids")}
                </span>
                <FaChevronDown
                  className={`ce-dropdown-icon ${
                    programsDropdownOpen ? "ce-open" : ""
                  }`}
                />
              </div>
              {programsDropdownOpen && (
                <div className="ce-dropdown-options-container">
                  <div className="ce-dropdown-search">
                    <FaSearch className="ce-search-icon" />
                    <input
                      type="text"
                      placeholder="Search programs..."
                      value={programSearch}
                      onChange={(e) => setProgramSearch(e.target.value)}
                      className="ce-search-input"
                      autoFocus
                    />
                  </div>
                  <div className="ce-dropdown-options-list">
                    {filteredPrograms.length === 0 ? (
                      <div className="ce-dropdown-empty">
                        {programSearch
                          ? "No programs match your search"
                          : "No programs available"}
                      </div>
                    ) : (
                      filteredPrograms.map((program) => (
                        <div
                          key={program.id}
                          className={`ce-dropdown-option ${
                            formData.program_ids.includes(program.id)
                              ? "ce-selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleSelection("program_ids", program.id)
                          }
                        >
                          <div className="ce-option-content">
                            <div className="ce-item-name">{program.name}</div>
                          </div>
                          <div
                            className={`ce-checkbox ${
                              formData.program_ids.includes(program.id)
                                ? "ce-checked"
                                : ""
                            }`}
                          >
                            {formData.program_ids.includes(program.id) && (
                              <FaCheck className="ce-check-icon" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.program_ids.length > 0 && (
                    <div className="ce-dropdown-footer">
                      <div className="ce-selected-count">
                        {formData.program_ids.length} selected
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.program_ids && (
              <div className="ce-error-text">
                {validationErrors.program_ids}
              </div>
            )}
          </div>

          {/* Departments Dropdown */}
          <div
            className={`ce-form-group ${
              validationErrors.department_ids ? "ce-error" : ""
            }`}
          >
            <label className="ce-form-label">
              <FaGraduationCap className="ce-icon" />
              Select Departments
            </label>
            <div
              className={`ce-custom-dropdown ${
                departmentsDropdownOpen ? "ce-active" : ""
              }`}
            >
              <div
                className={`ce-dropdown-header ${
                  formData.department_ids.length > 0 ? "ce-has-selection" : ""
                }`}
                onClick={() => {
                  setDepartmentsDropdownOpen(!departmentsDropdownOpen);
                  setSsgDropdownOpen(false);
                  setProgramsDropdownOpen(false);
                  setDepartmentSearch("");
                }}
              >
                <span className="ce-dropdown-header-text">
                  {getSelectedItemsLabel("department_ids")}
                </span>
                <FaChevronDown
                  className={`ce-dropdown-icon ${
                    departmentsDropdownOpen ? "ce-open" : ""
                  }`}
                />
              </div>
              {departmentsDropdownOpen && (
                <div className="ce-dropdown-options-container">
                  <div className="ce-dropdown-search">
                    <FaSearch className="ce-search-icon" />
                    <input
                      type="text"
                      placeholder="Search departments..."
                      value={departmentSearch}
                      onChange={(e) => setDepartmentSearch(e.target.value)}
                      className="ce-search-input"
                      autoFocus
                    />
                  </div>
                  <div className="ce-dropdown-options-list">
                    {filteredDepartments.length === 0 ? (
                      <div className="ce-dropdown-empty">
                        {departmentSearch
                          ? "No departments match your search"
                          : "No departments available"}
                      </div>
                    ) : (
                      filteredDepartments.map((dept) => (
                        <div
                          key={dept.id}
                          className={`ce-dropdown-option ${
                            formData.department_ids.includes(dept.id)
                              ? "ce-selected"
                              : ""
                          }`}
                          onClick={() =>
                            toggleSelection("department_ids", dept.id)
                          }
                        >
                          <div className="ce-option-content">
                            <div className="ce-item-name">{dept.name}</div>
                          </div>
                          <div
                            className={`ce-checkbox ${
                              formData.department_ids.includes(dept.id)
                                ? "ce-checked"
                                : ""
                            }`}
                          >
                            {formData.department_ids.includes(dept.id) && (
                              <FaCheck className="ce-check-icon" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {formData.department_ids.length > 0 && (
                    <div className="ce-dropdown-footer">
                      <div className="ce-selected-count">
                        {formData.department_ids.length} selected
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            {validationErrors.department_ids && (
              <div className="ce-error-text">
                {validationErrors.department_ids}
              </div>
            )}
          </div>

          <div className="ce-form-actions">
            <button
              type="button"
              className="ce-secondary-button"
              onClick={() => {
                setFormData({
                  name: "",
                  location: "",
                  start_datetime: "",
                  end_datetime: "",
                  late_threshold_minutes: 0,
                  status: "upcoming",
                  ssg_member_ids: [],
                  program_ids: [],
                  department_ids: [],
                });
                setError(null);
                setValidationErrors({});
              }}
              disabled={isSubmitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="ce-primary-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="ce-spinner-icon" /> Creating...
                </>
              ) : (
                "Create Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEvent;
