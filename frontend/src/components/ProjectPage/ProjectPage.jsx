import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Tooltip, message, Spin } from "antd";
import { UserOutlined, LoadingOutlined } from "@ant-design/icons";
import "./ProjectPage.scss";
import { processContent } from "../../utils/htmlProcessor";
import { NotificationsContext } from "../../utils/NotificationsContext";
import WrongPath from "../WrongPath/WrongPath";

const ProjectPage = () => {
  const { projectID } = useParams();
  const navigate = useNavigate();
  const { fetchNotifications } = useContext(NotificationsContext);
  const [projectData, setProjectData] = useState({});
  const [advisors, setAdvisors] = useState([]);
  const [isCandidate, setIsCandidate] = useState(false);
  const [hasProject, setHasProject] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProject, setIsLoadingProject] = useState(true);
  const [error, setError] = useState(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });

  useEffect(() => {
    const checkIfProjectExists = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/get-project/${projectID}`, {
          withCredentials: true,
        });
        if (!response.data) {
          setError(true);
        } else {
          setProjectData(response.data);
        }
      } catch (error) {
        console.error("Error occurred:", error);
        setError(true);
      } finally {
        setIsLoadingProject(false);
      }
    };
    checkIfProjectExists();
  }, [projectID, navigate]);

  useEffect(() => {
    if (!projectData._id) return;

    const checkIfUserCandidate = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/project/check-if-candidate/${projectID}`,
          {
            withCredentials: true,
          }
        );
        setIsCandidate(response.data.isCandidate);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };

    const getAdvisorInfo = async () => {
      if (projectData.advisors) {
        try {
          if (projectData.advisors.length === 0) return;
          const advisors = [];
          for (const advisor of projectData.advisors) {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/get-user-info/${advisor}`, {
              withCredentials: true,
            });
            advisors.push(response.data);
          }
          setAdvisors(advisors);
        } catch (error) {
          console.error("Error occurred:", error);
        }
      }
    };

    const checkUserHasProject = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/user/check-user-has-projects/${user._id}`,
          {
            withCredentials: true,
          }
        );
        setHasProject(response.data.hasProject);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };

    checkIfUserCandidate();
    getAdvisorInfo();
    checkUserHasProject();
    fetchNotifications();
  }, [projectData, projectID, user._id, fetchNotifications]);

  const copyToClipboard = () => {
    const emails = advisors.map((advisor) => advisor.email).join(", ");
    navigator.clipboard.writeText(emails);
    message.success("אימייל הועתק");
  };

  const Unsignup = async () => {
    try {
      setIsLoading(true);
      message.open({
        type: "loading",
        content: "מבצע הסרת הרשמה מהפרויקט...",
      });
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/get-user`, {
        withCredentials: true,
      });
      const userID = response.data._id;
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/remove-candidate`,
        { projectID: projectID, userID: userID },
        { withCredentials: true }
      );
      setTimeout(() => {
        message.open({
          type: "success",
          content: "הוסר הרשמה מהפרויקט",
          duration: 2,
        });
      }, 500);
      fetchNotifications();
    } catch (error) {
      console.log("Error occurred:", error.response.data.message);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsCandidate(false);
      }, 1000);
    }
  };

  const Signup = async () => {
    try {
      setIsLoading(true);
      message.open({
        type: "loading",
        content: "מבצע הרשמה לפרויקט...",
      });
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/project/add-candidate`,
        { projectID: projectID },
        { withCredentials: true }
      );
      setTimeout(() => {
        message.open({
          type: "success",
          content: "נרשם בהצלחה",
          duration: 2,
        });
      }, 500);
      fetchNotifications();
    } catch (error) {
      console.log("Error occurred:", error.response.data.message);
      setTimeout(() => {
        message.open({
          type: "error",
          content: error.response.data.message,
          duration: 2,
        });
      }, 500);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setIsCandidate(true);
      }, 1000);
    }
  };

  if (isLoadingProject) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <WrongPath />;
  }

  return (
    <div className="project-container">
      <div className="project-profile-header">
        <h2 className="project-title">{projectData.title}</h2>
      </div>
      <div className="project-advisors-list">
        {advisors.map((advisor, index) => (
          <div key={index} className="project-advisor">
            <UserOutlined />
            <div className="project-advisor-name">{advisor.name}</div>
          </div>
        ))}
      </div>
      <hr className="project-profile-line"></hr>
      <div className="project-profile-info project-profile-content">
        <div className="project-profile-info-item">
          <div className="project-profile-info-title" style={{ fontWeight: "600" }}>
            תיאור הפרויקט
          </div>
          <div
            className="project-profile-info-text rich-text-content"
            dangerouslySetInnerHTML={{ __html: processContent(projectData.description) }}></div>
        </div>
        <div className="project-profile-info-item project-badges">
          <div className="project-profile-info-title" style={{ fontWeight: "600" }}>
            התאמות:
          </div>
          <Tooltip title="מתאים ל">
            <div className="project-badge project-suitable">{projectData.suitableFor}</div>
          </Tooltip>
          <Tooltip title="סוג פרויקט">
            <div className="project-badge project-type">{projectData.type}</div>
          </Tooltip>
        </div>
        <div className="project-profile-info-item project-profile-info-emails">
          <div className="project-profile-info-title" style={{ fontWeight: "600" }}>
            אימייל המנחה ליצירת קשר:
          </div>
          <div className="project-profile-info-text project-profile-info-email">
            {advisors.map((advisor, index) => (
              <Tooltip key={index} title="לחץ להעתקה">
                <div
                  className="advisor-email"
                  onClick={() => {
                    copyToClipboard();
                  }}>
                  {advisor.email}
                </div>
              </Tooltip>
            ))}
            {advisors.length === 0 && <div>אין מנחה לפרויקט זה כרגע</div>}
          </div>
        </div>
        {projectData.externalEmail && (
          <div className="project-profile-info-item project-profile-info-emails">
            <div className="project-profile-info-title">אימייל גורם חיצוני:</div>
            <div className="project-profile-info-text project-profile-info-email">
              <Tooltip title="לחץ להעתקה">
                <div
                  className="advisor-email"
                  onClick={() => {
                    copyToClipboard();
                  }}>
                  {projectData?.externalEmail}
                </div>
              </Tooltip>
            </div>
          </div>
        )}
        {!hasProject && user.isStudent && !projectData.isTaken ? (
          isCandidate ? (
            <div className="project-unsignup-button" onClick={() => Unsignup()}>
              {isLoading ? (
                <div className="loading-registration">
                  <Spin indicator={<LoadingOutlined spin />} />
                  <span>מבצע הסרת הרשמה</span>
                </div>
              ) : (
                "הסר הרשמה מפרויקט"
              )}
            </div>
          ) : (
            <div className="project-signup-button" onClick={() => Signup()}>
              {isLoading ? (
                <div className="loading-registration">
                  <Spin indicator={<LoadingOutlined spin />} />
                  <span>מבצע הרשמה</span>
                </div>
              ) : (
                "הרשמה לפרויקט"
              )}
            </div>
          )
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default ProjectPage;
