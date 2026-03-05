import { useState, useEffect } from "react";
import { FaSearch, FaSync, FaArrowLeft, FaFilter } from "react-icons/fa";
import { NavbarStudent } from "../components/NavbarStudent";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import { NavbarSSG } from "../components/NavbarSSG";
import { useParams } from "react-router-dom";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface RecordsProps {
  role: string;
}

interface StudentAttendanceRecord {
  id: number;
  student_id: string;
  full_name: string;
  department_name: string | null;
  program_name: string | null;
  year_level: string;
  total_events: number;
  attendance_rate: number;
  last_attendance: string | null;
}

interface AttendanceDetail {
  id: number;
  event_id: number;
  event_name: string;
  event_location: string;
  event_date: string;
  time_in: string | null;
  time_out: string | null;
  status: "present" | "absent";
  method: string;
  notes: string | null;
  duration_minutes: number | null;
}

interface StudentAttendanceReport {
  student: {
    student_id: string;
    student_name: string;
    total_events: number;
    attended_events: number;
    absent_events: number;
    attendance_rate: number;
    last_attendance: string | null;
  };
  attendance_records: AttendanceDetail[];
  monthly_stats: Record<string, { present: number; absent: number }>;
  event_type_stats: Record<string, number>;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const Records: React.FC<RecordsProps> = ({ role }) => {
  const { student_id } = useParams();
  const [overviewData, setOverviewData] = useState<StudentAttendanceRecord[]>(
    []
  );
  const [reportData, setReportData] = useState<StudentAttendanceReport | null>(
    null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"overview" | "detail">(
    student_id ? "detail" : "overview"
  );

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "present" | "absent"
  >("all");

  const fetchOverviewData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      let url = `${BASE_URL}/attendance/students/overview?`;

      // Add date range filters if they exist
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOverviewData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch records");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentReport = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("authToken");
      let url = `${BASE_URL}/attendance/students/${id}/report?`;

      // Add filters to the report request
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      if (statusFilter !== "all") url += `&status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch student report"
      );
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === "overview") {
      fetchOverviewData();
    } else if (student_id) {
      fetchStudentReport(student_id);
    }
  }, [viewMode, student_id, startDate, endDate, statusFilter]);

  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("all");
    setShowFilters(false);
  };

  const filteredRecords = overviewData.filter(
    (record) =>
      record.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter records from the detailed view if requested
  const filteredAttendanceRecords =
    reportData?.attendance_records.filter(
      (record) => statusFilter === "all" || record.status === statusFilter
    ) || [];

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (timeString: string | null) => {
    if (!timeString) return "N/A";
    return new Date(timeString).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <span className="badge present">Present</span>;
      case "absent":
        return <span className="badge absent">Absent</span>;
      default:
        return <span className="badge unknown">Unknown</span>;
    }
  };

  const renderFilters = () => (
    <div className="filters-container">
      <div className="filter-row">
        <div className="filter-group">
          <label>Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
        </div>
        {viewMode === "detail" && (
          <div className="filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "present" | "absent")
              }
            >
              <option value="all">All Statuses</option>
              <option value="present">Present Only</option>
              <option value="absent">Absent Only</option>
            </select>
          </div>
        )}
        <button onClick={handleResetFilters} className="reset-btn">
          Reset Filters
        </button>
      </div>
    </div>
  );

  const renderOverview = () => (
    <div className="records-list">
      {isLoading ? (
        <div className="loading">Loading records...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="no-results">
          {searchTerm
            ? "No matching records found"
            : "No attendance records available"}
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th className="hide-on-mobile">Department</th>
                <th className="hide-on-mobile">Program</th>
                <th>Attendance</th>
                <th className="hide-on-small">Last Attendance</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.student_id}</td>
                  <td>{record.full_name}</td>
                  <td className="hide-on-mobile">
                    {record.department_name || "N/A"}
                  </td>
                  <td className="hide-on-mobile">
                    {record.program_name || "N/A"}
                  </td>
                  <td>
                    <div className="attendance-rate">
                      {record.attendance_rate}%
                    </div>
                  </td>
                  <td className="hide-on-small">
                    {record.last_attendance ? (
                      <>
                        {formatTime(record.last_attendance)}
                        <div className="date">
                          {formatDate(record.last_attendance)}
                        </div>
                      </>
                    ) : (
                      "No record"
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setViewMode("detail");
                        fetchStudentReport(record.id.toString());
                      }}
                      className="view-details-btn"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderDetailView = () => {
    if (!reportData)
      return <div className="loading">Loading student report...</div>;

    const attendedEvents =
      statusFilter === "all"
        ? reportData.student.attended_events
        : filteredAttendanceRecords.filter((r) => r.status === "present")
            .length;

    const absentEvents =
      statusFilter === "all"
        ? reportData.student.absent_events
        : filteredAttendanceRecords.filter((r) => r.status === "absent").length;

    // Prepare data for charts
    const statusDistributionData = {
      labels: ["Present", "Absent"],
      datasets: [
        {
          data: [attendedEvents, absentEvents],
          backgroundColor: ["#4CAF50", "#F44336"],
          borderColor: ["#388E3C", "#D32F2F"],
          borderWidth: 1,
        },
      ],
    };

    // Prepare monthly trend data (filtered by date range and status)
    const monthlyLabels = Object.keys(reportData.monthly_stats).sort();
    const monthlyData = {
      labels: monthlyLabels,
      datasets: [
        {
          label: "Present",
          data: monthlyLabels.map((month) => {
            if (statusFilter === "all")
              return reportData.monthly_stats[month]?.present || 0;
            if (statusFilter === "present")
              return reportData.monthly_stats[month]?.present || 0;
            return 0;
          }),
          backgroundColor: "#4CAF50",
        },
        {
          label: "Absent",
          data: monthlyLabels.map((month) => {
            if (statusFilter === "all")
              return reportData.monthly_stats[month]?.absent || 0;
            if (statusFilter === "absent")
              return reportData.monthly_stats[month]?.absent || 0;
            return 0;
          }),
          backgroundColor: "#F44336",
        },
      ],
    };

    return (
      <div className="student-detail">
        <button onClick={() => setViewMode("overview")} className="back-button">
          <FaArrowLeft /> Back to Overview
        </button>

        <div className="student-summary">
          <h2>{reportData.student.student_name}</h2>
          <p className="student-id">
            Student ID: {reportData.student.student_id}
          </p>
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total Events</h3>
              <p>{filteredAttendanceRecords.length}</p>
            </div>
            <div className="stat-card">
              <h3>Attended</h3>
              <p>{attendedEvents}</p>
            </div>
            <div className="stat-card">
              <h3>Absent</h3>
              <p>{absentEvents}</p>
            </div>
            <div className="stat-card">
              <h3>Attendance Rate</h3>
              <p>
                {filteredAttendanceRecords.length > 0
                  ? Math.round(
                      (attendedEvents / filteredAttendanceRecords.length) * 100
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-section">
          <div className="chart-container">
            <h3>Attendance Distribution</h3>
            <div className="chart-wrapper">
              <Pie
                data={statusDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          </div>

          <div className="chart-container">
            <h3>Monthly Attendance Trend</h3>
            <div className="chart-wrapper">
              <Bar
                data={monthlyData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    title: {
                      display: true,
                      text: "Monthly Attendance Trend",
                    },
                  },
                  scales: {
                    x: {
                      stacked: true,
                    },
                    y: {
                      stacked: true,
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        <div className="attendance-details">
          <h3>Attendance Records ({filteredAttendanceRecords.length})</h3>
          {filteredAttendanceRecords.length === 0 ? (
            <div className="no-attendance">
              No attendance records found for the selected filters
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th className="hide-on-small">Date</th>
                    <th className="hide-on-mobile">Location</th>
                    <th>Status</th>
                    <th className="hide-on-small">Time In</th>
                    <th className="hide-on-small">Time Out</th>
                    <th className="hide-on-mobile">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        {record.event_name}
                        <div className="show-on-small">
                          {formatDate(record.event_date)}
                        </div>
                      </td>
                      <td className="hide-on-small">
                        {formatDate(record.event_date)}
                      </td>
                      <td className="hide-on-mobile">
                        {record.event_location}
                      </td>
                      <td>{getStatusBadge(record.status)}</td>
                      <td className="hide-on-small">
                        {formatTime(record.time_in)}
                      </td>
                      <td className="hide-on-small">
                        {formatTime(record.time_out)}
                      </td>
                      <td className="hide-on-mobile">
                        {record.duration_minutes !== null
                          ? `${record.duration_minutes} mins`
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="records-container">
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : (
        <NavbarStudent />
      )}

      <div className="content">
        <div className="header">
          <h1>
            {viewMode === "overview"
              ? "Student Attendance Overview"
              : reportData
              ? `${reportData.student.student_name}'s Attendance`
              : "Student Attendance"}
          </h1>

          <div className="controls">
            {viewMode === "overview" && (
              <div className="search-box">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by student ID or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-btn"
            >
              <FaFilter /> {showFilters ? "Hide Filters" : "Filters"}
            </button>
            <button
              onClick={
                viewMode === "overview"
                  ? fetchOverviewData
                  : () => student_id && fetchStudentReport(student_id)
              }
              disabled={isLoading}
              className="refresh-btn"
            >
              <FaSync className={isLoading ? "spin" : ""} />
              <span className="hide-on-small">
                {isLoading ? "Loading..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {showFilters && renderFilters()}

        {error && <div className="error-message">{error}</div>}

        {viewMode === "overview" ? renderOverview() : renderDetailView()}
      </div>

      <style>{`
        .records-container {
          font-family: Arial, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          box-sizing: border-box;
        }

        .content {
          margin-top: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 15px;
        }

        .header h1 {
          font-size: clamp(1.5rem, 2vw, 2rem);
          margin: 0;
          color: #333;
        }

        .controls {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }

        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          flex-grow: 1;
          min-width: 200px;
          max-width: 400px;
        }

        .search-icon {
          position: absolute;
          left: 10px;
          color: #666;
          z-index: 1;
        }

        .search-box input {
          padding: 8px 10px 8px 35px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 100%;
          font-size: 14px;
          box-sizing: border-box;
        }

        button {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 15px;
          background: #4caf50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          white-space: nowrap;
          transition: background-color 0.2s;
        }

        button:hover {
          opacity: 0.9;
        }

        .filter-btn {
          background: #2196F3;
        }

        .reset-btn {
          background: #9E9E9E;
        }

        .view-details-btn {
          background: #2196F3;
          padding: 6px 10px;
          font-size: 13px;
        }

        button:disabled {
          background: #cccccc;
          cursor: not-allowed;
          opacity: 0.7;
        }

        .back-button {
          background: #666;
          margin-bottom: 20px;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .error-message {
          color: #d32f2f;
          background: #ffebee;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .table-responsive {
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 14px;
        }

        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }

        th {
          background-color: #f5f5f5;
          font-weight: 600;
          white-space: nowrap;
        }

        tr:hover {
          background-color: #f9f9f9;
        }

        .badge {
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
          white-space: nowrap;
        }

        .badge.present {
          background: #e8f5e9;
          color: #2e7d32;
        }

        .badge.absent {
          background: #ffebee;
          color: #c62828;
        }

        .date {
          font-size: 12px;
          color: #666;
          margin-top: 3px;
        }

        .attendance-rate {
          font-weight: bold;
        }

        .loading,
        .no-results,
        .no-attendance {
          padding: 20px;
          text-align: center;
          color: #666;
          font-size: 16px;
        }

        .student-detail {
          margin-top: 20px;
        }

        .student-summary {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .student-summary h2 {
          margin: 0 0 5px 0;
          color: #333;
          font-size: 1.5rem;
        }

        .student-id {
          color: #666;
          margin: 0 0 15px 0;
          font-size: 14px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 15px;
          margin-top: 20px;
        }

        .stat-card {
          background: #f9f9f9;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .stat-card h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
          color: #555;
        }

        .stat-card p {
          margin: 0;
          font-size: 1.5rem;
          font-weight: bold;
          color: #333;
        }

        .charts-section {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          margin-bottom: 20px;
        }

        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .chart-container h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
          font-size: 1.2rem;
        }

        .chart-wrapper {
          height: 300px;
          position: relative;
          min-width: 0;
        }

        .attendance-details {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .attendance-details h3 {
          margin-top: 0;
          font-size: 1.2rem;
          color: #333;
        }

        /* Filters styling */
        .filters-container {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .filter-row {
          display: flex;
          gap: 15px;
          align-items: flex-end;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex-grow: 1;
          min-width: 150px;
        }

        .filter-group label {
          font-size: 14px;
          color: #555;
        }

        .filter-group input,
        .filter-group select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          width: 100%;
          box-sizing: border-box;
        }

        /* Responsive visibility classes */
        .hide-on-small {
          display: table-cell;
        }
        
        .hide-on-mobile {
          display: table-cell;
        }
        
        .show-on-small {
          display: none;
        }

        /* Mobile-first responsive styles */
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            align-items: stretch;
            gap: 15px;
          }

          .controls {
            width: 100%;
          }

          .search-box {
            max-width: 100%;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          }

          .stat-card p {
            font-size: 1.2rem;
          }

          .filter-row {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }

          .filter-group {
            min-width: 100%;
          }

          .hide-on-small {
            display: none;
          }

          .show-on-small {
            display: block;
            font-size: 12px;
            color: #666;
            margin-top: 4px;
          }
        }

        @media (max-width: 480px) {
          .hide-on-mobile {
            display: none;
          }

          .header h1 {
            font-size: 1.3rem;
          }

          table {
            font-size: 13px;
          }

          th, td {
            padding: 8px 10px;
          }

          .chart-wrapper {
            height: 250px;
          }

          .refresh-btn span {
            display: none;
          }

          .refresh-btn {
            padding: 8px 10px;
          }

          .view-details-btn {
            padding: 4px 8px;
            font-size: 12px;
          }
        }

        /* Print styles */
        @media print {
          .records-container {
            padding: 0;
            max-width: 100%;
          }

          .header, .controls, .filters-container, .back-button {
            display: none;
          }

          .content {
            margin: 0;
          }

          .student-summary, .chart-container, .attendance-details {
            box-shadow: none;
            page-break-inside: avoid;
          }

          .charts-section {
            grid-template-columns: 1fr 1fr;
          }

          table {
            width: 100%;
            font-size: 12px;
          }

          th, td {
            padding: 6px 8px;
          }

          .hide-on-small, .hide-on-mobile {
            display: table-cell;
          }
        }
      `}</style>
    </div>
  );
};

export default Records;
