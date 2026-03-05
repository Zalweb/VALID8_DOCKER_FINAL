import { useState, useRef, useEffect } from "react";
import { NavbarStudent } from "../components/NavbarStudent";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import NavbarStudentSSGEventOrganizer from "../components/NavbarStudentSSGEventOrganizer";
import { NavbarSSG } from "../components/NavbarSSG";
import search_logo from "../assets/images/search_logo.png";
import "../css/Attendance.css";
import { FaRegSmileBeam, FaCheckCircle, FaUserAlt } from "react-icons/fa";
import { FiClock, FiMapPin, FiCalendar, FiUser } from "react-icons/fi";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";

interface AttendanceProps {
  role: string;
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

interface Event {
  id: string;
  name: string;
  date: string;
  location: string;
  description: string;
  image?: string;
  status: "active" | "upcoming" | "past";
}

interface Student {
  id: string;
  studentId: string;
  fullName: string;
  yearLevel: string;
  program: string;
  photoUrl?: string;
}

interface AttendanceRecord {
  eventId: string;
  name: string;
  date: string;
  location: string;
  description: string;
  timeIn: string;
  timeOut: string;
  studentId: string;
  studentDetails: Student | null;
  image?: string;
  status: "pending" | "time-in" | "time-out" | "completed";
}

export const Attendance: React.FC<AttendanceProps> = ({ role }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [scanning, setScanning] = useState<number | null>(null);
  const [scanType, setScanType] = useState<"timeIn" | "timeOut" | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetAfterSubmit, setResetAfterSubmit] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch active events from API
  const fetchActiveEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BASE_URL}/activeEvents`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEvents(data);

      // Initialize attendance records for each event
      setAttendanceRecords(
        data.map((event: Event) => ({
          eventId: event.id,
          name: event.name,
          date: event.date,
          location: event.location,
          description: event.description,
          timeIn: "",
          timeOut: "",
          studentId: "",
          studentDetails: null,
          image: event.image,
          status: "pending",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch events");
      console.error("Fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit attendance record to API
  const submitAttendance = async (record: AttendanceRecord) => {
    try {
      const response = await fetch(`${BASE_URL}/attendance`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId: record.eventId,
          studentId: record.studentId,
          timeIn: record.timeIn,
          timeOut: record.timeOut,
          status: record.status,
          studentDetails: record.studentDetails,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error("Error submitting attendance:", err);
      throw err;
    }
  };

  // Verify student ID with API and fetch details
  const verifyStudent = async (studentId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/students/${studentId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error("Error verifying student:", err);
      throw err;
    }
  };

  // Handle student ID change and fetch details
  const handleStudentIdChange = async (index: number, studentId: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record, i) =>
        i === index ? { ...record, studentId, studentDetails: null } : record
      )
    );

    if (studentId.length > 0) {
      try {
        const student = await verifyStudent(studentId);
        if (student) {
          setAttendanceRecords((prev) =>
            prev.map((record, i) =>
              i === index ? { ...record, studentDetails: student } : record
            )
          );
        }
      } catch (err) {
        console.error("Error fetching student details:", err);
      }
    }
  };

  // Reset function for preparing the form for the next student
  const resetForNextStudent = (index: number) => {
    setAttendanceRecords((prev) =>
      prev.map((record, i) => {
        if (i === index) {
          return {
            ...record,
            studentId: "",
            studentDetails: null,
            timeIn: "",
            timeOut: "",
            status: "pending",
          };
        }
        return record;
      })
    );
  };

  useEffect(() => {
    fetchActiveEvents();
  }, []);

  // Initialize camera when showCamera is true
  useEffect(() => {
    if (!showCamera) return;

    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user",
          },
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        alert("Could not access the camera. Please check permissions.");
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCamera]);

  const captureFace = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageData);

    // Process the scan after capture
    if (scanning !== null && scanType) {
      processFaceScan(scanning, scanType, imageData, resetAfterSubmit);
    }
  };

  const processFaceScan = async (
    index: number,
    type: "timeIn" | "timeOut",
    faceImage: string,
    resetAfter = false
  ) => {
    const now = new Date();
    const timeString = now.toTimeString().substring(0, 5);

    // Here you would typically send the faceImage to your face recognition API
    // For this example, we'll assume it returns the student ID
    try {
      // Simulate face recognition API call
      const recognitionResponse = await fetch(`${BASE_URL}/face-recognition`, {
        method: "POST",
        body: JSON.stringify({ image: faceImage }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const recognitionData = await recognitionResponse.json();
      const studentId = recognitionData.studentId;

      // Fetch student details
      const student = await verifyStudent(studentId);

      setAttendanceRecords((prev) =>
        prev.map((record, i) => {
          if (i === index) {
            const updatedRecord = {
              ...record,
              studentId,
              studentDetails: student,
              [type]: timeString,
              status: getNextStatus(record.status, type),
            };

            if (type === "timeOut") {
              updatedRecord.status = "completed";
            }

            return updatedRecord;
          }
          return record;
        })
      );

      // Submit the updated record
      const updatedRecord = attendanceRecords[index];
      await submitAttendance({
        ...updatedRecord,
        studentId,
        studentDetails: student,
        [type]: timeString,
        status:
          type === "timeOut"
            ? "completed"
            : getNextStatus(updatedRecord.status, type),
      });

      // Show success message
      alert(
        `Attendance ${
          type === "timeIn" ? "time-in" : "time-out"
        } recorded successfully for ${student.fullName}!`
      );

      // Reset for next student if requested
      if (resetAfter && type === "timeIn") {
        resetForNextStudent(index);
      }
    } catch (err) {
      console.error("Face recognition error:", err);
      alert("Could not recognize student. Please try manual entry.");
    } finally {
      // Close camera after processing
      setShowCamera(false);
      setScanning(null);
      setScanType(null);
      setCapturedImage(null);
    }
  };

  const filteredEvents = attendanceRecords.filter(
    (event) =>
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startFaceScan = (index: number, type: "timeIn" | "timeOut") => {
    setScanning(index);
    setScanType(type);
    setShowCamera(true);
  };

  const getNextStatus = (
    currentStatus: AttendanceRecord["status"],
    type: "timeIn" | "timeOut"
  ) => {
    if (type === "timeIn") return "time-in";
    if (type === "timeOut") return "time-out";
    return currentStatus;
  };

  const handleManualSubmit = async (index: number, resetAfter = false) => {
    const record = attendanceRecords[index];

    if (!record.studentId) {
      alert("Please enter Student ID");
      return;
    }

    if (!record.studentDetails) {
      alert("Student not found. Please verify the Student ID");
      return;
    }

    try {
      let type: "timeIn" | "timeOut" = "timeIn";
      if (record.status === "time-in") type = "timeOut";

      const now = new Date();
      const timeString = now.toTimeString().substring(0, 5);

      const updatedRecords = attendanceRecords.map((r, i) => {
        if (i === index) {
          const updatedRecord = {
            ...r,
            [type]: timeString,
            status: getNextStatus(r.status, type),
          };

          if (type === "timeOut") {
            updatedRecord.status = "completed";
          }

          return updatedRecord;
        }
        return r;
      });

      setAttendanceRecords(updatedRecords);

      // Submit to API
      await submitAttendance(updatedRecords[index]);

      // Show success message
      alert(
        `Attendance ${
          type === "timeIn" ? "time-in" : "time-out"
        } recorded successfully for ${record.studentDetails.fullName}!`
      );

      // Reset for next student if requested
      if (resetAfter && type === "timeIn") {
        resetForNextStudent(index);
      }
    } catch (err) {
      console.error("Error submitting attendance:", err);
      alert("Failed to submit attendance. Please try again.");
    }
  };

  const getStatusBadge = (status: AttendanceRecord["status"]) => {
    switch (status) {
      case "pending":
        return (
          <span className="ams-status-badge ams-pending">Not Started</span>
        );
      case "time-in":
        return (
          <span className="ams-status-badge ams-time-in">Time In Recorded</span>
        );
      case "time-out":
        return (
          <span className="ams-status-badge ams-time-out">
            Time Out Recorded
          </span>
        );
      case "completed":
        return (
          <span className="ams-status-badge ams-completed">Completed</span>
        );
      default:
        return (
          <span className="ams-status-badge ams-pending">Not Started</span>
        );
    }
  };

  return (
    <div className="ams-page">
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : (
        <NavbarStudent />
      )}

      {/* Camera Modal */}
      {showCamera && (
        <div className="ams-camera-modal">
          <div className="ams-camera-modal-content">
            <h3>Face Scanning</h3>
            <p>Please position your face within the frame</p>

            <div className="ams-camera-container">
              <video ref={videoRef} width="640" height="480" autoPlay />
              <canvas
                ref={canvasRef}
                width="640"
                height="480"
                style={{ display: "none" }}
              />
            </div>

            <div className="ams-camera-controls">
              <button onClick={captureFace}>Capture</button>
              <button
                onClick={() => {
                  setShowCamera(false);
                  setScanning(null);
                  setScanType(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="ams-container">
        <div className="ams-header">
          <div className="ams-header-content">
            <h2 className="ams-title">Attendance Monitoring System</h2>
            <p className="ams-subtitle">
              Official record keeping for university events and activities
            </p>
          </div>

          <div className="ams-search-container">
            <div className="ams-search-box">
              <img src={search_logo} alt="search" className="ams-search-icon" />
              <input
                type="search"
                placeholder="Search events or descriptions..."
                className="ams-search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="ams-loading">
            <div className="spinner"></div>
            <p>Loading events...</p>
          </div>
        )}

        {error && (
          <div className="ams-error">
            <p>{error}</p>
            <button onClick={fetchActiveEvents}>Retry</button>
          </div>
        )}

        <div className="ams-content">
          {!isLoading && !error && filteredEvents.length === 0 ? (
            <div className="ams-no-results">
              <div className="ams-no-results-content">
                <p>No matching events found</p>
                <small>Please try a different search term</small>
              </div>
            </div>
          ) : (
            <div className="ams-cards">
              {filteredEvents.map((event, index) => (
                <div key={index} className="ams-card">
                  <div
                    className="ams-card-header-image"
                    style={{
                      backgroundImage: `url(${
                        event.image ||
                        "https://source.unsplash.com/random/600x400/?event"
                      })`,
                    }}
                  >
                    <div className="ams-header-overlay">
                      <div className="ams-event-badge">
                        {getStatusBadge(event.status)}
                      </div>
                      <h3>{event.name}</h3>
                      <div className="ams-event-details">
                        <span>
                          <FiCalendar className="ams-detail-icon" />{" "}
                          {event.date}
                        </span>
                        <span>
                          <FiMapPin className="ams-detail-icon" />{" "}
                          {event.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="ams-card-body">
                    <p className="ams-event-description">{event.description}</p>

                    <div className="ams-student-info-section">
                      <div className="ams-info-icon">
                        <FiUser size={24} />
                      </div>
                      <div className="ams-info-content">
                        <h4>Student Information</h4>
                        <div className="ams-form-section">
                          <div className="ams-form-group">
                            <label>Student ID</label>
                            <input
                              type="text"
                              placeholder="Enter student ID"
                              value={event.studentId}
                              onChange={(e) =>
                                handleStudentIdChange(index, e.target.value)
                              }
                              disabled={event.status !== "pending"}
                            />
                          </div>

                          {event.studentDetails && (
                            <div className="ams-student-details">
                              <div className="ams-student-photo">
                                {event.studentDetails.photoUrl ? (
                                  <img
                                    src={event.studentDetails.photoUrl}
                                    alt={event.studentDetails.fullName}
                                  />
                                ) : (
                                  <FaUserAlt size={48} />
                                )}
                              </div>
                              <div className="ams-student-info">
                                <h5>{event.studentDetails.fullName}</h5>
                                <p>
                                  <strong>Program:</strong>{" "}
                                  {event.studentDetails.program}
                                </p>
                                <p>
                                  <strong>Year Level:</strong>{" "}
                                  {event.studentDetails.yearLevel}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="ams-time-records-section">
                      <div className="ams-time-record">
                        <h4>Time In</h4>
                        <div className="ams-time-input-group">
                          <button
                            className={`ams-btn ams-face-scan-btn ${
                              scanning === index && scanType === "timeIn"
                                ? "ams-scanning"
                                : ""
                            } ${event.timeIn ? "ams-success" : ""}`}
                            onClick={() => startFaceScan(index, "timeIn")}
                            disabled={
                              !!event.timeIn ||
                              scanning !== null ||
                              !event.studentId
                            }
                          >
                            <FaRegSmileBeam className="ams-face-scan-icon" />
                            {event.timeIn
                              ? "Recorded"
                              : scanning === index && scanType === "timeIn"
                              ? "Scanning..."
                              : "Face Scan"}
                          </button>
                          <div className="ams-time-display">
                            {event.timeIn ? (
                              <span className="ams-recorded">
                                <FiClock /> {event.timeIn}
                              </span>
                            ) : (
                              <span className="ams-pending">
                                {event.studentId
                                  ? "Not recorded"
                                  : "Enter Student ID first"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ams-time-record">
                        <h4>Time Out</h4>
                        <div className="ams-time-input-group">
                          <button
                            className={`ams-btn ams-face-scan-btn ${
                              scanning === index && scanType === "timeOut"
                                ? "ams-scanning"
                                : ""
                            } ${event.timeOut ? "ams-success" : ""}`}
                            onClick={() => startFaceScan(index, "timeOut")}
                            disabled={
                              !event.timeIn ||
                              !!event.timeOut ||
                              scanning !== null
                            }
                          >
                            <FaRegSmileBeam className="ams-face-scan-icon" />
                            {event.timeOut
                              ? "Recorded"
                              : scanning === index && scanType === "timeOut"
                              ? "Scanning..."
                              : "Face Scan"}
                          </button>
                          <div className="ams-time-display">
                            {event.timeOut ? (
                              <span className="ams-recorded">
                                <FiClock /> {event.timeOut}
                              </span>
                            ) : (
                              <span className="ams-pending">
                                {event.timeIn
                                  ? "Not recorded"
                                  : "Complete Time In first"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reset after submission option */}
                    <div className="ams-submit-options">
                      <label className="ams-reset-option">
                        <input
                          type="checkbox"
                          checked={resetAfterSubmit}
                          onChange={(e) =>
                            setResetAfterSubmit(e.target.checked)
                          }
                        />
                        Reset for next student after time-in
                      </label>
                    </div>

                    <div className="ams-submit-section">
                      <button
                        className="ams-submit-btn"
                        onClick={() =>
                          handleManualSubmit(index, resetAfterSubmit)
                        }
                        disabled={
                          event.status === "completed" ||
                          scanning !== null ||
                          !event.studentId ||
                          !event.studentDetails
                        }
                      >
                        {event.status === "completed" ? (
                          <>
                            <IoMdCheckmarkCircleOutline /> Attendance Complete
                          </>
                        ) : (
                          "Submit Attendance"
                        )}
                      </button>
                      <p className="ams-alternative-text">
                        {event.status !== "completed" &&
                          "If face scan fails, enter Student ID and click Submit"}
                      </p>
                    </div>

                    {/* Next Student button only shows after time-in is complete */}
                    {event.status === "time-in" && (
                      <div className="ams-next-student-section">
                        <button
                          className="ams-next-student-btn"
                          onClick={() => resetForNextStudent(index)}
                        >
                          <FiUser className="ams-next-icon" /> Process Next
                          Student
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
