import React, { useContext, useState, useEffect } from "react";
import "./HeaderMenu.scss";
import axios from "axios";
import projectManagementLogo from "../../assets/project-management-logo.png";
import { useNavigate } from "react-router-dom";
import { Tooltip, Avatar, Badge, Popover, Divider } from "antd";
import { LogoutOutlined, BellOutlined, CloseOutlined } from "@ant-design/icons";
import { handleMouseDown } from "../../utils/mouseDown";
import { useSocket } from "../../utils/SocketContext";
import { NotificationsContext } from "../../utils/NotificationsContext";

const HeaderMenu = () => {
  const navigate = useNavigate();
  const { newNotifications, unreadCount, markNotificationAsRead, markAllNotificationsAsRead } =
    useContext(NotificationsContext);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : {};
  });
  const [open, setOpen] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const { socket, isConnected } = useSocket();

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

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      navigate(notification.link);
      markNotificationAsRead(notification._id);
      hide();
    }
  };

  const handleNotificationClose = (e, notificationId) => {
    e.stopPropagation();
    markNotificationAsRead(notificationId);
  };

  const handleNotificationClear = () => {
    markAllNotificationsAsRead();
    hide();
  };

  const hide = () => {
    setOpen(false);
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
  };

  const formatDate = (dateString) => {
    const options = {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    };
    return new Date(dateString).toLocaleString("he-IL", options);
  };

  const content = (
    <div className="headermenu-popover-content">
      {newNotifications.length > 0 ? (
        newNotifications.slice(0, 5).map((notification, index) => (
          <div className="notification-list" key={index}>
            <CloseOutlined
              className="notification-close"
              onClick={(e) => handleNotificationClose(e, notification._id)}
            />
            {notification.link ? (
              <div className="notification-with-link">
                <a onClick={() => handleNotificationClick(notification)}>
                  {notification.message.length > 40
                    ? `${notification.message.substring(0, 45)}...`
                    : notification.message}
                </a>
              </div>
            ) : (
              <p className="notification-no-link">
                {notification.message.length > 40
                  ? `${notification.message.substring(0, 45)}...`
                  : notification.message}
              </p>
            )}
            <p className="notification-date">{formatDate(notification.createdAt)}</p>
            <Divider />
          </div>
        ))
      ) : (
        <p>אין התראות חדשות</p>
      )}
      <Divider className="last-divider" />
      <div className="notification-footer">
        <a
          onClick={() => {
            navigate("/notifications");
            hide();
          }}>
          כל ההתראות
        </a>
      </div>
    </div>
  );

  const handleLogout = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/logout`, null, {
        withCredentials: true,
      });
      if (socket && socket.connected) {
        socket.disconnect();
      }
      navigate("/login", { replace: true });
      localStorage.removeItem("user");
      sessionStorage.removeItem("user");
    } catch (error) {
      console.error("Error occurred:", error);
    }
  };

  return (
    <div className="header-container">
      <div className="site-upper-header-logo">
        <img
          src={projectManagementLogo}
          alt="project management logo"
          className="collage-logo"
          onClick={() => navigate("/home")}
          onMouseDown={(e) => handleMouseDown(e, "/home")}
        />
        <h3 onClick={() => navigate("/home")} onMouseDown={(e) => handleMouseDown(e, "/home")}>
          מערכת לניהול פרויקטים
        </h3>
      </div>
      <div className="site-upper-header-left">
        <Popover
          content={content}
          title={
            <div className="notification-header-menu">
              <p>התראות אחרונות</p>
              <a onClick={() => markAllNotificationsAsRead()}>נקה הכל</a>
            </div>
          }
          trigger="click"
          open={open}
          onOpenChange={handleOpenChange}>
          <Badge
            count={unreadCount}
            style={{ transform: unreadCount > 9 ? "translate(60%, -50%)" : "translate(100%, -50%)" }}>
            <Tooltip title="התראות" placement="right">
              <BellOutlined className="notification-icon" />
            </Tooltip>
          </Badge>
        </Popover>
        {/* <Badge count={50} style={{ transform: "translate(60%, -50%)" }}>
          <Tooltip title="הודעות מערכת">
            <MessageOutlined className="notification-icon" />
          </Tooltip>
        </Badge> */}
        <Tooltip title="פרופיל">
          <Avatar
            className="avatar-icon"
            size="large"
            onClick={() => navigate(`/profile/${user._id}`)}
            onMouseDown={(e) => handleMouseDown(e, `/profile/${user._id}`)}>
            {user.name && user.name[0]}
            {user.name && user.name.split(" ")[1] ? user.name.split(" ")[1][0] : ""}
          </Avatar>
        </Tooltip>
        {windowSize.width > 768 && (
          <Tooltip title="התנתק">
            <LogoutOutlined className="logout-icon" onClick={handleLogout} />
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export default HeaderMenu;
