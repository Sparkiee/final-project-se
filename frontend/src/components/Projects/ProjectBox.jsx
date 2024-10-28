import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserOutlined, StarFilled } from "@ant-design/icons";
import { Tooltip } from "antd";
import axios from "axios";
import { processContent } from "../../utils/htmlProcessor";

const ProjectBox = ({ markFavorite, ...props }) => {
  const navigate = useNavigate();
  const [advisors, setAdvisors] = useState([]);

  useEffect(() => {
    const getAdvisorName = async () => {
      if (props.advisors) {
        try {
          if (props.advisors.length === 0) return;
          const advisors = [];
          for (const advisor of props.advisors) {
            const response = await axios.get(`http://localhost:5000/api/user/get-user-name/${advisor}`, {
              withCredentials: true,
            });
            advisors.push(response.data.name);
          }
          setAdvisors(advisors);
        } catch (error) {
          console.error("Error occurred:", error);
        }
      }
    };
    getAdvisorName();
  }, []);

  return (
    <div className={`project-overlay ${props.isTaken ? "project-overlay-taken" : ""}`}>
      <div className="taken-tag">נלקח</div>
      <div className={`project-box ${props.isTaken ? "project-box-taken" : ""}`}>
        <svg fill="#000000" width="32px" height="32px" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path d="M280 752h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v464c0 4.4 3.6 8 8 8zm192-280h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v184c0 4.4 3.6 8 8 8zm192 72h80c4.4 0 8-3.6 8-8V280c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8v256c0 4.4 3.6 8 8 8zm216-432H144c-17.7 0-32 14.3-32 32v736c0 17.7 14.3 32 32 32h736c17.7 0 32-14.3 32-32V144c0-17.7-14.3-32-32-32zm-40 728H184V184h656v656z" />
        </svg>
        <div className="project-info">
          <div className="project-header">
            <h3 className="project-title">{props.title}</h3>
            {props.isFavorite ? (
              <Tooltip title="הסר ממועדפים">
                <StarFilled className="favorite-star star-marked" onClick={() => markFavorite()} />
              </Tooltip>
            ) : (
              <Tooltip title="הוסף למועדפים">
                <StarFilled
                  className="favorite-star"
                  onClick={() => {
                    markFavorite();
                  }}
                />
              </Tooltip>
            )}
          </div>

          <div className="project-badges">
            <Tooltip title="מתאים ל">
              <div className="project-badge project-suitable">{props.suitableFor}</div>
            </Tooltip>
            <Tooltip title="סוג פרויקט">
              <div className="project-badge project-type">{props.type}</div>
            </Tooltip>
          </div>
          <div
            className="project-description rich-text-content"
            dangerouslySetInnerHTML={{ __html: processContent(props.description, 300) }}
          />

          <div className="project-actions">
            <div className="project-advisors-list">
              {advisors.map((advisor, index) => (
                <div key={index} className="project-advisor">
                  <UserOutlined />
                  <div className="advisor-name">{advisor}</div>
                </div>
              ))}
            </div>
            <div className="more-info" onClick={() => navigate(`/project/${props._id}`)}>
              <Tooltip title="לפירוט מלא + הרשמה">[ למידע נוסף ורישום ]</Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectBox;
