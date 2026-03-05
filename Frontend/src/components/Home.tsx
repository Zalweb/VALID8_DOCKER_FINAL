import "../App.css";
import LoginForm from "./LoginForm";
import schoolImage from "../assets/images/logo-jrmsu.jpg";
import backgroundImage from "../assets/images/bg_image.jpg"; // Replace with a high-quality institutional image

export const Home = () => {
  return (
    <div
      className="home-page"
      style={{
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.1)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="main-content">
        {/* University Information */}
        <div className="university-info">
          <h1 className="university-name">
            Jose Rizal Memorial State University
          </h1>
          <h2 className="system-title">Event Attendance Management System</h2>
          <p className="campus-location">Main Campus, Dapitan City</p>
        </div>

        {/* Login Form */}
        <div className="form-container">
          <div className="logo-wrapper">
            <img src={schoolImage} alt="JRMSU Logo" className="school-logo" />
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
};

export default Home;
