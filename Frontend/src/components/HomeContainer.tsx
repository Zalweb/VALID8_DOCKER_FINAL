import logoValid8 from "../assets/images/logo-valid83_transparent.png";

export const HomeContainer = () => {
  return (
    <>
      {/* Home Container - Wrap Everything */}
      <div className="header">
        {/* Header Section */}
        <header className="header">
          <div className="logo-container">
            <img src={logoValid8} alt="Valid8 Logo" className="logo-home" />
            <h1 className="system-name">Valid8</h1>
          </div>
        </header>
      </div>
    </>
  );
};
