import { useState, useEffect } from "react";
import { NavbarAdmin } from "../components/NavbarAdmin";
import search_logo from "../assets/images/search_logo.png";
import { FaDownload } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Tooltip,
  Legend,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Modal from "react-modal";

interface AttendanceReport {
  event_name: string;
  event_date: string;
  event_location: string;
  total_participants: number;
  attendees: number;
  absentees: number;
  attendance_rate: number;
  programs: { id: number; name: string }[];
  program_breakdown: {
    program: string;
    total: number;
    present: number;
    absent: number;
  }[];
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const Reports: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [attendanceReport, setAttendanceReport] =
    useState<AttendanceReport | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<number | "all">("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${BASE_URL}/events`);
        const data = await response.json();
        setEvents(data);
        setFilteredEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const filtered = events.filter((event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEvents(filtered);
  }, [searchTerm, events]);

  const handleViewReport = async (event: Event) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/attendance/events/${event.id}/report`
      );
      const data = await response.json();
      setAttendanceReport(data);
      setSelectedEvent(event);
      setSelectedProgram("all");
    } catch (error) {
      console.error("Error fetching attendance report:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCSVReport = () => {
    if (!attendanceReport) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `${attendanceReport.event_name} - Attendance Report\r\n`;
    csvContent += `Date: ${attendanceReport.event_date}\r\n`;
    csvContent += `Location: ${attendanceReport.event_location}\r\n\r\n`;

    csvContent += `Overall Summary:\r\n`;
    csvContent += `Total Participants: ${attendanceReport.total_participants}\r\n`;
    csvContent += `Attendees: ${attendanceReport.attendees}\r\n`;
    csvContent += `Absentees: ${attendanceReport.absentees}\r\n`;
    csvContent += `Attendance Rate: ${attendanceReport.attendance_rate}%\r\n\r\n`;

    csvContent += `Program Breakdown:\r\n`;
    attendanceReport.program_breakdown.forEach((program) => {
      csvContent += `${program.program},${program.total},${program.present},${
        program.absent
      },${Math.round((program.present / program.total) * 100)}%\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${attendanceReport.event_name.replace(/\s+/g, "_")}_Report.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDFReport = () => {
    if (!attendanceReport) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to download the PDF report");
      return;
    }

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${attendanceReport.event_name} - Attendance Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .header { margin-bottom: 30px; }
          h1 { color: #333; margin-bottom: 5px; }
          .event-details { color: #666; margin-bottom: 20px; }
          .summary-section { margin-bottom: 30px; }
          .summary-cards { display: flex; flex-wrap: wrap; gap: 20px; margin-bottom: 30px; }
          .summary-card { border: 1px solid #ddd; border-radius: 8px; padding: 15px; width: 200px; }
          .card-title { display: block; font-size: 14px; color: #666; }
          .card-value { display: block; font-size: 24px; font-weight: bold; margin-top: 5px; }
          .total .card-value { color: #2196F3; }
          .present .card-value { color: #4CAF50; }
          .absent .card-value { color: #F44336; }
          .rate .card-value { color: #FF9800; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${attendanceReport.event_name} - Attendance Report</h1>
          <p class="event-details">Date: ${attendanceReport.event_date} • Location: ${attendanceReport.event_location}</p>
        </div>
        
        <div class="summary-section">
          <h2>Attendance Summary</h2>
          <div class="summary-cards">
            <div class="summary-card total">
              <span class="card-title">Total Participants</span>
              <span class="card-value">${attendanceReport.total_participants}</span>
            </div>
            <div class="summary-card present">
              <span class="card-title">Attendees</span>
              <span class="card-value">${attendanceReport.attendees}</span>
            </div>
            <div class="summary-card absent">
              <span class="card-title">Absentees</span>
              <span class="card-value">${attendanceReport.absentees}</span>
            </div>
            <div class="summary-card rate">
              <span class="card-title">Attendance Rate</span>
              <span class="card-value">${attendanceReport.attendance_rate}%</span>
            </div>
          </div>
        </div>
        
        <h2>Program Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Program</th>
              <th>Total</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
    `;

    attendanceReport.program_breakdown.forEach((program) => {
      htmlContent += `
        <tr>
          <td>${program.program}</td>
          <td>${program.total}</td>
          <td>${program.present}</td>
          <td>${program.absent}</td>
          <td>${Math.round((program.present / program.total) * 100)}%</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        <div class="no-print" style="margin-top: 40px; text-align: center;">
          <button onclick="window.print();" style="padding: 10px 20px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Print Report</button>
          <button onclick="window.close();" style="padding: 10px 20px; background-color: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  };

  const getChartData = () => {
    if (!attendanceReport) return [];

    if (selectedProgram === "all") {
      return [
        { name: "Present", value: attendanceReport.attendees },
        { name: "Absent", value: attendanceReport.absentees },
      ];
    } else {
      const program = attendanceReport.program_breakdown.find(
        (p) => p.program === selectedProgram
      );
      if (!program) return [];
      return [
        { name: "Present", value: program.present },
        { name: "Absent", value: program.absent },
      ];
    }
  };

  const getProgramChartData = () => {
    if (!attendanceReport || selectedProgram !== "all") return [];
    return attendanceReport.program_breakdown.map((program) => ({
      name: program.program,
      present: program.present,
      absent: program.absent,
    }));
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <NavbarAdmin />
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <header
          style={{
            marginBottom: "30px",
          }}
        >
          <h2
            style={{
              marginBottom: "5px",
              color: "#333",
            }}
          >
            Event Attendance Reports
          </h2>
          <p
            style={{
              color: "#666",
              marginTop: "0",
            }}
          >
            View and download detailed attendance records for university events
          </p>
        </header>

        {/* Search Bar */}
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "500px",
            }}
          >
            <img
              src={search_logo}
              alt="search"
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                height: "20px",
              }}
            />
            <input
              type="search"
              placeholder="Search events by name..."
              style={{
                width: "100%",
                padding: "10px 15px 10px 35px",
                borderRadius: "4px",
                border: "1px solid #ddd",
                fontSize: "16px",
              }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Events Table */}
        <div
          style={{
            overflowX: "auto",
            marginBottom: "30px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "white",
              borderRadius: "8px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: "#f8f9fa",
                  borderBottom: "1px solid #ddd",
                }}
              >
                <th style={{ padding: "12px 15px", textAlign: "left" }}>
                  Event Name
                </th>
                <th style={{ padding: "12px 15px", textAlign: "left" }}>
                  Date
                </th>
                <th style={{ padding: "12px 15px", textAlign: "left" }}>
                  Location
                </th>
                <th style={{ padding: "12px 15px", textAlign: "left" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr
                  key={event.id}
                  style={{
                    borderBottom: "1px solid #eee",
                    "&:hover": {
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                >
                  <td style={{ padding: "12px 15px" }}>{event.name}</td>
                  <td style={{ padding: "12px 15px" }}>
                    {new Date(event.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </td>
                  <td style={{ padding: "12px 15px" }}>{event.location}</td>
                  <td style={{ padding: "12px 15px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        flexWrap: "wrap",
                      }}
                    >
                      <button
                        style={{
                          padding: "8px 15px",
                          backgroundColor: "#ffc107",
                          color: "#212529",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleViewReport(event)}
                      >
                        View Report
                      </button>
                      <button
                        style={{
                          padding: "8px 15px",
                          backgroundColor: "#007bff",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        onClick={() =>
                          handleViewReport(event).then(handleDownloadCSVReport)
                        }
                      >
                        <FaDownload /> {!isMobile && "CSV"}
                      </button>
                      <button
                        style={{
                          padding: "8px 15px",
                          backgroundColor: "#4285F4",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        onClick={() =>
                          handleViewReport(event).then(handleDownloadPDFReport)
                        }
                      >
                        <FaDownload /> {!isMobile && "PDF"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    style={{
                      padding: "20px",
                      textAlign: "center",
                      color: "#666",
                    }}
                  >
                    No matching events found. Try a different search term.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Report Modal */}
        {selectedEvent && attendanceReport && (
          <Modal
            isOpen={true}
            onRequestClose={() => setSelectedEvent(null)}
            ariaHideApp={false}
            style={{
              overlay: {
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1000,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px",
              },
              content: {
                position: "relative",
                backgroundColor: "white",
                borderRadius: "8px",
                padding: "20px",
                maxWidth: "900px",
                width: "90%",
                maxHeight: "90vh",
                overflow: "auto",
                border: "none",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.3)",
              },
            }}
          >
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  marginBottom: "5px",
                  color: "#333",
                }}
              >
                {attendanceReport.event_name} - Attendance Report
              </h3>
              <p
                style={{
                  color: "#666",
                  marginTop: "0",
                  display: "flex",
                  gap: "10px",
                }}
              >
                <span>{attendanceReport.event_date}</span>
                <span>•</span>
                <span>{attendanceReport.event_location}</span>
              </p>
            </div>

            {/* Filter Dropdown */}
            <div
              style={{
                marginBottom: "20px",
              }}
            >
              <label
                htmlFor="program-filter"
                style={{
                  marginRight: "10px",
                }}
              >
                Filter by Program:
              </label>
              <select
                id="program-filter"
                value={selectedProgram}
                onChange={(e) =>
                  setSelectedProgram(
                    e.target.value === "all" ? "all" : Number(e.target.value)
                  )
                }
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: "1px solid #ddd",
                }}
              >
                <option value="all">All Programs</option>
                {attendanceReport.programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Attendance Summary */}
            <div
              style={{
                marginBottom: "30px",
              }}
            >
              <h4
                style={{
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                  color: "#333",
                }}
              >
                Attendance Summary
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                <div
                  style={{
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    Total Participants
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {selectedProgram === "all"
                      ? attendanceReport.total_participants
                      : attendanceReport.program_breakdown.find(
                          (p) => p.program === selectedProgram
                        )?.total || 0}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: "#e8f5e9",
                    borderRadius: "8px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    Attendees
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#4CAF50",
                    }}
                  >
                    {selectedProgram === "all"
                      ? attendanceReport.attendees
                      : attendanceReport.program_breakdown.find(
                          (p) => p.program === selectedProgram
                        )?.present || 0}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: "#ffebee",
                    borderRadius: "8px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    Absentees
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#F44336",
                    }}
                  >
                    {selectedProgram === "all"
                      ? attendanceReport.absentees
                      : attendanceReport.program_breakdown.find(
                          (p) => p.program === selectedProgram
                        )?.absent || 0}
                  </span>
                </div>
                <div
                  style={{
                    backgroundColor: "#e3f2fd",
                    borderRadius: "8px",
                    padding: "15px",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    Attendance Rate
                  </span>
                  <span
                    style={{
                      display: "block",
                      fontSize: "24px",
                      fontWeight: "bold",
                      color: "#2196F3",
                    }}
                  >
                    {selectedProgram === "all"
                      ? `${attendanceReport.attendance_rate}%`
                      : (() => {
                          const program =
                            attendanceReport.program_breakdown.find(
                              (p) => p.program === selectedProgram
                            );
                          return program
                            ? `${Math.round(
                                (program.present / program.total) * 100
                              )}%`
                            : "0%";
                        })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "20px",
                marginBottom: "30px",
              }}
            >
              <div>
                <h5
                  style={{
                    color: "#333",
                    marginBottom: "15px",
                  }}
                >
                  Attendance Distribution
                </h5>
                <div
                  style={{
                    height: "300px",
                    backgroundColor: "white",
                    borderRadius: "8px",
                    padding: "15px",
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getChartData()}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        <Cell fill="#4CAF50" />
                        <Cell fill="#F44336" />
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value} participants`, ""]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {selectedProgram === "all" && (
                <div>
                  <h5
                    style={{
                      color: "#333",
                      marginBottom: "15px",
                    }}
                  >
                    Attendance by Program
                  </h5>
                  <div
                    style={{
                      height: "300px",
                      backgroundColor: "white",
                      borderRadius: "8px",
                      padding: "15px",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={getProgramChartData()}
                        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        layout={isMobile ? "vertical" : "horizontal"}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        {isMobile ? (
                          <>
                            <YAxis
                              type="category"
                              dataKey="name"
                              interval={0}
                            />
                            <XAxis type="number" />
                          </>
                        ) : (
                          <>
                            <XAxis
                              type="category"
                              dataKey="name"
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                            />
                            <YAxis type="number" />
                          </>
                        )}
                        <Tooltip
                          formatter={(value) => [`${value} participants`, ""]}
                        />
                        <Legend />
                        <Bar
                          dataKey="present"
                          name="Attendees"
                          fill="#4CAF50"
                        />
                        <Bar dataKey="absent" name="Absentees" fill="#F44336" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Program Breakdown Table */}
            <div>
              <h5
                style={{
                  color: "#333",
                  marginBottom: "15px",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "10px",
                }}
              >
                Program Breakdown
              </h5>
              <div
                style={{
                  overflowX: "auto",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    backgroundColor: "white",
                    borderRadius: "8px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: "#f8f9fa",
                      }}
                    >
                      <th style={{ padding: "12px 15px", textAlign: "left" }}>
                        Program
                      </th>
                      <th style={{ padding: "12px 15px", textAlign: "right" }}>
                        Total
                      </th>
                      <th style={{ padding: "12px 15px", textAlign: "right" }}>
                        Present
                      </th>
                      <th style={{ padding: "12px 15px", textAlign: "right" }}>
                        Absent
                      </th>
                      <th style={{ padding: "12px 15px", textAlign: "right" }}>
                        Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceReport.program_breakdown.map((program) => (
                      <tr
                        key={program.program}
                        style={{
                          borderBottom: "1px solid #eee",
                        }}
                      >
                        <td style={{ padding: "12px 15px" }}>
                          {program.program}
                        </td>
                        <td
                          style={{ padding: "12px 15px", textAlign: "right" }}
                        >
                          {program.total}
                        </td>
                        <td
                          style={{
                            padding: "12px 15px",
                            textAlign: "right",
                            color: "#4CAF50",
                          }}
                        >
                          {program.present}
                        </td>
                        <td
                          style={{
                            padding: "12px 15px",
                            textAlign: "right",
                            color: "#F44336",
                          }}
                        >
                          {program.absent}
                        </td>
                        <td
                          style={{
                            padding: "12px 15px",
                            textAlign: "right",
                            color: "#2196F3",
                          }}
                        >
                          {Math.round((program.present / program.total) * 100)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div
              style={{
                marginTop: "30px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <button
                onClick={handleDownloadCSVReport}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaDownload /> Download CSV Report
              </button>
              <button
                onClick={handleDownloadPDFReport}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#4285F4",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <FaDownload /> Download PDF Report
              </button>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Close
              </button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Reports;
