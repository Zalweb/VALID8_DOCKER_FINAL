const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';


export const login = async (email: string, password: string) => {
  try {
    // Trim inputs
    email = email.trim();
    password = password.trim();

    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Incorrect email or password');
      }
      throw new Error(`Network error: ${response.status}`);
    }

    const data = await response.json();

    // Store the token and user data
    localStorage.setItem('authToken', data.access_token);
    localStorage.setItem('userData', JSON.stringify({
      email: data.email,
      roles: data.roles,
      id: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
    }));

    return {
      token: data.access_token,
      tokenType: data.token_type,
      email: data.email,
      roles: data.roles,
      id: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Authentication failed'
    );
  }
};

// Add this helper function to get the token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Add this function to clear auth data
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
};

// Example of how to use the token in API calls
export const updateEvent = async (eventId: number, eventData: any) => {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${BASE_URL}/events/${eventId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  if (!response.ok) {
    throw new Error(`Failed to update event: ${response.status}`);
  }

  return await response.json();
};