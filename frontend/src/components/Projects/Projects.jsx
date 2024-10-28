import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Projects.scss";
import { Tooltip } from "antd";
import ProjectBox from "./ProjectBox";
import { Watermark } from "antd";
import DownloadFile from "../DownloadFile/DownloadFile";

const Projects = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const grabProjects = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/project/available-projects", {
          withCredentials: true
        });

        const projectsWithFavorites = await Promise.all(
          response.data.map(async (project) => {
            const responsePerProject = await axios.get(
              `http://localhost:5000/api/user/ensure-favorite/${project._id}`,
              {
                withCredentials: true
              }
            );
            return {
              ...project,
              isFavorite: responsePerProject.data.favorite
            };
          })
        );
        setProjects(sortProjects(projectsWithFavorites)); // Set sorted projects
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };
    grabProjects();
  }, []);

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
        "http://localhost:5000/api/user/toggle-favorite",
        {
          projectId: project._id
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
    <div className="projects">
      <h2>רשימת פרויקטים</h2>
      <div className="list-projects">
        {projects.length > 0 ? (
          projects.map((project) => (
            <ProjectBox
              key={project._id} // Assuming each project has a unique _id field
              {...project}
              markFavorite={() => {
                toggleFavorite(project);
              }}
            />
          ))
        ) : (
          <p>אין פרויקטים זמינים כרגע</p>
        )}
      </div>

      {/* <DownloadFile /> */}
    </div>
  );
};

export default Projects;
