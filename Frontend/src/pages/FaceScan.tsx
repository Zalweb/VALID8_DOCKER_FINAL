// FaceScan.tsx
import React, { useState, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { NavbarStudent } from "../components/NavbarStudent";
import { NavbarStudentSSG } from "../components/NavbarStudentSSG";
import { NavbarStudentSSGEventOrganizer } from "../components/NavbarStudentSSGEventOrganizer";
import { NavbarSSG } from "../components/NavbarSSG";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

interface RecordsProps {
  role: string;
}

export const FaceScan: React.FC<RecordsProps> = ({ role }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const eventIdFromQuery = Number(searchParams.get("eventId"));

  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">(
    "info"
  );
  const [activeTab, setActiveTab] = useState<
    "register" | "verify" | "attendance"
  >("register");
  const [eventId, setEventId] = useState<number>(
    Number.isFinite(eventIdFromQuery) && eventIdFromQuery > 0
      ? eventIdFromQuery
      : 1
  );

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

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (error) {
      setMessage("Error accessing camera: " + (error as Error).message);
      setMessageType("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const captureImage = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext("2d");

    if (!context) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/jpeg", 0.8);
  }, []);

  const handleRegisterFace = async () => {
    if (!isStreaming) {
      setMessage("Please start camera first");
      setMessageType("error");
      return;
    }

    const imageBase64 = captureImage();
    if (!imageBase64) {
      setMessage("Failed to capture image");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/face/register`, {
        method: "POST",
        body: JSON.stringify({ image_base64: imageBase64 }),
      });

      const result = await response.json();
      setMessage(
        `Face registered successfully for student ${result.student_id}`
      );
      setMessageType("success");
    } catch (error) {
      setMessage("Registration failed: " + (error as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadRegister = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Create custom fetch for file upload
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`${BASE_URL}/face/register-upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setMessage(
        `Face registered successfully for student ${result.student_id}`
      );
      setMessageType("success");
    } catch (error) {
      setMessage("Upload failed: " + (error as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyFace = async () => {
    if (!isStreaming) {
      setMessage("Please start camera first");
      setMessageType("error");
      return;
    }

    const imageBase64 = captureImage();
    if (!imageBase64) {
      setMessage("Failed to capture image");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetchWithAuth(`${BASE_URL}/face/verify`, {
        method: "POST",
        body: JSON.stringify({ image_base64: imageBase64 }),
      });

      const result = await response.json();
      if (result.match_found) {
        setMessage(
          `Match found: ${result.student_name} (ID: ${result.student_id})`
        );
        setMessageType("success");
      } else {
        setMessage("No matching student found");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Verification failed: " + (error as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceScan = async () => {
    if (!isStreaming) {
      setMessage("Please start camera first");
      setMessageType("error");
      return;
    }

    const imageBase64 = captureImage();
    if (!imageBase64) {
      setMessage("Failed to capture image");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      // FIXED: Use the correct endpoint path with '/face/' prefix
      const response = await fetchWithAuth(
        `${BASE_URL}/face/face-scan-with-recognition`,
        {
          method: "POST",
          body: JSON.stringify({
            event_id: eventId,
            image_base64: imageBase64,
          }),
        }
      );

      const result = await response.json();
      if (result.action === "time_in") {
        setMessage(
          `Check-in recorded for ${result.student_name} (${result.student_id})`
        );
      } else if (result.action === "timeout") {
        setMessage(
          `Check-out recorded for ${result.student_name} (${result.student_id}). Duration: ${result.duration_minutes} minutes`
        );
      }
      setMessageType("success");
    } catch (error) {
      setMessage("Attendance scan failed: " + (error as Error).message);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Cleanup camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  React.useEffect(() => {
    if (Number.isFinite(eventIdFromQuery) && eventIdFromQuery > 0) {
      setEventId(eventIdFromQuery);
    }
  }, [eventIdFromQuery]);

  return (
    <div className="face-scan-container">
      {role === "student-ssg" ? (
        <NavbarStudentSSG />
      ) : role === "student-ssg-eventorganizer" ? (
        <NavbarStudentSSGEventOrganizer />
      ) : role === "ssg" ? (
        <NavbarSSG />
      ) : (
        <NavbarStudent />
      )}
      <style>{`
        .face-scan-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #ccc;
          margin-bottom: 20px;
        }

        .tab {
          padding: 10px 20px;
          cursor: pointer;
          background: #f5f5f5;
          border: 1px solid #ccc;
          border-bottom: none;
          margin-right: 5px;
        }

        .tab.active {
          background: white;
          border-bottom: 1px solid white;
          margin-bottom: -1px;
        }

        .camera-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .video-container {
          position: relative;
          display: inline-block;
        }

        video {
          width: 100%;
          max-width: 640px;
          border: 2px solid #ddd;
          border-radius: 8px;
        }

        canvas {
          display: none;
        }

        .controls {
          margin-top: 15px;
          text-align: center;
        }

        button {
          padding: 10px 20px;
          margin: 5px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 14px;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn-primary:hover {
          background: #0056b3;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover {
          background: #545b62;
        }

        .btn-success {
          background: #28a745;
          color: white;
        }

        .btn-success:hover {
          background: #218838;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .message.info {
          background: #d1ecf1;
          color: #0c5460;
          border: 1px solid #bee5eb;
        }

        .upload-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .file-input {
          margin: 10px 0;
        }

        input[type="file"] {
          padding: 5px;
          border: 1px solid #ddd;
          border-radius: 3px;
        }

        .event-selector {
          margin-bottom: 20px;
        }

        .event-selector label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        .event-selector input {
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 3px;
          width: 200px;
        }

        .loading {
          display: inline-block;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <h1>Face Recognition System</h1>

      <div className="tabs">
        <div
          className={`tab ${activeTab === "register" ? "active" : ""}`}
          onClick={() => setActiveTab("register")}
        >
          Register Face
        </div>
        <div
          className={`tab ${activeTab === "verify" ? "active" : ""}`}
          onClick={() => setActiveTab("verify")}
        >
          Verify Face
        </div>
        <div
          className={`tab ${activeTab === "attendance" ? "active" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          Attendance Scan
        </div>
      </div>

      {message && <div className={`message ${messageType}`}>{message}</div>}

      <div className="camera-section">
        <h3>Camera Feed</h3>
        <div className="video-container">
          <video ref={videoRef} autoPlay playsInline />
          <canvas ref={canvasRef} />
        </div>
        <div className="controls">
          {!isStreaming ? (
            <button className="btn-primary" onClick={startCamera}>
              Start Camera
            </button>
          ) : (
            <button className="btn-danger" onClick={stopCamera}>
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {activeTab === "register" && (
        <div>
          <h3>Register Face</h3>
          <p>
            Position your face in the camera and click "Register Face" to
            capture and register your face.
          </p>
          <div className="controls">
            <button
              className="btn-success"
              onClick={handleRegisterFace}
              disabled={loading || !isStreaming}
            >
              {loading ? <span className="loading">⟳</span> : ""} Register Face
            </button>
          </div>

          <div className="upload-section">
            <h4>Or upload an image:</h4>
            <div className="file-input">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleUploadRegister}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "verify" && (
        <div>
          <h3>Verify Face</h3>
          <p>
            Position your face in the camera and click "Verify Face" to check if
            it matches any registered student.
          </p>
          <div className="controls">
            <button
              className="btn-success"
              onClick={handleVerifyFace}
              disabled={loading || !isStreaming}
            >
              {loading ? <span className="loading">⟳</span> : ""} Verify Face
            </button>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <div>
          <h3>Attendance Scan</h3>
          <div className="event-selector">
            <label htmlFor="eventId">Event ID:</label>
            <input
              type="number"
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(parseInt(e.target.value) || 1)}
              min="1"
            />
          </div>
          <p>
            Position student's face in the camera and click "Scan for
            Attendance" to record check-in/check-out.
          </p>
          <div className="controls">
            <button
              className="btn-success"
              onClick={handleAttendanceScan}
              disabled={loading || !isStreaming}
            >
              {loading ? <span className="loading">⟳</span> : ""} Scan for
              Attendance
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FaceScan;
