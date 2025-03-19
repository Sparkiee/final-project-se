import React, { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ProfilePage.scss";
import axios from "axios";
import { Avatar, Modal, message, Button, Form, Input, Alert } from "antd";
import { MailOutlined, IdcardOutlined, UserOutlined } from "@ant-design/icons";
import { fetchUserProjectStatistics, renderUserProjectStatisticsChart } from "../../utils/basicStatistics";
import { NotificationsContext } from "../../utils/NotificationsContext";
import WrongPath from "../WrongPath/WrongPath";

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { fetchNotifications } = useContext(NotificationsContext);
  const [currentUser, setCurrentUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const [user, setUser] = useState(null);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [editDetailsForm] = Form.useForm();
  const [changePasswordForm] = Form.useForm();
  const statisticsChartRef = useRef(null);
  const statisticsChartInstance = useRef(null);
  const [error, setError] = useState(false);
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

  const InterestsSVG = () => (
    <svg className="profile-svg" fill="#000000" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <path d="M951.467 648.533s-4.267-4.267 0 0C947.2 558.933 793.6 486.4 571.734 473.6c-12.8 0-21.333 8.533-21.333 21.333s8.533 21.333 21.333 21.333c17.067 0 38.4 4.267 55.467 4.267 179.2 21.333 273.067 81.067 273.067 128 0 64-162.133 132.267-396.8 132.267-204.8 0-354.133-55.467-388.267-110.933 0-4.267-4.267-4.267-4.267-8.533V640c0-4.267 0-8.533 4.267-12.8 0 0 0-4.267 4.267-4.267 4.267-4.267 4.267-8.533 8.533-12.8-4.267 4.267 0 0 0-4.267 4.267 0 4.267-4.267 8.533-4.267 8.533-4.267 12.8-8.533 21.333-17.067 55.467-34.133 157.867-59.733 285.867-68.267 12.8 0 21.333-12.8 21.333-21.333 0-12.8-12.8-21.333-21.333-21.333-21.333 0-42.667 4.267-64 4.267h-4.267c-179.2 21.333-298.667 81.067-307.2 157.867V793.6C68.267 908.8 294.4 972.8 512 972.8c213.333 0 439.467-59.733 443.733-174.933V648.534zM507.733 934.4c-234.667 0-401.067-72.533-401.067-136.533v-72.533c76.8 64 243.2 98.133 401.067 98.133S832 789.334 908.8 725.334v72.533c0 64-166.4 136.533-401.067 136.533z"></path>
        <path d="M396.8 418.133h76.8c4.267 0 8.533 0 12.8-4.267v226.133c0 12.8 8.533 21.333 21.333 21.333s21.333-8.533 21.333-21.333V418.132h85.333c149.333 0 268.8-119.467 268.8-268.8 0-72.533-59.733-128-128-128-110.933 0-204.8 68.267-247.467 162.133C465.065 85.332 371.199 21.332 260.265 21.332c-72.533 0-128 59.733-128 128-4.267 149.333 115.2 268.8 264.533 268.8zm132.267-128C529.067 166.4 631.467 64 755.2 64c46.933 0 85.333 38.4 85.333 85.333 0 123.733-102.4 226.133-226.133 226.133h-76.8c-4.267 0-8.533-4.267-8.533-8.533v-76.8zM260.267 64C384 64 486.4 166.4 486.4 290.133v76.8c0 4.267-4.267 8.533-8.533 8.533H396.8c-123.733 0-226.133-98.133-226.133-226.133 0-46.933 38.4-85.333 89.6-85.333z"></path>
      </g>
    </svg>
  );

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/get-user-info/${userId}`, {
          withCredentials: true,
        });
        setUser(response.data);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        setError(true);
      }
    };

    const renderStatisticsChart = async () => {
      if ((currentUser.isCoordinator || currentUser._id === userId) && statisticsChartRef.current) {
        const statistics = await fetchUserProjectStatistics(userId);
        if (statistics) {
          if (statisticsChartInstance.current) {
            statisticsChartInstance.current.destroy();
          }
          statisticsChartInstance.current = renderUserProjectStatisticsChart(statisticsChartRef.current, statistics);
        }
      }
    };

    fetchUser();
    renderStatisticsChart();
    fetchNotifications();

    return () => {
      if (statisticsChartInstance.current) {
        statisticsChartInstance.current.destroy();
      }
    };
  }, [currentUser, userId]);

  const handleEditDetails = async (values) => {
    try {
      await axios.put(`${process.env.REACT_APP_BACKEND_URL}/api/user/user-edit-profile/${userId}`, values, {
        withCredentials: true,
      });
      message.success("הפרטים עודכנו בהצלחה");
      setIsEditing(false);
      setUser({ ...user, ...values });
    } catch (error) {
      console.error("Failed to update details:", error);
      message.error("עדכון הפרטים נכשל");
    }
  };

  const handleChangePassword = async () => {
    try {
      await axios.put(
        `${process.env.REACT_APP_BACKEND_URL}/api/user/change-password`,
        { oldPassword: changePasswordForm.getFieldValue("currentPassword"), newPassword },
        { withCredentials: true }
      );
      message.success("הסיסמה שונתה בהצלחה");
      setIsChangePasswordModalOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      changePasswordForm.resetFields();
    } catch (error) {
      if (error.response.status === 401) {
        message.error("סיסמה נוכחית שגויה");
      } else if (error.response.status === 400) {
        message.error("הסיסמה החדשה צריכה להיות שונה מהסיסמה הנוכחית");
      } else {
        console.error("Failed to change password:", error);
        message.error("שינוי הסיסמה נכשל");
      }
    }
  };

  const handleEmailClick = () => {
    navigator.clipboard
      .writeText(user?.email)
      .then(() => {
        message.success("האימייל הועתק");
      })
      .catch(() => {
        message.error("העתקת האימייל נכשלה");
      });
  };

  if (error) {
    return <WrongPath />;
  }

  return (
    <div className="profile-page">
      <div className="profile-page-header">
        <Avatar size={240}>
          <span className="avatar-text">
            {user?.name && user.name[0]}
            {user?.name && user.name.split(" ")[1] ? user.name.split(" ")[1][0] : ""}
          </span>
        </Avatar>
        <div className="profile-page-header-info">
          <h1>{user?.name}</h1>
          <h3 onClick={handleEmailClick} className="copy-email">
            <MailOutlined /> {user?.email}
          </h3>
          {(currentUser.isCoordinator || currentUser._id === user?._id) && (
            <div className="private-info">
              {((currentUser.isCoordinator && (user?.isAdvisor || user?.isJudge || user?.isCoordinator)) ||
                (currentUser._id === user?._id && currentUser.isAdvisor)) && (
                <h3>
                  <InterestsSVG /> תחומי עניין: {user?.interests || "לא צוין"}
                </h3>
              )}
              <h3>
                <IdcardOutlined /> {user?.id}
              </h3>
              <div className="user-type">
                <h3>
                  <UserOutlined />
                  סוג משתמש:
                </h3>
                <div className="user-type-labels">
                  {user?.isCoordinator ? <Alert message="מנהל" type="success" /> : ""}
                  {user?.isAdvisor ? <Alert message="מנחה" type="info" /> : ""}
                  {user?.isJudge ? <Alert message="שופט" type="error" /> : ""}
                  {user?.isStudent ? <Alert message="סטודנט" type="warning" /> : ""}
                </div>
              </div>
            </div>
          )}
        </div>
        {currentUser._id === user?._id && (
          <div className="profile-page-header-buttons">
            <Button
              type="primary"
              onClick={() => {
                setIsEditing(true);
              }}>
              ערוך פרטים
            </Button>
            <Button
              type="primary"
              onClick={() => {
                setIsChangePasswordModalOpen(true);
              }}>
              שנה סיסמה
            </Button>
          </div>
        )}
        <div className="basic-statistics">
          {(currentUser.isCoordinator || currentUser._id === userId) && windowSize.width > 517 && (
            <canvas ref={statisticsChartRef} />
          )}
        </div>
      </div>

      <Modal
        title="עריכת פרטים"
        open={isEditing}
        onCancel={() => setIsEditing(false)}
        onOk={() => {
          editDetailsForm
            .validateFields()
            .then(handleEditDetails)
            .catch((info) => {});
        }}
        okText="שמור"
        cancelText="בטל">
        <Form form={editDetailsForm} layout="vertical" initialValues={user}>
          <Form.Item name="name" label="שם" hasFeedback rules={[{ required: true, message: "שדה חובה" }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="אימייל"
            hasFeedback
            rules={[
              { required: true, message: "שדה חובה" },
              { type: "email", message: "אימייל לא תקין" },
            ]}>
            <Input type="email" placeholder="הכנס אימייל" />
          </Form.Item>
          <Form.Item name="interests" label="תחומי עניין" hasFeedback rules={[{ required: true, message: "שדה חובה" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="שינוי סיסמה"
        open={isChangePasswordModalOpen}
        onCancel={() => setIsChangePasswordModalOpen(false)}
        onOk={handleChangePassword}
        okText="שנה סיסמה"
        cancelText="בטל">
        <Form form={changePasswordForm} layout="vertical">
          <Form.Item
            name="currentPassword"
            label="סיסמה נוכחית"
            hasFeedback
            rules={[{ required: true, message: "חובה להזין סיסמה נוכחית" }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="סיסמה חדשה"
            hasFeedback
            rules={[
              { required: true, message: "חובה להזין סיסמה חדשה" },
              { min: 8, message: "הסיסמה חייבת להכיל לפחות 8 תווים" },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: "הסיסמה חייבת להכיל אות גדולה, אות קטנה, מספר ותו מיוחד",
              },
            ]}>
            <Input.Password value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="אימות סיסמה"
            dependencies={["newPassword"]}
            hasFeedback
            rules={[
              { required: true, message: "חובה לאמת את הסיסמה" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("הסיסמאות אינן תואמות"));
                },
              }),
            ]}>
            <Input.Password value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
