import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { LoadingOutlined } from "@ant-design/icons";

const ProtectedRoute = ({ children, privileges = [] }) => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPrivilege, setHasPrivilege] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/check-auth`, {
          withCredentials: true,
        });

        if (response.data.authenticated) {
          setIsAuthenticated(true);
          console.log("DEV: Authenticated");

          // Map user roles to privileges
          const { isStudent, isAdvisor, isJudge, isCoordinator } = response.data;
          const userRoles = {
            student: isStudent,
            advisor: isAdvisor,
            judge: isJudge,
            coordinator: isCoordinator,
            self: true,
          };

          // Check if user has any of the required privileges
          const userHasPrivilege = privileges.some((role) => userRoles[role]);
          setHasPrivilege(userHasPrivilege);
          if (!userHasPrivilege) {
            console.log("DEV: User lacks the required privileges");
          }
        } else {
          setIsAuthenticated(false);
          console.log("DEV: NOT authenticated, verification failed");
        }
      } catch (error) {
        setIsAuthenticated(false);
        console.log("DEV: Error during authentication check", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [privileges]);

  if (isLoading) {
    return (
      <div style={{ position: "relative", height: "100vh" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            fontSize: "50px",
            transform: "translate(-50%, -50%)",
          }}>
          <LoadingOutlined />
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to home if authenticated but lacks privileges
  if (!hasPrivilege) {
    return <Navigate to="/home" replace />;
  }

  // Render the child component if authenticated and has privileges
  return children;
};

export default ProtectedRoute;
