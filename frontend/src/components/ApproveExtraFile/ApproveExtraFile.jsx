import React, { useEffect, useState, useContext, useRef } from "react";
import "./ApproveExtraFile.scss";
import axios from "axios";
import { Table, Tooltip, message, Button, Tabs, Select } from "antd";
import { getColumnSearchProps as getColumnSearchPropsUtil } from "../../utils/tableUtils";
import { NotificationsContext } from "../../utils/NotificationsContext";
import { toJewishDate, formatJewishDateInHebrew } from "jewish-date";

const ApproveExtraFile = () => {
  const { fetchNotifications } = useContext(NotificationsContext);
  const [loading, setLoading] = useState(false);
  const [yearFilter, setYearFilter] = useState("all");
  const [years, setYears] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);
  const [closedRequests, setClosedRequests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchedColumn, setSearchedColumn] = useState("");
  const searchInput = useRef(null);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    fetchYears();
    fetchRequests();
    fetchNotifications();
  }, []);

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

  const getColumnSearchProps = (dataIndex) =>
    getColumnSearchPropsUtil(dataIndex, searchInput, handleSearch, handleReset, searchText);

  const handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters) => {
    clearFilters();
    setSearchText("");
  };

  const fetchYears = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/project/years`, {
        withCredentials: true,
      });
      const sortedYears = response.data.sort((a, b) => b.localeCompare(a));
      setYears(sortedYears);

      const currentHebrewYear = formatJewishDateInHebrew(toJewishDate(new Date())).split(" ").pop().replace(/^ה/, "");
      const currentHebrewYearIndex = sortedYears.indexOf(currentHebrewYear);
      setYearFilter(currentHebrewYearIndex !== -1 ? sortedYears[currentHebrewYearIndex] : sortedYears[0]);
      setLoading(false);
    } catch (error) {
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/get-extra-upload-submissions`,
        {
          withCredentials: true,
        }
      );
      const openRequests = response.data.filter((request) => !request.gotExtraUpload);
      const closedRequests = response.data.filter((request) => request.gotExtraUpload);
      setOpenRequests(openRequests);
      setClosedRequests(closedRequests);
      setLoading(false);
    } catch (error) {
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const handleApproveExtraUpload = async (id) => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/accept-extra-upload/${id}`,
        {},
        { withCredentials: true }
      );
      message.success("הבקשה אושרה בהצלחה");
      fetchRequests();
      fetchNotifications();
      setLoading(false);
    } catch (error) {
      message.error("אירעה שגיאה בעת אישור הבקשה");
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const handleDenyExtraUpload = async (id) => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/submission/deny-extra-upload/${id}`,
        {},
        { withCredentials: true }
      );
      message.success("הבקשה נדחתה בהצלחה");
      fetchRequests();
      fetchNotifications();
      setLoading(false);
    } catch (error) {
      message.error("אירעה שגיאה בעת דחיית הבקשה");
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const filteredOpenRequests = openRequests.filter((request) => {
    if (yearFilter === "all") return true;
    return request.projectYear === yearFilter;
  });

  const filteredClosedRequests = closedRequests.filter((request) => {
    if (yearFilter === "all") return true;
    return request.projectYear === yearFilter;
  });

  const openColumns = [
    {
      title: "פרויקט",
      dataIndex: "projectName",
      key: "projectName",
      fixed: windowSize.width > 1024 ? "left" : false,
      ...getColumnSearchProps("projectName"),
      render: (projectName) =>
        projectName.length > 60 ? <Tooltip title={projectName}>{projectName.slice(0, 60)}...</Tooltip> : projectName,
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
      sortDirections: ["descend", "ascend"],
      width: 400,
    },
    {
      title: "הגשה",
      dataIndex: "submissionName",
      key: "submissionName",
      ...getColumnSearchProps("submissionName"),
      sorter: (a, b) => a.submissionName.localeCompare(b.submissionName),
      sortDirections: ["descend", "ascend"],
      width: 200,
    },
    {
      title: "מנחה",
      dataIndex: "advisors",
      key: "advisors",
      render: (advisors) => (advisors ? advisors.map((advisor) => advisor.name).join(", ") : ""),
      width: 200,
    },
    {
      title: "סטודנטים",
      dataIndex: "students",
      key: "students",
      render: (students) => (students ? students.map((student) => student.name).join(", ") : ""),
      width: 300,
    },
    {
      title: "תאריך בקשה",
      dataIndex: "requestExtraUploadDate",
      key: "requestExtraUploadDate",
      render: (date, record) => (
        <span>
          {date ? new Date(date).toLocaleString("he-IL") : "לא נמסר"}
          {record.secondRequest && <mark>בקשה חוזרת</mark>}
        </span>
      ),
      sorter: (a, b) => new Date(a.requestExtraUploadDate) - new Date(b.requestExtraUploadDate),
      sortDirections: ["descend", "ascend"],
      defaultSortOrder: "ascend",
      width: 300,
    },
    {
      title: "פעולות",
      key: "actions",
      render: (text, record) => (
        <div className="approve-extra-file-actions">
          <Button color="cyan" variant="filled" onClick={() => handleApproveExtraUpload(record.key)}>
            אשר בקשה
          </Button>
          <Button color="danger" variant="filled" onClick={() => handleDenyExtraUpload(record.key)}>
            דחה בקשה
          </Button>
        </div>
      ),
      width: 200,
    },
  ];

  const closedColumns = [
    {
      title: "פרויקט",
      dataIndex: "projectName",
      key: "projectName",
      ...getColumnSearchProps("projectName"),
      render: (projectName) =>
        projectName.length > 60 ? <Tooltip title={projectName}>{projectName.slice(0, 60)}...</Tooltip> : projectName,
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
      sortDirections: ["descend", "ascend"],
      width: 400,
    },
    {
      title: "הגשה",
      dataIndex: "submissionName",
      key: "submissionName",
      ...getColumnSearchProps("submissionName"),
      sorter: (a, b) => a.submissionName.localeCompare(b.submissionName),
      sortDirections: ["descend", "ascend"],
      width: 200,
    },
    {
      title: "מנחה",
      dataIndex: "advisors",
      key: "advisors",
      render: (advisors) => (advisors ? advisors.map((advisor) => advisor.name).join(", ") : ""),
      width: 200,
    },
    {
      title: "סטודנטים",
      dataIndex: "students",
      key: "students",
      render: (students) => (students ? students.map((student) => student.name).join(", ") : ""),
      width: 300,
    },
    {
      title: "תאריך בקשה",
      dataIndex: "requestExtraUploadDate",
      key: "requestExtraUploadDate",
      render: (date, record) => (
        <span>
          {date ? new Date(date).toLocaleString("he-IL") : "לא נמסר"}
          {record.secondRequest && <mark>בקשה חוזרת</mark>}
        </span>
      ),
      sorter: (a, b) => new Date(a.requestExtraUploadDate) - new Date(b.requestExtraUploadDate),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
    {
      title: "תאריך אישור",
      dataIndex: "gotExtraUploadDate",
      key: "gotExtraUploadDate",
      render: (date) => (date ? new Date(date).toLocaleString("he-IL") : "לא נמסר"),
      sorter: (a, b) => new Date(a.gotExtraUploadDate) - new Date(b.gotExtraUploadDate),
      sortDirections: ["descend", "ascend"],
      defaultSortOrder: "descend",
      width: 200,
    },
  ];

  const items = [
    {
      key: "1",
      label: "בקשות פתוחות",
      children: (
        <Table
          columns={openColumns}
          dataSource={filteredOpenRequests}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          scroll={{ x: "max-content" }}
        />
      ),
    },
    {
      key: "2",
      label: "בקשות סגורות",
      children: (
        <Table
          columns={closedColumns}
          dataSource={filteredClosedRequests}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          scroll={{ x: "max-content" }}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="approve-extra-file-filters">
        <Select value={yearFilter} onChange={setYearFilter} style={{ width: "200px" }}>
          <Select.Option value="all">כל השנים</Select.Option>
          {years.map((year) => (
            <Select.Option key={year} value={year}>
              {year}
            </Select.Option>
          ))}
        </Select>
      </div>
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default ApproveExtraFile;
