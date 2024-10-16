import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Dashboard.css";
import {
  DesktopOutlined,
  FileOutlined,
  PieChartOutlined,
  UserOutlined,
  HomeOutlined,
  ProjectOutlined,
  FileSearchOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined,
  SelectOutlined,
  UnorderedListOutlined,
  LoginOutlined,
  SettingOutlined,
  FundProjectionScreenOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Layout, Menu, theme } from "antd";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();
  const [privileges, setPrivileges] = useState({ isStudent: false, isAdvisor: false, isCoordinator: false });
  const [currentKey, setCurrentKey] = useState("2");

  useEffect(() => {
    // Fetch data from the API
    const fetchPrivileges = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/user/privileges", { withCredentials: true });
        setPrivileges(response.data);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    };
    fetchPrivileges();
  }, []);

  const { Header, Content, Sider } = Layout;
  function getItem(label, key, icon, children) {
    return {
      key,
      icon,
      children,
      label,
    };
  }

  const items = [
    getItem("פרופיל", "1", <UserOutlined />),
    getItem("בית", "2", <HomeOutlined />),
    privileges.isStudent && getItem("פרוייקטים", "3", <ProjectOutlined />),
    privileges.isStudent && getItem("תבנית דוחות", "3", <FileSearchOutlined />),
    privileges.isStudent &&
      getItem("הפרוייקט שלי", "sub1", <ApartmentOutlined />, [
        getItem("דף הפרוייקט", "4"),
        getItem("הצגת קבצים", "5"),
        getItem("הגשות", "6"),
        getItem("הערות מנחה", "7"),
        getItem("הערות שופט", "8"),
        getItem("צפייה בציון", "9"),
      ]),
    privileges.isStudent && getItem("הגשות", "10", <FileOutlined />),
    privileges.isAdvisor &&
      getItem("פרוייקטים שלי", "sub2", <FundProjectionScreenOutlined />, [
        getItem("הזנת פרוייקט", "11"),
        getItem("סטטוס פרוייקטים", "12"),
        getItem("סטטוס הגשות", "13"),
      ]),
    privileges.isCoordinator &&
      getItem("ניהול פרוייקטים", "sub3", <FundProjectionScreenOutlined />, [
        getItem("הזנת פרוייקט", "14"),
        getItem("הצגת פרוייקטים", "15"),
      ]),
    privileges.isCoordinator &&
      getItem("ניהול משתמשים", "sub4", <TeamOutlined />, [
        getItem("הזנת סטודנטים", "16"),
        getItem("הזנת משתמש צוות", "17"),
        getItem("עדכון הרשאות", "18"),
        getItem("הצגת משתמשים", "19"),
      ]),
    privileges.isCoordinator && getItem("ניהול מערכת", "20", <SettingOutlined />),
  ];

  const [collapsed, setCollapsed] = useState(false);

  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const handleLogOut = async () => {
    try {
      await axios.post("http://localhost:5000/api/user/logout", { withCredentials: true });
      navigate("/login");
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  const handleMenuClick = ({ key }) => {
    setCurrentKey(key);
  };

  return (
    <div>
      <Layout
        style={{
          minHeight: "100vh",
          maxHeight: "100vh",
        }}>
        <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
          <Menu selectedKeys={[currentKey]} theme="dark" mode="inline" items={items} onClick={handleMenuClick} />
        </Sider>
        <Layout>
          <Header
            style={{
              padding: 0,
              background: colorBgContainer,
            }}
          />
          <div className="site-upper-header">
            <h1>מערכת ניהול פרוייקטים</h1>
          </div>
          <LoginOutlined className="logout-icon" onClick={handleLogOut} />
          <Content
            style={{
              margin: "16px 16px 0 16px",
            }}>
            <div
              style={{
                padding: 24,
                minHeight: 360,
                background: colorBgContainer,
                borderRadius: borderRadiusLG,
              }}>
              <p>Current Menu Key: {currentKey}</p>
            </div>
          </Content>
        </Layout>
      </Layout>
    </div>
  );
};

export default Dashboard;
