import React, { useState, useEffect } from "react";
import "./ShowAllUsers.scss";
import axios from "axios";
import { Space, Table, Tag, Spin, Avatar, Modal, Form, Input, Select, message, Tooltip, Switch } from "antd";
import { EditOutlined, UserDeleteOutlined, UserAddOutlined, DeleteOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const ShowAllUsers = () => {
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suspendedUsers, setSuspendedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserDetails, setEditUserDetails] = useState({});
  const navigate = useNavigate();
  const { Option } = Select;
  const [form] = Form.useForm();
  const [suspensionForm] = Form.useForm();
  const [componentDisabled, setComponentDisabled] = useState(true);
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const [suspensionDetails, setSuspensionDetails] = useState({});
  const [openSuspensionReason, setOpenSuspensionReason] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [ConfirmDelete, setConfirmDelete] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch all users
        const usersResponse = await axios.get("http://localhost:5000/api/user/all-users", { withCredentials: true });
        const userData = usersResponse.data;

        const suspendedUsersData = userData.filter((user) => user.suspended);
        const activeUsers = userData.filter((user) => !user.suspended);

        // Fetch all projects
        const projectsResponse = await axios.get("http://localhost:5000/api/project", { withCredentials: true });
        const projectsData = projectsResponse.data;

        // Create a map of student ID to project
        const studentProjectMap = new Map();
        projectsData.forEach((project) => {
          project.students.forEach((studentId) => {
            studentProjectMap.set(studentId.student, project);
          });
        });

        setProjects(projectsData);
        // Add project information to users
        const usersWithProjects = activeUsers.map((user) => ({
          ...user,
          projectInfo: studentProjectMap.get(user._id)
        }));

        setUsers(usersWithProjects);
        setSuspendedUsers(suspendedUsersData);
      } catch (error) {
        console.error("Error occurred:", error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (isEditing) {
      form.setFieldsValue(editUserDetails);
      setTouched({});
    }
  }, [editUserDetails]);

  const dataSource = users.map((user) => ({
    key: user._id,
    name: user.name,
    userId: user.id,
    registerDate: new Date(user.registerDate).toLocaleDateString("he-IL"),
    projectId: user.projectInfo?._id || null,
    projectTitle: user.projectInfo?.title || "לא נבחר פרויקט",
    email: user.email,
    isStudent: user.isStudent,
    isAdvisor: user.isAdvisor,
    isCoordinator: user.isCoordinator
  }));

  const columns = [
    {
      title: "שם",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a className="column-name" onClick={() => navigate(`/dashboard/profile/${record.userId}`)}>
          <Avatar size="medium">
            {text[0].toUpperCase()}
            {text.split(" ")[1] ? text.split(" ")[1][0].toUpperCase() : ""}
          </Avatar>
          {text}
        </a>
      ),
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
      defaultSortOrder: "ascend",
      sortDirections: ["descend", "ascend"],
      width: "20%"
    },
    {
      title: "ת.ז.",
      dataIndex: "userId",
      key: "userId",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.userId - b.userId,
      sortDirections: ["descend", "ascend"],
      width: "10%"
    },
    {
      title: "תאריך הרשמה",
      dataIndex: "registerDate",
      key: "registerDate",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => new Date(a.registerDate) - new Date(b.registerDate),
      sortDirections: ["descend", "ascend"],
      width: "10%"
    },
    {
      title: "פרויקט נבחר",
      dataIndex: "selectedProject",
      key: "selectedProject",
      render: (text, record) => {
        if (!record.projectId) {
          return "לא נבחר פרויקט";
        }
        return <a onClick={() => navigate(`/project/${record.projectId}`)}>{record.projectTitle}</a>;
      },
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.projectTitle.localeCompare(b.projectTitle),
      sortDirections: ["descend", "ascend"],
      filters: [
        { text: "נבחר פרויקט", value: "נבחר פרויקט" },
        { text: "לא נבחר פרויקט", value: "לא נבחר פרויקט" }
      ],
      onFilter: (value, record) => {
        if (value === "נבחר פרויקט") {
          return record.projectId !== null;
        }
        return record.projectId === null;
      }
    },
    {
      title: "תפקיד",
      key: "role",
      render: (_, record) => (
        <Space>
          {record.isStudent && <Tag color="blue">סטודנט</Tag>}
          {record.isAdvisor && <Tag color="green">מנחה</Tag>}
          {record.isCoordinator && <Tag color="purple">מנהל</Tag>}
        </Space>
      ),
      filters: [
        { text: "סטודנט", value: "סטודנט" },
        { text: "מנחה", value: "מנחה" },
        { text: "מנהל", value: "מנהל" }
      ],
      onFilter: (value, record) => {
        if (value === "סטודנט") {
          return record.isStudent;
        } else if (value === "מנחה") {
          return record.isAdvisor;
        } else if (value === "מנהל") {
          return record.isCoordinator;
        }
        return false;
      },
      width: "12%"
    },
    {
      title: "אימייל",
      dataIndex: "email",
      key: "email",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortDirections: ["descend", "ascend"],
      width: "15%"
    },
    {
      title: "פעולות",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <a
            onClick={() => {
              setIsEditing(true);
              setEditUserDetails({
                key: record.key,
                name: record.name,
                email: record.email,
                id: record.userId,
                isStudent: record.isStudent,
                isAdvisor: record.isAdvisor,
                isCoordinator: record.isCoordinator
              });
            }}>
            <Tooltip title="עריכה">
              <EditOutlined className="column-icons" />
            </Tooltip>
          </a>
          <a
            onClick={() => {
              setIsSuspending(true);
              setSuspensionDetails({
                key: record.key,
                name: record.name,
                id: record.userId
              });
            }}>
            <Tooltip title="להשעות משתמש">
              <UserDeleteOutlined className="column-icons" />
            </Tooltip>
          </a>
        </Space>
      ),
      width: "5%"
    }
  ];

  const handleEdit = async (userId) => {
    try {
      setSubmitting(true);

      const values = await form.validateFields();

      if (values.id.length !== 9) {
        throw new Error("תעודת זהות חייבת להכיל 9 ספרות");
      }

      const updatedUser = {
        name: values.name,
        email: values.email,
        id: values.id,
        isStudent: values.isStudent,
        isAdvisor: values.isAdvisor,
        isCoordinator: values.isCoordinator
      };

      try {
        const response = await axios.put(
          `http://localhost:5000/api/user/edit-user-coordinator/${userId}`,
          updatedUser,
          { withCredentials: true }
        );

        if (response.data) {
          const updatedUsers = users.map((user) => (user._id === userId ? { ...user, ...updatedUser } : user));

          setUsers(updatedUsers);
          setIsEditing(false);
          form.resetFields();
          setEditUserDetails({});
          setTouched({});
          message.success("פרטי המשתמש עודכנו בהצלחה");
        }
      } catch (error) {
        if (error.response?.status === 500) {
          const errorMessage = error.response?.data?.message || "שגיאה בעדכון פרטי המשתמש";
          if (errorMessage.includes("email")) {
            throw new Error("כתובת האימייל כבר קיימת במערכת");
          } else if (errorMessage.includes("id")) {
            throw new Error("תעודת זהות כבר קיימת במערכת");
          } else {
            throw new Error(errorMessage);
          }
        } else if (error.response?.status === 404) {
          throw new Error("משתמש לא נמצא");
        } else {
          throw new Error(error.response?.data?.message || "שגיאה בעדכון פרטי המשתמש");
        }
      }
    } catch (error) {
      message.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuspend = async () => {
    try {
      const values = await suspensionForm.validateFields();

      const response = await axios.put(
        `http://localhost:5000/api/user/suspend-user/${suspensionDetails.key}`,
        {
          reason: values.reason
        },
        { withCredentials: true }
      );

      if (response.status === 200) {
        const suspendedUser = users.find((user) => user._id === suspensionDetails.key);
        const updatedUsers = users.filter((user) => user._id !== suspensionDetails.key);

        const newSuspendedUser = {
          ...suspendedUser,
          suspendedReason: values.reason,
          suspendedAt: new Date()
        };

        setUsers(updatedUsers);
        setSuspendedUsers([...suspendedUsers, newSuspendedUser]);

        suspensionForm.resetFields();
        setIsSuspending(false);
        setSuspensionDetails({});

        message.success("המשתמש הושעה בהצלחה");
      }
    } catch (error) {
      if (error.response) {
        message.error(error.response.data || "שגיאה בהשעיית המשתמש");
      } else if (error.message) {
        message.error(error.message);
      } else {
        message.error("שגיאה בהשעיית המשתמש");
      }
    }
  };

  const suspendedColumns = [
    {
      title: "שם",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <a className="column-name" onClick={() => navigate(`/dashboard/profile/${record.userId}`)}>
          <Avatar size="medium">
            {text[0].toUpperCase()}
            {text.split(" ")[1] ? text.split(" ")[1][0].toUpperCase() : ""}
          </Avatar>
          {text}
        </a>
      ),
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.name.localeCompare(b.name),
      defaultSortOrder: "ascend",
      sortDirections: ["descend", "ascend"],
      width: "15%"
    },
    {
      title: "ת.ז.",
      dataIndex: "userId",
      key: "userId",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.userId - b.userId,
      sortDirections: ["descend", "ascend"],
      width: "8%"
    },
    {
      title: "תאריך הרשמה",
      dataIndex: "registerDate",
      key: "registerDate",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => new Date(a.registerDate) - new Date(b.registerDate),
      sortDirections: ["descend", "ascend"],
      width: "10%"
    },
    {
      title: "פרויקט נבחר",
      dataIndex: "selectedProject",
      key: "selectedProject",
      render: (text, record) => {
        if (!record.projectId) {
          return "לא נבחר פרויקט";
        }
        return <a onClick={() => navigate(`/dashboard/project/${record.projectId}`)}>{record.projectTitle}</a>;
      },
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.projectTitle.localeCompare(b.projectTitle),
      sortDirections: ["descend", "ascend"],
      filters: [
        { text: "נבחר פרויקט", value: "נבחר פרויקט" },
        { text: "לא נבחר פרויקט", value: "לא נבחר פרויקט" }
      ],
      onFilter: (value, record) => {
        if (value === "נבחר פרויקט") {
          return record.projectId !== null;
        }
        return record.projectId === null;
      },
      width: "20%"
    },
    {
      title: "תפקיד",
      key: "role",
      render: (_, record) => (
        <Space>
          {record.isStudent && <Tag color="blue">סטודנט</Tag>}
          {record.isAdvisor && <Tag color="green">מנחה</Tag>}
          {record.isCoordinator && <Tag color="purple">מנהל</Tag>}
        </Space>
      ),
      filters: [
        { text: "סטודנט", value: "סטודנט" },
        { text: "מנחה", value: "מנחה" },
        { text: "מנהל", value: "מנהל" }
      ],
      onFilter: (value, record) => {
        if (value === "סטודנט") {
          return record.isStudent;
        } else if (value === "מנחה") {
          return record.isAdvisor;
        } else if (value === "מנהל") {
          return record.isCoordinator;
        }
        return false;
      },
      width: "10%"
    },
    {
      title: "אימייל",
      dataIndex: "email",
      key: "email",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.email.localeCompare(b.email),
      sortDirections: ["descend", "ascend"],
      width: "10%"
    },
    {
      title: "סיבת השעיה",
      dataIndex: "suspensionReason",
      key: "suspensionReason",
      render: (text) => (
        <div>
          <Tooltip title={text}>
            <span
              className="suspension-reason"
              onClick={() => {
                setOpenSuspensionReason(true);
                setSuspensionReason(text);
              }}>
              {text.length > 25 ? `${text.slice(0, 25)}...` : text}
            </span>
          </Tooltip>
        </div>
      ),
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => a.suspensionReason.localeCompare(b.suspensionReason),
      sortDirections: ["descend", "ascend"],
      width: "15%"
    },
    {
      title: "תאריך השעיה",
      dataIndex: "suspensionDate",
      key: "suspensionDate",
      showSorterTooltip: {
        target: "full-header"
      },
      sorter: (a, b) => new Date(a.suspensionDate) - new Date(b.suspensionDate),
      sortDirections: ["descend", "ascend"],
      width: "10%"
    },
    {
      title: "פעולות",
      key: "action",
      render: (_, record) => (
        <Space size="middle">
          <a onClick={() => handleUnsuspend(record.key)}>
            <Tooltip title="ביטול השעיה">
              <UserAddOutlined className="column-icons" />
            </Tooltip>
          </a>
          <a
            onClick={() => {
              setConfirmDelete(true);
              setUserToDelete(record.key);
            }}>
            <Tooltip title="מחק מהמערכת">
              <DeleteOutlined className="column-icons" />
            </Tooltip>
          </a>
        </Space>
      ),
      width: "5%"
    }
  ];

  const suspendedDataSource = suspendedUsers.map((user) => ({
    key: user._id,
    name: user.name,
    userId: user.id,
    registerDate: new Date(user.registerDate).toLocaleDateString("he-IL"),
    projectId: user.projectInfo?._id || null,
    projectTitle: user.projectInfo?.title || "לא נבחר פרויקט",
    email: user.email,
    isStudent: user.isStudent,
    isAdvisor: user.isAdvisor,
    isCoordinator: user.isCoordinator,
    suspensionReason: user.suspendedReason,
    suspensionDate: new Date(user.suspendedAt).toLocaleDateString("he-IL")
  }));

  const handleUnsuspend = async (userId) => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/user/unsuspend-user/${userId}`,
        {},
        { withCredentials: true }
      );
      if (response.status === 200) {
        const unsuspendedUser = suspendedUsers.find((user) => user._id === userId);
        const { suspendedReason, suspendedAt, suspended, ...activeUser } = unsuspendedUser;

        setUsers([...users, activeUser]);
        setSuspendedUsers(suspendedUsers.filter((user) => user._id !== userId));
        message.success("השעיה בוטלה בהצלחה");
      }
    } catch (error) {
      let errorMessage = "שגיאה בביטול השעיה";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
    }
  };

  const handleDelete = (userId) => {
    try {
      axios.delete(`http://localhost:5000/api/user/delete-suspended-user/${userId}`, { withCredentials: true });
      setConfirmDelete(false);
      setSuspendedUsers(suspendedUsers.filter((user) => user._id !== userId));
      message.success("המשתמש נמחק בהצלחה");
    } catch (error) {
      let errorMessage = "שגיאה במחיקת המשתמש";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      message.error(errorMessage);
    }
  };

  const handleFieldChange = (changedFields) => {
    if (submitting) return; // Don't track changes during submission

    const touchedFields = { ...touched };
    changedFields.forEach((field) => {
      const fieldName = Array.isArray(field.name) ? field.name[0] : field.name;
      if (field.touched) {
        touchedFields[fieldName] = true;
      }
    });
    setTouched(touchedFields);
  };

  const handleCancel = () => {
    setIsEditing(false);
    form.resetFields();
    setEditUserDetails({});
    setTouched({});
  };

  const handleCancelSuspend = () => {
    setIsSuspending(false);
    suspensionForm.resetFields();
    setSuspensionDetails({});
  };

  return (
    <div>
      <div className="active-users">
        <h2>משתמשים רשומים</h2>
        {loading && <Spin />}
        <Table columns={columns} dataSource={dataSource} style={{ minHeight: "770px" }} />
      </div>
      <div className="deleted-users">
        <h2>משתמשים מושעים</h2>
        {loading && <Spin />}
        <Table columns={suspendedColumns} dataSource={suspendedDataSource} />
      </div>
      <Modal
        title={`עריכת משתמש: ${editUserDetails.name}`}
        open={isEditing}
        onOk={() => handleEdit(editUserDetails.key)}
        onCancel={() => handleCancel()}
        okText="שמור שינויים"
        cancelText="בטל"
        width={400}>
        <div className="edit-switch">
          <Switch onChange={() => setComponentDisabled((prev) => !prev)} style={{ margin: "10px 0" }} />
          <p>עריכת פרטים אישיים</p>
        </div>
        <Form form={form} layout="vertical" initialValues={editUserDetails} onFieldsChange={handleFieldChange}>
          <Form.Item
            label="שם"
            name="name"
            hasFeedback={!submitting && touched.name}
            rules={[
              { required: true, message: "חובה להזין שם" },
              { min: 2, message: "שם חייב להכיל לפחות 2 תווים" }
            ]}>
            <Input disabled={componentDisabled} />
          </Form.Item>
          <Form.Item
            label="אימייל"
            name="email"
            hasFeedback={!submitting && touched.email}
            rules={[
              { required: true, message: "חובה להזין אימייל" },
              { type: "email", message: "אנא הכנס כתובת אימייל תקינה" }
            ]}>
            <Input disabled={componentDisabled} />
          </Form.Item>
          <Form.Item
            label="תעודת זהות"
            name="id"
            hasFeedback={!submitting && touched.id}
            rules={[
              { required: true, message: "חובה להזין תעודת זהות" },
              { pattern: /^\d{9}$/, message: "תעודת זהות חייבת להכיל 9 ספרות" }
            ]}>
            <Input disabled={componentDisabled} />
          </Form.Item>
          <Form.Item label="סטודנט" name="isStudent" hasFeedback={!submitting && touched.isStudent}>
            <Select>
              <Option value={true}>כן</Option>
              <Option value={false}>לא</Option>
            </Select>
          </Form.Item>
          <Form.Item label="מנחה" name="isAdvisor" hasFeedback={!submitting && touched.isAdvisor}>
            <Select>
              <Option value={true}>כן</Option>
              <Option value={false}>לא</Option>
            </Select>
          </Form.Item>
          <Form.Item label="מנהל" name="isCoordinator" hasFeedback={!submitting && touched.isCoordinator}>
            <Select>
              <Option value={true}>כן</Option>
              <Option value={false}>לא</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={<h2 className="suspend-title">השעית משתמש: {suspensionDetails.name}</h2>}
        open={isSuspending}
        onOk={() => handleSuspend()}
        onCancel={() => handleCancelSuspend()}
        okText="השעה"
        okButtonProps={{ danger: true }}
        cancelText="בטל"
        width={700}>
        <Form form={suspensionForm} layout="vertical" name="suspention_form">
          <Form.Item label="סיבת השעיה" name="reason" rules={[{ required: true, message: "חובה להזין סיבת השעיה" }]}>
            <Input.TextArea rows={6} placeholder="נא לפרט את סיבת ההשעיה..." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="סיבת השעיה"
        open={openSuspensionReason}
        onCancel={() => setOpenSuspensionReason(false)}
        okButtonProps={{ style: { display: "none" } }}
        cancelText="סגור">
        <p>{suspensionReason}</p>
      </Modal>

      <Modal
        title="מחיקת משתמש"
        open={ConfirmDelete}
        onOk={() => handleDelete(userToDelete)}
        onCancel={() => setConfirmDelete(false)}
        okText="מחק משתמש"
        okButtonProps={{ danger: true }}
        cancelText="בטל">
        <p>האם אתה בטוח שברצונך למחוק את המשתמש?</p>
      </Modal>
    </div>
  );
};

export default ShowAllUsers;
