import React, { useEffect, useState } from "react";
import "./HomePage.scss";
import axios from "axios";
import { Statistic } from "antd";
import CountUp from "react-countup";

const Homepage = () => {
  const [numOfOpenProjects, setNumOfOpenProjects] = useState(0);
  const [numOfTakenProjects, setNumOfTakenProjects] = useState(0);
  const [numOfFinishedProjects, setNumOfFinishedProjects] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/project/status", { withCredentials: true });
        setNumOfOpenProjects(response.data.numOfOpenProjects);
        setNumOfTakenProjects(response.data.numOfTakenProjects);
        setNumOfFinishedProjects(response.data.numOfFinishedProjects);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };

    fetchData();
  }, []);

  const formatter = (value) => <CountUp end={value} separator="," />;
  return (
    <div className="home-page">
      <div className="home-page-statistics">
        <Statistic title="פרויקטים פתוחים" value={numOfOpenProjects} formatter={formatter} />
        <Statistic title="פרויקטים לקוחים" value={numOfTakenProjects} formatter={formatter} />
        <Statistic title="פרויקטים שהושלמו" value={numOfFinishedProjects} formatter={formatter} />
      </div>
      <div className="home-page-updates">
        <h2>עדכונים</h2>
      </div>
      <div className="home-page-upcoming-events">
        <h2>אירועים קרובים</h2>
      </div>
    </div>
  );
};

export default Homepage;
