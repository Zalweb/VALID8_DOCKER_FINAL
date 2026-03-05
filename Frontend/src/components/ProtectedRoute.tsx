import { Navigate, Outlet } from "react-router-dom";
import { useMemo } from "react";

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const storedUser = localStorage.getItem("user");

  // If no user is found, redirect to login
  if (!storedUser) {
    return <Navigate to="/" replace />;
  }

  // Parse user data safely
  const user = useMemo(() => {
    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  }, [storedUser]);

  // If user data is invalid, redirect to login
  if (!user || !user.roles) {
    return <Navigate to="/" replace />;
  }

  // Check if the user has at least one allowed role
  const hasAccess = allowedRoles.some((role) => user.roles.includes(role));

  return hasAccess ? <Outlet /> : <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
