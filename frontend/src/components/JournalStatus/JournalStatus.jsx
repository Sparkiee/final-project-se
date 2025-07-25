import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import Highlighter from "react-highlight-words";
import { handleMouseDown } from "../../utils/mouseDown";
import { getColumnSearchProps as getColumnSearchPropsUtil } from "../../utils/tableUtils";
import { useNavigate } from "react-router-dom";
import { Table, Divider, Select } from "antd";
import { toJewishDate, formatJewishDateInHebrew } from "jewish-date";
import { NotificationsContext } from "../../utils/NotificationsContext";

const JournalStatus = () => {
  const navigate = useNavigate();
  const { fetchNotifications } = useContext(NotificationsContext);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const [yearFilter, setYearFilter] = useState(null);
  const [years, setYears] = useState([]);
  const searchInput = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchYears = async () => {
      try {
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
      } catch (error) {
        console.error("Error fetching years:", error);
      }
    };

    fetchYears();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [projectsResponse, yearsResponse] = await Promise.all([
          axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/project/get-self-projects-by-year`,
            { year: yearFilter },
            { withCredentials: true }
          ),
          axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/years`, {
            withCredentials: true,
          }),
        ]);

        const projects = projectsResponse.data.projects.filter((project) => project.students.length > 0);

        setProjects(projects);
        setYears(yearsResponse.data.sort((a, b) => b.localeCompare(a)));

        if (!yearFilter) {
          const currentHebrewYear = formatJewishDateInHebrew(toJewishDate(new Date()))
            .split(" ")
            .pop()
            .replace(/^ה/, "");
          const currentHebrewYearIndex = yearsResponse.data.indexOf(currentHebrewYear);
          setYearFilter(
            currentHebrewYearIndex !== -1 ? yearsResponse.data[currentHebrewYearIndex] : yearsResponse.data[0]
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (yearFilter !== null) {
      fetchData();
    }
    fetchNotifications();
  }, [yearFilter]);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const getColumnSearchProps = (dataIndex) =>
    getColumnSearchPropsUtil(dataIndex, searchInput, handleSearch, handleReset, searchText);

  const columns = [
    {
      title: "שם פרויקט",
      dataIndex: "projectName",
      key: "projectName",
      fixed: windowSize.width > 626 && "left",
      width:
        windowSize.width > 1600
          ? "30%"
          : windowSize.width > 1200
          ? "25%"
          : windowSize.width > 1024
          ? 330
          : windowSize.width > 768
          ? 300
          : 200,
      ...getColumnSearchProps("projectName"),
      render: (text, record) => (
        <a
          onClick={() => navigate(`/journal/${record.key}`)}
          onMouseDown={(e) => handleMouseDown(e, `/journal/${record.key}`)}>
          <Highlighter
            highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
            searchWords={[searchText]}
            autoEscape
            textToHighlight={
              windowSize.width > 1600
                ? record.projectName && record.projectName.length > 60
                  ? `${record.projectName.slice(0, 60)}...`
                  : record.projectName
                : windowSize.width > 1200
                ? record.projectName && record.projectName.length > 50
                  ? `${record.projectName.slice(0, 50)}...`
                  : record.projectName
                : windowSize.width > 1024
                ? record.projectName && record.projectName.length > 35
                  ? `${record.projectName.slice(0, 35)}...`
                  : record.projectName
                : record.projectName && record.projectName.length > 30
                ? `${record.projectName.slice(0, 30)}...`
                : record.projectName
            }
          />
        </a>
      ),
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
      defaultSortOrder: "ascend",
      sortDirections: ["ascend", "descend"],
    },
    {
      title: "שם סטודנט",
      dataIndex: "studentName",
      key: "studentName",
      width: windowSize.width > 1600 ? "15%" : windowSize.width > 1200 ? "10%" : windowSize.width > 1024 ? 150 : 150,
      render: (text, record) => (
        <div className="submission-status-students">
          {record.students.map((student, index) => (
            <div key={index}>
              {windowSize.width > 1600
                ? student.name.length > 30
                  ? (student.name = student.name.substring(0, 30) + "...")
                  : student.name
                : windowSize.width > 1200
                ? student.name.length > 20
                  ? (student.name = student.name.substring(0, 20) + "...")
                  : student.name
                : windowSize.width > 1024
                ? student.name.length > 15
                  ? (student.name = student.name.substring(0, 15) + "...")
                  : student.name
                : student.name.length > 15
                ? (student.name = student.name.substring(0, 15) + "...")
                : student.name}
              {index !== record.students.length - 1 && record.students.length > 1 && (
                <Divider type="vertical" style={{ borderColor: "black" }} />
              )}
            </div>
          ))}
        </div>
      ),
      filters: [
        { text: "סטודנט יחיד", value: 1 },
        { text: "זוג סטודנטים", value: 2 },
      ],
      onFilter: (value, record) => record.students.length === value,
    },
  ];

  const filteredProjects = projects.filter((project) => {
    if (yearFilter === "all") return true;
    return project.year === yearFilter;
  });

  const dataSource = projects.map((project) => ({
    key: project._id,
    projectName: project.title,
    students: project.students.map((s) => s.student),
    projectYear: project.year,
  }));

  return (
    <div className="journal-status-container">
      <div className="upper-table-options">
        <Select value={yearFilter} placeholder="בחר שנה" onChange={setYearFilter} style={{ width: "200px" }}>
          <Select.Option value="all">כל השנים</Select.Option>
          {years.map((year) => (
            <Select.Option key={year} value={year}>
              {year}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        scroll={{ x: "max-content" }}
        sticky={{
          offsetHeader: -27,
          offsetScroll: -27,
          getContainer: () => window,
        }}
      />
    </div>
  );
};

export default JournalStatus;
