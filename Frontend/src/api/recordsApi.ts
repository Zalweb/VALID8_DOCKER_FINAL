// src/api/recordsApi.ts
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Fetch student records function
export const fetchStudentRecords = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/records`);
    return response.data;  // Assuming the response contains an array of student records
  } catch (error) {
    throw error;
  }
};
