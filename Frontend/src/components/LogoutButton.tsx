import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import "../css/LogoutButton.css";

const LogoutButton = () => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmLogout = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      localStorage.clear();
      navigate("/", { replace: true });
    }, 1000);
  };

  const handleCancelLogout = () => {
    setShowConfirm(false);
  };

  return (
    <>
      {/* Main Logout Button */}
      <button onClick={handleLogoutClick} className="logout-button">
        <FiLogOut className="logout-icon" />
        <span>Logout</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="logout-confirm-overlay">
          <div className="logout-confirm-dialog">
            <div className="logout-confirm-header">
              <FiLogOut className="confirm-icon" />
              <h3>Confirm Logout</h3>
            </div>
            <p>Are you sure you want to sign out of your account?</p>
            <div className="logout-confirm-actions">
              <button
                className="logout-confirm-cancel"
                onClick={handleCancelLogout}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                className="logout-confirm-proceed"
                onClick={handleConfirmLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging Out..." : "Yes, Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-screen Loading Overlay */}
      {isLoggingOut && (
        <div className="logout-loading-overlay">
          <div className="logout-loading-content">
            <div className="logout-loading-spinner"></div>
            <p>Signing you out...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default LogoutButton;
