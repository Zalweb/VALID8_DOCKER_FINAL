import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
import { FaUser, FaLock, FaEnvelope, FaEye, FaEyeSlash } from "react-icons/fa";
import { motion } from "framer-motion";

const LoginForm = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      const userData = await login(email, password);

      if (!userData.token || !userData.roles) {
        throw new Error("Invalid response from server.");
      }

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", userData.token);

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Role-based redirection
      if (userData.roles.includes("admin")) {
        navigate("/admin_dashboard");
      } else if (
        userData.roles.includes("student") &&
        userData.roles.includes("ssg") &&
        userData.roles.includes("event-organizer")
      ) {
        navigate("/student_ssg_eventorganizer_dashboard");
      } else if (
        userData.roles.includes("student") &&
        userData.roles.includes("ssg")
      ) {
        navigate("/student_ssg_dashboard");
      } else if (userData.roles.includes("student")) {
        navigate("/student_dashboard");
      } else if (userData.roles.includes("ssg")) {
        navigate("/ssg_dashboard");
      } else if (userData.roles.includes("event-organizer")) {
        navigate("/event_organizer_dashboard");
      } else {
        alert("No valid role found!");
      }
    } catch (error: any) {
      alert(error.message || "Login failed! Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <h4 className="user-login-title">
        <FaUser className="user-icon" /> User Login
      </h4>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">
            <FaEnvelope className="input-icon" /> Email
          </label>
          <input
            type="email"
            className="form-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
            minLength={2}
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            <FaLock className="input-icon" /> Password
          </label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength={8}
              maxLength={30}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </div>

        <div className="form-options">
          <div className="remember-me">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">Remember me</label>
          </div>
        </div>

        <motion.button
          type="submit"
          className="login-button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isLoading}
        >
          {isLoading ? <span className="spinner"></span> : "Login"}
        </motion.button>
      </form>
    </div>
  );
};

export default LoginForm;
