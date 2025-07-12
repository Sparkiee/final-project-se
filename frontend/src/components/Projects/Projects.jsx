import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./Projects.scss";
import ProjectBox from "./ProjectBox";
import { Select } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { NotificationsContext } from "../../utils/NotificationsContext";
import { toJewishDate, formatJewishDateInHebrew } from "jewish-date";

const Projects = () => {
  const { fetchNotifications } = useContext(NotificationsContext);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [years, setYears] = useState([]);
  const [yearFilter, setYearFilter] = useState(null);

  useEffect(() => {
    const fetchYears = async () => {
      try {
        setIsLoading(true);
        const [projectsResponse, configResponse] = await Promise.all([
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/years`, {
            withCredentials: true,
          }),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/config/get-config`, {
            withCredentials: true,
          }),
        ]);
        const sortedYears = projectsResponse.data.sort((a, b) => b.localeCompare(a));
        setYears(sortedYears);

        const currentHebrewYear = formatJewishDateInHebrew(toJewishDate(new Date())).split(" ").pop().replace(/^ה/, "");
        const currentHebrewYearIndex = sortedYears.indexOf(currentHebrewYear);
        if (sortedYears.includes(configResponse.data.currentYear)) {
          setYearFilter(configResponse.data.currentYear);
        } else {
          setYearFilter(currentHebrewYearIndex !== -1 ? sortedYears[currentHebrewYearIndex] : sortedYears[0]);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error occurred:", error);
        setIsLoading(false);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    const grabProjects = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/api/project/available-projects/${yearFilter}`,
          {
            withCredentials: true,
          }
        );

        const projectsWithFavorites = await Promise.all(
          response.data
            .filter((project) => project.advisors.length > 0)
            .map(async (project) => {
              const responsePerProject = await axios.get(
                `${process.env.REACT_APP_BACKEND_URL}/api/user/ensure-favorite/${project._id}`,
                {
                  withCredentials: true,
                }
              );
              const myProject = project.students.map((student) => student.student).includes(currentUser._id);
              return {
                ...project,
                isFavorite: responsePerProject.data.favorite,
                myProject,
              };
            })
        );

        setProjects(sortProjects(projectsWithFavorites)); // Set sorted projects
        setIsLoading(false);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };

    if (yearFilter == null) return;
    grabProjects();
    fetchNotifications();
  }, [yearFilter]);

  useEffect(() => {
    projects.forEach((project) => {
      const projectElement = document.querySelector(`#project-${project._id}`);
      if (projectElement) {
        if (project.isTaken) {
          projectElement.classList.add("taken");
        } else {
          projectElement.classList.remove("taken");
        }
      }
    });
  }, [projects]);

  const toggleFavorite = async (project) => {
    if (project.isTaken) return; // Do not allow marking a taken project as favorite
    try {
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/toggle-favorite`,
        {
          projectId: project._id,
        },
        { withCredentials: true }
      );

      // Update project state
      const updatedProjects = projects.map((proj) => {
        if (proj._id === project._id) {
          return { ...proj, isFavorite: !proj.isFavorite }; // Toggle the isFavorite status
        }
        return proj; // Return the project unchanged
      });

      setProjects(sortProjects(updatedProjects)); // Update state with sorted projects
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const sortProjects = (projectList) => {
    projectList.sort((a, b) => {
      // If a project is the user's project, it should go first
      if (a.myProject && !b.myProject) return -1;
      if (!a.myProject && b.myProject) return 1;

      // If a project is taken, it should go last
      if (a.isTaken && !b.isTaken) return 1;
      if (!a.isTaken && b.isTaken) return -1;

      // If neither or both are taken, sort by favorite
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      return 0;
    });

    return projectList;
  };

  return (
    <div>
      {isLoading ? (
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
      ) : (
        <div className="projects">
          <div className="projects-header">
            <p>פרויקטים עבור שנת הלימודים: </p>
            <Select value={yearFilter} placeholder="בחר שנה" onChange={setYearFilter} style={{ width: "200px" }}>
              <Select.Option value="all">כל השנים</Select.Option>
              {years.map((year) => (
                <Select.Option key={year} value={year}>
                  {year}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div className="list-projects">
            {projects.length > 0 ? (
              projects.map((project) => (
                <ProjectBox
                  key={project._id} // Assuming each project has a unique _id field
                  {...project}
                  markFavorite={() => {
                    toggleFavorite(project);
                  }}
                  isMyProject={project.myProject}
                />
              ))
            ) : (
              <h2>אין פרויקטים זמינים כרגע</h2>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
