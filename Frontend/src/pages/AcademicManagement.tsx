import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import NavbarAdmin from "../components/NavbarAdmin";

interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
  department_ids: number[];
}

const AcademicManagement = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [activeTab, setActiveTab] = useState<"departments" | "programs">(
    "departments"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Department form state
  const [deptName, setDeptName] = useState("");
  const [editingDeptId, setEditingDeptId] = useState<number | null>(null);

  // Program form state
  const [progName, setProgName] = useState("");
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);
  const [editingProgId, setEditingProgId] = useState<number | null>(null);

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

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (activeTab === "departments") {
          const response = await fetchWithAuth(`${BASE_URL}/departments/`);
          const data = await response.json();
          setDepartments(data);
        } else {
          const [deptsResponse, progsResponse] = await Promise.all([
            fetchWithAuth(`${BASE_URL}/departments/`),
            fetchWithAuth(`${BASE_URL}/programs/`),
          ]);
          const [deptsData, progsData] = await Promise.all([
            deptsResponse.json(),
            progsResponse.json(),
          ]);
          setDepartments(deptsData);
          setPrograms(progsData);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

  // Department CRUD operations
  const handleDeptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingDeptId
        ? `${BASE_URL}/departments/${editingDeptId}`
        : `${BASE_URL}/departments/`;

      const method = editingDeptId ? "PATCH" : "POST";
      const body = JSON.stringify({ name: deptName });

      const response = await fetchWithAuth(url, {
        method,
        body,
      });

      const data = await response.json();

      if (editingDeptId) {
        setDepartments(
          departments.map((dept) => (dept.id === editingDeptId ? data : dept))
        );
      } else {
        setDepartments([...departments, data]);
      }

      setDeptName("");
      setEditingDeptId(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save department"
      );
    }
  };

  const editDepartment = (dept: Department) => {
    setDeptName(dept.name);
    setEditingDeptId(dept.id);
  };

  const deleteDepartment = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this department?"))
      return;

    try {
      await fetchWithAuth(`${BASE_URL}/departments/${id}`, {
        method: "DELETE",
      });
      setDepartments(departments.filter((dept) => dept.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete department"
      );
    }
  };

  // Program CRUD operations
  const handleProgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const url = editingProgId
        ? `${BASE_URL}/programs/${editingProgId}`
        : `${BASE_URL}/programs/`;

      const method = editingProgId ? "PATCH" : "POST";
      const body = JSON.stringify({
        name: progName,
        department_ids: selectedDeptIds,
      });

      const response = await fetchWithAuth(url, {
        method,
        body,
      });

      const data = await response.json();

      if (editingProgId) {
        setPrograms(
          programs.map((prog) => (prog.id === editingProgId ? data : prog))
        );
      } else {
        setPrograms([...programs, data]);
      }

      setProgName("");
      setSelectedDeptIds([]);
      setEditingProgId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save program");
    }
  };

  const editProgram = (prog: Program) => {
    setProgName(prog.name);
    setSelectedDeptIds(prog.department_ids);
    setEditingProgId(prog.id);
  };

  const deleteProgram = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this program?"))
      return;

    try {
      await fetchWithAuth(`${BASE_URL}/programs/${id}`, {
        method: "DELETE",
      });
      setPrograms(programs.filter((prog) => prog.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete program");
    }
  };

  const toggleDeptSelection = (deptId: number) => {
    setSelectedDeptIds((prev) =>
      prev.includes(deptId)
        ? prev.filter((id) => id !== deptId)
        : [...prev, deptId]
    );
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <NavbarAdmin />
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>
        Department & Program Manager
      </h1>

      <div
        style={{
          display: "flex",
          marginBottom: "20px",
          borderBottom: "1px solid #ddd",
        }}
      >
        <button
          style={{
            padding: "10px 20px",
            background: activeTab === "departments" ? "#007bff" : "#f0f0f0",
            color: activeTab === "departments" ? "white" : "black",
            border: "none",
            cursor: "pointer",
            marginRight: "5px",
          }}
          onClick={() => setActiveTab("departments")}
        >
          Departments
        </button>
        <button
          style={{
            padding: "10px 20px",
            background: activeTab === "programs" ? "#007bff" : "#f0f0f0",
            color: activeTab === "programs" ? "white" : "black",
            border: "none",
            cursor: "pointer",
          }}
          onClick={() => setActiveTab("programs")}
        >
          Programs
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: "10px",
            background: "#ffebee",
            color: "#d32f2f",
            marginBottom: "20px",
            borderRadius: "4px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>Loading...</div>
      ) : activeTab === "departments" ? (
        <div>
          <h2 style={{ marginBottom: "20px" }}>Departments</h2>

          <form onSubmit={handleDeptSubmit} style={{ marginBottom: "30px" }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Department Name
              </label>
              <input
                type="text"
                value={deptName}
                onChange={(e) => setDeptName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: "8px 16px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {editingDeptId ? "Update Department" : "Add Department"}
            </button>
            {editingDeptId && (
              <button
                type="button"
                onClick={() => {
                  setDeptName("");
                  setEditingDeptId(null);
                }}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              >
                Cancel
              </button>
            )}
          </form>

          <div>
            {departments.length === 0 ? (
              <p>No departments found</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {departments.map((dept) => (
                  <li
                    key={dept.id}
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      marginBottom: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span>{dept.name}</span>
                    <div>
                      <button
                        onClick={() => editDepartment(dept)}
                        style={{
                          padding: "5px 10px",
                          background: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          marginRight: "5px",
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteDepartment(dept.id)}
                        style={{
                          padding: "5px 10px",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h2 style={{ marginBottom: "20px" }}>Programs</h2>

          <form onSubmit={handleProgSubmit} style={{ marginBottom: "30px" }}>
            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Program Name
              </label>
              <input
                type="text"
                value={progName}
                onChange={(e) => setProgName(e.target.value)}
                required
                minLength={2}
                maxLength={100}
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                }}
              />
            </div>

            <div style={{ marginBottom: "15px" }}>
              <label style={{ display: "block", marginBottom: "5px" }}>
                Associated Departments
              </label>
              {departments.length === 0 ? (
                <p>No departments available</p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      style={{ display: "flex", alignItems: "center" }}
                    >
                      <input
                        type="checkbox"
                        id={`dept-${dept.id}`}
                        checked={selectedDeptIds.includes(dept.id)}
                        onChange={() => toggleDeptSelection(dept.id)}
                        style={{ marginRight: "5px" }}
                      />
                      <label htmlFor={`dept-${dept.id}`}>{dept.name}</label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              style={{
                padding: "8px 16px",
                background: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {editingProgId ? "Update Program" : "Add Program"}
            </button>
            {editingProgId && (
              <button
                type="button"
                onClick={() => {
                  setProgName("");
                  setSelectedDeptIds([]);
                  setEditingProgId(null);
                }}
                style={{
                  padding: "8px 16px",
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginLeft: "10px",
                }}
              >
                Cancel
              </button>
            )}
          </form>

          <div>
            {programs.length === 0 ? (
              <p>No programs found</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0 }}>
                {programs.map((prog) => (
                  <li
                    key={prog.id}
                    style={{
                      padding: "15px",
                      border: "1px solid #ddd",
                      borderRadius: "4px",
                      marginBottom: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "10px",
                      }}
                    >
                      <span style={{ fontWeight: "bold" }}>{prog.name}</span>
                      <div>
                        <button
                          onClick={() => editProgram(prog)}
                          style={{
                            padding: "5px 10px",
                            background: "#17a2b8",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            marginRight: "5px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProgram(prog.id)}
                          style={{
                            padding: "5px 10px",
                            background: "#dc3545",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div>
                      <p style={{ margin: "5px 0" }}>Departments:</p>
                      {prog.department_ids.length === 0 ? (
                        <p>No departments assigned</p>
                      ) : (
                        <ul
                          style={{
                            listStyle: "none",
                            padding: 0,
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "5px",
                          }}
                        >
                          {prog.department_ids.map((deptId) => {
                            const dept = departments.find(
                              (d) => d.id === deptId
                            );
                            return dept ? (
                              <li
                                key={deptId}
                                style={{
                                  background: "#e9ecef",
                                  padding: "3px 8px",
                                  borderRadius: "12px",
                                  fontSize: "0.9em",
                                }}
                              >
                                {dept.name}
                              </li>
                            ) : null;
                          })}
                        </ul>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademicManagement;
