import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import {
  HomeOutlined,
  ProjectOutlined,
  FileSearchOutlined,
  ApartmentOutlined,
  LogoutOutlined,
  SettingOutlined,
  FundProjectionScreenOutlined,
  TeamOutlined,
  MessageOutlined
} from "@ant-design/icons";
import { Layout, Menu, theme, Avatar, Badge, Tooltip, Spin, Form, Input, Button, message } from "antd";
import { useNavigate, useLocation, Routes, Route, Navigate } from "react-router-dom";
import collegeLogo from "../../assets/CollegeLogo.png";
import HomePage from "../HomePage/HomePage";
import Templates from "../Templates/Templates";
import Projects from "../Projects/Projects";
import ProjectPage from "../ProjectPage/ProjectPage";
import CreateProject from "../CreateProject/CreateProject";
import ShowAllUsers from "../ShowAllUsers/ShowAllUsers";
import ManageProjects from "../ManageProjects/ManageProjects";
import CreateUser from "../CreateUser/CreateUser";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [privileges, setPrivileges] = useState({ isStudent: false, isAdvisor: false, isCoordinator: false });
  const [user, setUser] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();

  const getCurrentKeyFromPath = () => {
    const path = location.pathname.split("/").pop();
    return path === "dashboard" ? "home" : path;
  };

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/user/get-user", { withCredentials: true });
        setUser(response.data);
        localStorage.setItem("user", JSON.stringify(response.data));
        if (response.data.firstLogin) {
          // Redirect to password change if it's first login
          navigate("/dashboard/change-password", { replace: true });
        } else {
          const privResponse = await axios.get("http://localhost:5000/api/user/privileges", { withCredentials: true });
          setPrivileges(privResponse.data);
        }
      } catch (error) {
        console.error("Error occurred:", error);
        navigate("/login", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkUserStatus();
  }, [navigate]);

  const handleChangePassword = async (values) => {
    try {
      const response = await axios.put(
        "http://localhost:5000/api/user/change-password",
        { oldPassword: user.id, newPassword: values.password },
        { withCredentials: true }
      );
      message.success("הסיסמה שונתה בהצלחה");
      setUser({ ...user, firstLogin: false });
      navigate("/dashboard/home", { replace: true });
    } catch (error) {
      if (error.response.status === 400) {
        message.error("הסיסמה החדשה לא יכולה להיות זהה לסיסמה קודמת");
      } else {
        console.error("Error occurred:", error);
        message.error("שגיאה בעת שינוי הסיסמה");
      }
    }
  };

  const { Header, Content, Sider } = Layout;
  function getItem(label, key, icon, children) {
    return {
      key,
      icon,
      children,
      label
    };
  }

  const items = [
    getItem("בית", "home", <HomeOutlined />),
    privileges.isStudent && getItem("פרויקטים", "projects", <ProjectOutlined />),
    getItem("תבנית דוחות", "templates", <FileSearchOutlined />),
    privileges.isStudent &&
      getItem("הפרויקט שלי", "sub1", <ApartmentOutlined />, [
        getItem("דף הפרויקט", "project-page"),
        getItem("הצגת קבצים", "show-files"),
        getItem("הגשות", "submissions"),
        getItem("הערות מנחה", "advisor-comments"),
        getItem("הערות שופט", "judge-comments"),
        getItem("צפייה בציון", "grade")
      ]),

    (privileges.isAdvisor || privileges.isCoordinator) &&
      getItem("פרויקטים שלי", "sub2", <FundProjectionScreenOutlined />, [
        getItem("הזנת פרויקט", "create-project"),
        getItem("סטטוס פרויקטים", "projects-status"),
        getItem("סטטוס הגשות", "submissions-status")
      ]),
    privileges.isCoordinator && getItem("ניהול פרויקטים", "project-managment", <FundProjectionScreenOutlined />),
    privileges.isCoordinator &&
      getItem("ניהול משתמשים", "sub4", <TeamOutlined />, [
        getItem("יצירת משתמש חדש", "create-user"),
        getItem("עדכון הרשאות", "update-privileges"),
        getItem("הצגת משתמשים", "show-all-users")
      ]),
    privileges.isCoordinator && getItem("ניהול מערכת", "settings", <SettingOutlined />)
  ];

  const {
    token: { colorBgContainer, borderRadiusLG }
  } = theme.useToken();

  const handleLogout = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/user/logout", { withCredentials: true });
      console.log(response.data);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const handleMenuClick = ({ key }) => {
    if (user.firstLogin) {
      message.warning("נא לשנות סיסמה ראשונית לפני המשך שימוש במערכת");
      return;
    }
    navigate(`/dashboard/${key}`);
  };

  if (loading) {
    return <Spin size="large" className="dashboard-spin" />;
  }

  if (user.firstLogin) {
    return (
      <div className="change-first-password-container">
        <h2>שינוי סיסמה ראשונית</h2>
        <Form form={form} name="change-password" layout="vertical" size="large" onFinish={handleChangePassword}>
          <Form.Item
            label="סיסמה חדשה"
            name="password"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה להזין סיסמה חדשה"
              },
              {
                min: 8,
                message: "הסיסמה חייבת להכיל לפחות 8 תווים"
              },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: "הסיסמה חייבת להכיל אות גדולה, אות קטנה, מספר ותו מיוחד"
              }
            ]}>
            <Input.Password />
          </Form.Item>

          <Form.Item
            label="אימות סיסמה"
            name="confirmPassword"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לאמת את הסיסמה"
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("הסיסמאות אינן תואמות");
                }
              })
            ]}>
            <Input.Password style={{ textAlign: "right" }} />
          </Form.Item>

          <Form.Item style={{ marginBottom: "0", textAlign: "left" }}>
            <Button type="primary" htmlType="submit">
              שנה סיסמה
            </Button>
          </Form.Item>
        </Form>
      </div>
    );
  }

  return (
    <div>
      <Layout
        style={{
          minHeight: "100vh",
          maxHeight: "100vh"
        }}>
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          {!collapsed ? (
            <div className="user-welcome">
              <h3>ברוך הבא, {user.name}</h3>
            </div>
          ) : (
            <div className="placeholder" />
          )}
          <Menu
            selectedKeys={[getCurrentKeyFromPath()]}
            theme="dark"
            mode="inline"
            items={items}
            onClick={handleMenuClick}
          />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: 0,
              background: colorBgContainer
            }}
          />

          <div className="site-upper-header-right">
            <img
              src={collegeLogo}
              alt="collage logo"
              className="collage-logo"
              onClick={() => navigate("/dashboard/home")}
            />
            <h1>מערכת ניהול פרויקטים</h1>
          </div>
          <div className="site-upper-header-left">
            <Tooltip title="פרופיל">
              <Avatar className="avatar-icon" size="large" onClick={() => navigate(`/dashboard/profile/${user.id}`)}>
                {user.name && user.name[0]}
                {user.name && user.name.split(" ")[1] ? user.name.split(" ")[1][0] : ""}
              </Avatar>
            </Tooltip>
            <Badge count={100}>
              <Tooltip title="התראות">
                <MessageOutlined className="notification-icon" />
              </Tooltip>
            </Badge>
            <Tooltip title="התנתק">
              <LogoutOutlined className="logout-icon" onClick={handleLogout} />
            </Tooltip>
          </div>
          <Content
            style={{
              margin: "16px 16px 0 16px",
              overflowY: "auto",
              maxHeight: "92%"
            }}>
            <div
              style={{
                padding: 24,
                minHeight: "100%",
                background: colorBgContainer,
                borderRadius: borderRadiusLG
              }}>
              <Routes>
                <Route path="/" element={<Navigate to="home" replace />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/profile/:userId" element={<h1>Profile</h1>} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/create-project" element={<CreateProject />} />
                <Route path="/project/:projectID" element={<ProjectPage />} />
                <Route path="/show-all-users" element={<ShowAllUsers />} />
                <Route path="/projects-status" element={<ManageProjects />} />
                <Route path="/create-user" element={<CreateUser />} />
              </Routes>
            </div>
          </Content>
        </Layout>
      </Layout>

      {/* <Modal title="שינוי סיסמה" open={changePassword} closable={false} maskClosable={false} footer={null}>
        <p>עליך לשנות סיסמה ראשונית</p>
        <Form name="change-password" layout="vertical" size="large" onFinish={handleChangePassword}>
          <Form.Item
            label="סיסמה חדשה"
            name="password"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה להזין סיסמה חדשה",
              },
              {
                min: 8,
                message: "הסיסמה חייבת להכיל לפחות 8 תווים",
              },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: "הסיסמה חייבת להכיל אות גדולה, אות קטנה, מספר ותו מיוחד",
              },
            ]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="אימות סיסמה"
            name="confirmPassword"
            hasFeedback
            rules={[
              {
                required: true,
                message: "חובה לאמת את הסיסמה",
              },
              ({ getFieldValue }) => ({
                validator(rule, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject("הסיסמאות אינן תואמות");
                },
              }),
            ]}>
            <Input.Password style={{ textAlign: "right" }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: "0", textAlign: "left" }}>
            <Button type="primary" htmlType="submit">
              שנה סיסמה
            </Button>
          </Form.Item>
        </Form>
      </Modal> */}
    </div>
  );
};

export default Dashboard;
