import React, { useEffect, useState } from "react";
import "./WrongPath.scss";
import { useNavigate } from "react-router-dom";
import { Result, Button, Spin } from "antd";
import collegeLogo from "../../assets/CollegeLogo.png";
import projectManagementLogo from "../../assets/project-management-logo.png";

const WrongPath = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={`wrong-path ${isLoggedIn ? "" : "not-logged-in"}`}>
      {!isLoggedIn && (
        <>
          <img src={projectManagementLogo} alt="project management logo" className="project-management-logo" />
          <img src={collegeLogo} alt="collage logo" className="collage-logo" />
        </>
      )}
      <Result
        status="404"
        title="404"
        subTitle="סליחה, העמוד שהגעת אליו אינו קיים."
        extra={
          <Button type="primary" onClick={() => navigate(isLoggedIn ? "/home" : "/login")}>
            {isLoggedIn ? "לעמוד הראשי" : "להתחברות"}
          </Button>
        }
      />
    </div>
  );
};

export default WrongPath;
