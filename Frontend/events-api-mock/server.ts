// server.ts - TypeScript version of the mock server

import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001; // Different from your Vite app port (typically 5173)

// Middleware
app.use(cors()); // Enable CORS for your Vite frontend
app.use(express.json());

// Define the Event interface
interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  status: string;
}

// Mock database of events
const mockEvents: Event[] = [
  {
    id: 1,
    name: "Leadership Seminar",
    date: "December 10, 2024",
    location: "Auditorium",
    status: "Attended",
  },
  {
    id: 2,
    name: "Charity Fundraiser",
    date: "November 5, 2024",
    location: "Community Center",
    status: "Attended",
  },
  {
    id: 3,
    name: "Tech Workshop",
    date: "October 15, 2024",
    location: "IT Hall",
    status: "Attended",
  },
  {
    id: 4,
    name: "Environmental Awareness Drive",
    date: "September 30, 2024",
    location: "School Grounds",
    status: "Attended",
  },
  {
    id: 5,
    name: "Career Fair",
    date: "March 15, 2025",
    location: "Main Hall",
    status: "Attended",
  },
  {
    id: 6,
    name: "Coding Competition",
    date: "February 22, 2025",
    location: "Computer Lab",
    status: "Attended",
  }
];

// API endpoint to get attended events
app.get('/api/events/attended', (req, res) => {
  // Simulate some delay like a real database query (500ms)
  setTimeout(() => {
    res.json(mockEvents);
  }, 500);
});

// API endpoint with search functionality built-in
app.get('/api/events/attended/search', (req, res) => {
  const searchTerm = (req.query.q as string)?.toLowerCase() || '';
  
  const filteredEvents = mockEvents.filter(event => 
    event.name.toLowerCase().includes(searchTerm)
  );
  
  // Simulate some delay
  setTimeout(() => {
    res.json(filteredEvents);
  }, 500);
});

// Start the server
app.listen(port, () => {
  console.log(`Mock API server running at http://localhost:${port}`);
});