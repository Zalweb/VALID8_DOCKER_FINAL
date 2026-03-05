import { useRef, useState, useEffect } from "react";
import "./FaceAttendanceSystem.css";

interface AttendanceRecord {
  id: string;
  name: string;
  time: string;
  date: string;
  faceImage: string;
}

export default function FaceAttendanceSystem() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedFace, setCapturedFace] = useState<string | null>(null);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [cameraActive, setCameraActive] = useState(false);

  // Initialize camera
  useEffect(() => {
    if (!cameraActive) return;

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
  }, [cameraActive]);

  const captureFace = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    setCapturedFace(canvas.toDataURL("image/jpeg"));
    simulateFaceRecognition();
  };

  const simulateFaceRecognition = () => {
    alert("Face captured! Please enter student details.");
  };

  const submitAttendance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId || !studentName) {
      alert("Please enter both student ID and name");
      return;
    }

    const now = new Date();
    const record: AttendanceRecord = {
      id: studentId,
      name: studentName,
      time: now.toLocaleTimeString(),
      date: now.toLocaleDateString(),
      faceImage: capturedFace || "",
    };

    setAttendanceRecords([...attendanceRecords, record]);
    resetForm();
  };

  const resetForm = () => {
    setStudentId("");
    setStudentName("");
    setCapturedFace(null);
    setCameraActive(true);
  };

  const toggleCamera = () => {
    setCameraActive(!cameraActive);
    if (!cameraActive) {
      setCapturedFace(null);
    }
  };

  return (
    <div className="face-attendance-system">
      <h1>Student Attendance System</h1>

      <div className="camera-container">
        {cameraActive ? (
          <video ref={videoRef} width="640" height="480" autoPlay />
        ) : (
          <div className="camera-placeholder">Camera is off</div>
        )}
        <canvas
          ref={canvasRef}
          width="640"
          height="480"
          style={{ display: "none" }}
        />
      </div>

      <div className="controls">
        <button onClick={toggleCamera}>
          {cameraActive ? "Turn Off Camera" : "Turn On Camera"}
        </button>
        <button onClick={captureFace} disabled={!cameraActive}>
          Capture Face
        </button>
        <button
          onClick={submitAttendance}
          disabled={!capturedFace || !studentId || !studentName}
        >
          Submit Attendance
        </button>
        <button onClick={resetForm}>Reset</button>
      </div>

      <div className="student-info">
        <h3>Student Information</h3>
        <form onSubmit={submitAttendance}>
          <div>
            <label htmlFor="studentId">Student ID:</label>
            <input
              type="text"
              id="studentId"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="studentName">Name:</label>
            <input
              type="text"
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              required
            />
          </div>
        </form>
      </div>

      <div className="attendance-list">
        <h3>Today's Attendance</h3>
        <div className="records">
          {attendanceRecords.map((record, index) => (
            <div key={index} className="student-record">
              <strong>{record.name}</strong> (ID: {record.id}) - {record.date}{" "}
              {record.time}
              <img
                src={record.faceImage}
                alt="Captured face"
                width="50"
                style={{ display: "block", marginTop: "5px" }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
