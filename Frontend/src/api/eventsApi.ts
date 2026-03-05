const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3003";

// Update your Event interface to match the backend
interface Event {
  id: number;
  name: string;
  location: string;
  start_datetime: string;  // Changed from 'date'
  end_datetime: string;    // New field
  status: EventStatus;     // Changed to enum type
  departments?: Department[];
  programs?: Program[];
  ssg_members?: SSGProfile[];
}

// Add these supporting interfaces
interface Department {
  id: number;
  name: string;
}

interface Program {
  id: number;
  name: string;
}

interface SSGProfile {
  id: number;
  position: string;
  user: User;
}

type EventStatus = "upcoming" | "ongoing" | "completed" | "cancelled";

// eventsApi.ts
export const fetchUpcomingEvents = async (): Promise<Event[]> => {
  try {
    const response = await fetch(`${BASE_URL}/events?status=upcoming`);
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch (error) {
    console.error("Error fetching upcoming events:", error);
    throw error;
  }
};

export const fetchEventsByStatus = async (status: EventStatus): Promise<Event[]> => {
  try {
    const response = await fetch(`${BASE_URL}/events?status=${status}`);
    if (!response.ok) throw new Error('Network error');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${status} events:`, error);
    throw error;
  }
};


export const fetchEventsAttended = async (): Promise<Event[]> => {
  try {
    const response = await fetch(`${BASE_URL}/eventsAttended`);
    
    if (!response.ok) throw new Error('Network error');
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching attended events:", error);
    throw error;
  }
};

