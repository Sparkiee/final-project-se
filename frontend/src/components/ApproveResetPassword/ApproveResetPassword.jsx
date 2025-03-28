import React, { useEffect, useState, useContext, useRef } from "react";
import "./ApproveResetPassword.scss";
import axios from "axios";
import { Table, message, Button, Tabs } from "antd";
import { getColumnSearchProps as getColumnSearchPropsUtil } from "../../utils/tableUtils";
import { NotificationsContext } from "../../utils/NotificationsContext";

const ApproveResetPassword = () => {
  const { fetchNotifications } = useContext(NotificationsContext);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchRequests();
    fetchNotifications();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/reset-password-requests`, {
        withCredentials: true,
      });
      const openRequests = response.data.filter((request) => request.resetPasswordRequest);
      const closedRequests = response.data.filter(
        (request) => request.resetPasswordRequestApprovedDate || request.resetPasswordRequestRejectionDate
      );
      setOpenRequests(openRequests);
      setClosedRequests(closedRequests);
      setLoading(false);
    } catch (error) {
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const approveRequest = async (id) => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/approve-reset-password/${id}`,
        {},
        {
          withCredentials: true,
        }
      );
      message.success("בקשה אושרה בהצלחה");
      fetchRequests();
      setLoading(false);
    } catch (error) {
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const rejectRequest = async (id) => {
    try {
      setLoading(true);
      await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/reject-reset-password/${id}`,
        {},
        {
          withCredentials: true,
        }
      );
      message.success("בקשה נדחתה בהצלחה");
      fetchRequests();
      setLoading(false);
    } catch (error) {
      console.error("Error occurred:", error);
      setLoading(false);
    }
  };

  const openColumns = [
    {
      title: "שם",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
    {
      title: "אימייל",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps("email"),
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
    {
      title: "תאריך בקשה",
      dataIndex: "resetPasswordRequestDate",
      key: "resetPasswordRequestDate",
      render: (text) => new Date(text).toLocaleString("he-IL"),
      sorter: (a, b) => new Date(a.resetPasswordRequestDate) - new Date(b.resetPasswordRequestDate),
      sortDirections: ["descend", "ascend"],
      defaultSortOrder: "ascend",
      width: 300,
    },
    {
      title: "פעולות",
      key: "actions",
      render: (text, record) => (
        <div className="approve-reset-password-actions">
          <Button color="cyan" variant="filled" onClick={() => approveRequest(record._id)}>
            אשר בקשה
          </Button>
          <Button color="danger" variant="filled" onClick={() => rejectRequest(record._id)}>
            דחה בקשה
          </Button>
        </div>
      ),
      width: 200,
    },
  ];

  const closedColumns = [
    {
      title: "שם",
      dataIndex: "name",
      key: "name",
      ...getColumnSearchProps("name"),
      sorter: (a, b) => a.name.localeCompare(b.name),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
    {
      title: "אימייל",
      dataIndex: "email",
      key: "email",
      ...getColumnSearchProps("email"),
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
    {
      title: "תאריך בקשה",
      dataIndex: "resetPasswordRequestDate",
      key: "resetPasswordRequestDate",
      render: (text) => new Date(text).toLocaleString("he-IL"),
      sorter: (a, b) => new Date(a.resetPasswordRequestDate) - new Date(b.resetPasswordRequestDate),
      sortDirections: ["descend", "ascend"],
      defaultSortOrder: "descend",
      width: 300,
    },
    {
      title: "תאריך אישור",
      dataIndex: "resetPasswordRequestApprovedDate",
      key: "resetPasswordRequestApprovedDate",
      render: (text) => (text ? new Date(text).toLocaleString("he-IL") : "לא אושר"),
      sorter: (a, b) => new Date(a.resetPasswordRequestApprovedDate) - new Date(b.resetPasswordRequestApprovedDate),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
    {
      title: "תאריך דחייה",
      dataIndex: "resetPasswordRequestRejectionDate",
      key: "resetPasswordRequestRejectionDate",
      render: (text) => (text ? new Date(text).toLocaleString("he-IL") : "אושר"),
      sorter: (a, b) => new Date(a.resetPasswordRequestRejectionDate) - new Date(b.resetPasswordRequestRejectionDate),
      sortDirections: ["descend", "ascend"],
      width: 300,
    },
  ];

  const items = [
    {
      key: "1",
      label: "בקשות פתוחות",
      children: (
        <Table
          columns={openColumns}
          dataSource={openRequests}
          rowKey="_id"
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
          dataSource={closedRequests}
          rowKey="_id"
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
    <div className="approve-reset-password">
      <Tabs defaultActiveKey="1" items={items} />
    </div>
  );
};

export default ApproveResetPassword;
