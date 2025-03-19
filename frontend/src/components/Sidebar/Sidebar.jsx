import React, { useEffect, useState, useRef } from "react";
import "./Sidebar.scss";
import axios from "axios";
import { Badge } from "antd";
import {
    HomeOutlined,
    ProjectOutlined,
    FileSearchOutlined,
    ApartmentOutlined,
    FundProjectionScreenOutlined,
    TeamOutlined,
    SettingOutlined,
    InfoCircleOutlined,
    BarChartOutlined,
    MessageOutlined,
    CloseOutlined,
    LogoutOutlined,
    DeleteOutlined,
    SearchOutlined,
    WechatWorkOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";
import { handleMouseDown } from "../../utils/mouseDown";
import Chat from "../Chat/Chat";
import { useSocket } from "../../utils/SocketContext";

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const sidebarRef = useRef(null);
    const [user, setUser] = useState({});
    const [chats, setChats] = useState([]);
    const [chatListOpen, setChatListOpen] = useState(false);
    const [selectedChats, setSelectedChats] = useState([]);
    const [chatFilter, setChatFilter] = useState("");
    const { socket } = useSocket();
    const [openSubmenus, setOpenSubmenus] = useState({
        myProject: false,
        myProjects: false,
        manageUsers: false,
        manageProjects: false,
        zoomMeetings: false,
        manageSubmissions: false,
    });
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const [isSidebarVisible, setIsSidebarVisible] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarVisible(!isSidebarVisible);
    };

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        };

        const handleClickOutside = (event) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
                setIsSidebarVisible(false);
            }
        };

        window.addEventListener("resize", handleResize);
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            window.removeEventListener("resize", handleResize);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const selectChat = (chat) => {
        setSelectedChats((prev) => {
            // Prevent duplicates
            if (prev.some((c) => c._id?.toString() === chat._id?.toString())) {
                return prev;
            }

            // Ensure "new" is unique
            if (chat === "new" && prev.includes("new")) {
                return prev;
            }

            // Maintain max length of 2
            if (prev.length < 2) {
                return [...prev, chat];
            } else {
                return [...prev.slice(1), chat]; // Remove the oldest
            }
        });
    };

    const loadUser = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/user/get-user`, {
                withCredentials: true,
            });
            setUser(response.data);
            localStorage.setItem("user", JSON.stringify(response.data));
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        if (!socket) return;
        socket.on("connect", () => {
            if (chats?.length) {
                socket.emit(
                    "join_chats",
                    chats.map((chat) => chat._id),
                );
            }
        });

        socket.on("reconnect", () => {
            console.log("Reconnected! Rejoining chats...");
            if (chats?.length) {
                socket.emit(
                    "join_chats",
                    chats.map((chat) => chat._id),
                );
            }
        });

        socket.on("receive_chat", (newChat, newMessage) => {
            setChats((prev) => {
                const updatedChats = prev.map((chat) => {
                    if (chat._id === newChat._id && chat.lastMessage !== newChat.lastMessage) {
                        if (newMessage.sender._id !== user._id) {
                            chat.unreadTotal++;
                        }
                        return {
                            ...chat,
                            lastMessage: newMessage,
                        };
                    }
                    return chat;
                });
                return updatedChats;
            });
        });

        socket.on("receive_new_chat", (chat) => {
            setChats((prev) => {
                const newChats = [chat, ...prev];
                return newChats;
            });
            selectChat(chat);
            socket.emit("join_chats", [chat._id.toString()]);
        });

        return () => {
            socket.off("connect");
            socket.off("reconnect");
            socket.off("receive_chat");
        };
    }, [socket, chats, user]);

    const fetchChats = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/chat/`, {
                withCredentials: true,
            });
            setChats(response.data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
            // returning for socket purposes
            // return response.data;

            if (socket && response.data.length) {
                socket.emit(
                    "join_chats",
                    response.data.map((chat) => chat._id),
                );
            }
        } catch (error) {
            console.error("Error occurred:", error);
        }
    };

    const handleCreateChat = async (chatID) => {
        setSelectedChats((prev) => {
            return prev.filter((chat) => chat !== "new");
        });

        try {
            const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/chat/${chatID}`, {
                withCredentials: true,
            });
            setChats((prev) => {
                const newChats = [response.data, ...prev];
                return newChats;
            });
            selectChat(response.data);
            socket.emit("join_chats", [chatID]);
        } catch (error) {
            console.error("Error occurred:", error);
        }
    };

    const ChevronSVG = () => (
        <svg className="chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10" stroke="#0C0310" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const MessageSVG = () => (
        <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24" fill="#FFF">
            <path d="M240-400h320v-80H240v80Zm0-120h480v-80H240v80Zm0-120h480v-80H240v80ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z" />
        </svg>
    );

    const WriteMessageSVG = () => (
        <svg
            className="chat-new-message"
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#FFFFFF">
            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z" />
        </svg>
    );
  const JournalSVG = () => (
    <svg
      viewBox="0 0 16 16"
      fill="#e4dede"
      className="special-sidebar-icon"
      style={{ height: `${windowSize.width > 626 ? "16px" : "14px"}` }}>
      <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
      <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
      <g id="SVGRepo_iconCarrier">
        <path
          fillRule="evenodd"
          d="M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0z"></path>
        <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"></path>
        <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"></path>
      </g>
    </svg>
  );

    const JudgeSVG = () => (
        <svg className="special-sidebar-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    d="M20.01 19.26C19.82 19.26 19.63 19.19 19.48 19.04L14.53 14.09C14.24 13.8 14.24 13.32 14.53 13.03C14.82 12.74 15.3 12.74 15.59 13.03L20.54 17.98C20.83 18.27 20.83 18.75 20.54 19.04C20.39 19.19 20.2 19.26 20.01 19.26Z"
                    fill="#e4dede"></path>
                <path
                    d="M10.1099 18.43C9.37995 18.43 8.67995 18.14 8.16995 17.62L3.92994 13.38C2.85994 12.31 2.85994 10.56 3.92994 9.49003L10.9999 2.42005C12.0699 1.35005 13.8199 1.35005 14.8899 2.42005L19.13 6.66004C19.65 7.18004 19.94 7.87005 19.94 8.60005C19.94 9.33005 19.65 10.03 19.13 10.54L12.0599 17.61C11.5399 18.15 10.8499 18.43 10.1099 18.43ZM12.94 3.12004C12.62 3.12004 12.2999 3.24003 12.0599 3.49003L4.98995 10.56C4.49995 11.05 4.49995 11.84 4.98995 12.33L9.22994 16.57C9.69994 17.04 10.5199 17.04 10.9999 16.57L18.07 9.50004C18.31 9.26004 18.44 8.95004 18.44 8.62004C18.44 8.29004 18.31 7.97003 18.07 7.74003L13.83 3.50004C13.58 3.24004 13.26 3.12004 12.94 3.12004Z"
                    fill="#e4dede"></path>
                <path
                    d="M8 21.75H2C1.59 21.75 1.25 21.41 1.25 21C1.25 20.59 1.59 20.25 2 20.25H8C8.41 20.25 8.75 20.59 8.75 21C8.75 21.41 8.41 21.75 8 21.75Z"
                    fill="#e4dede"></path>
                <path
                    d="M13.63 15.74C13.44 15.74 13.25 15.67 13.1 15.52L6.03 8.44998C5.74 8.15998 5.74 7.67999 6.03 7.38999C6.32 7.09999 6.8 7.09999 7.09 7.38999L14.16 14.46C14.45 14.75 14.45 15.23 14.16 15.52C14.02 15.67 13.82 15.74 13.63 15.74Z"
                    fill="#e4dede"></path>
            </g>
        </svg>
    );

    const JournalSVG = () => (
        <svg viewBox="0 0 16 16" fill="#e4dede" className="special-sidebar-icon" style={{ height: "16px" }}>
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    fillRule="evenodd"
                    d="M10.854 6.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 8.793l2.646-2.647a.5.5 0 0 1 .708 0z"></path>
                <path d="M3 0h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2v-1h1v1a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v1H1V2a2 2 0 0 1 2-2z"></path>
                <path d="M1 5v-.5a.5.5 0 0 1 1 0V5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0V8h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1zm0 3v-.5a.5.5 0 0 1 1 0v.5h.5a.5.5 0 0 1 0 1h-2a.5.5 0 0 1 0-1H1z"></path>
            </g>
        </svg>
    );

    const ZoomMeetingSVG = () => (
        <svg
            className="special-sidebar-icon zoom-icon"
            viewBox="0 0 192 192"
            xmlns="http://www.w3.org/2000/svg"
            fill="none">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path
                    stroke="#e4dede"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="11.997"
                    d="M16.869 60.973v53.832c.048 12.173 10.87 21.965 24.072 21.925h85.406c2.42 0 4.385-1.797 4.385-3.978V78.92c-.064-12.164-10.887-21.965-24.073-21.917H21.237c-2.412 0-4.368 1.79-4.368 3.97zm119.294 21.006 35.27-23.666c3.06-2.332 5.432-1.749 5.432 2.468v72.171c0 4.8-2.9 4.217-5.432 2.468l-35.27-23.618V81.98z"></path>
            </g>
        </svg>
    );

    const CreateProjectSVG = () => (
        <svg
            className="special-sidebar-icon"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="#e4dede"
            style={{ height: "17px" }}>
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <rect x="0" fill="none" width="24" height="24"></rect>
                <g>
                    <path d="M21 14v5c0 1.105-.895 2-2 2H5c-1.105 0-2-.895-2-2V5c0-1.105.895-2 2-2h5v2H5v14h14v-5h2z"></path>
                    <path d="M21 7h-4V3h-2v4h-4v2h4v4h2V9h4"></path>
                </g>
            </g>
        </svg>
    );

    const SubmissionsSVG = () => (
        <svg
            className="special-sidebar-icon submission-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path d="M7.5 15.5V11.7586H9V14H17V11.7586H18.5V15.5H7.5Z" fill="#e4dede"></path>
                <path
                    d="M10.9904 10.1133L12.25 8.85369L12.25 12L13.75 12L13.75 8.85369L15.0096 10.1133L16.0702 9.05261L13 5.98237L9.92976 9.05261L10.9904 10.1133Z"
                    fill="#e4dede"></path>
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5 3H21V19H5V3ZM6.5 4.5H19.5V17.5H6.5V4.5Z"
                    fill="#e4dede"></path>
                <path d="M2 6V22H18V20.5H3.5V6H2Z" fill="#e4dede"></path>
            </g>
        </svg>
    );

    const HamburgerSVG = () => (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path d="M20 7L4 7" stroke="#001529" strokeWidth="1.5" strokeLinecap="round"></path>
                <path d="M20 12L4 12" stroke="#001529" strokeWidth="1.5" strokeLinecap="round"></path>
                <path d="M20 17L4 17" stroke="#001529" strokeWidth="1.5" strokeLinecap="round"></path>
            </g>
        </svg>
    );

    useEffect(() => {
        fetchChats();
        loadUser();
    }, []);

    const toggleSubmenu = (submenu) => {
        setOpenSubmenus((prev) => {
            const newSubmenus = Object.keys(prev).reduce((acc, key) => {
                acc[key] = key === submenu ? !prev[key] : false;
                return acc;
            }, {});
            return newSubmenus;
        });
    };

    const isActive = (path) => {
        if (typeof path === "string") {
            return location.pathname === path;
        }
        return path.some((p) => location.pathname === p);
    };

    const handleNavigate = (path) => {
        navigate(path);
        setIsSidebarVisible(false);
    };

    const handleLogout = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/logout`, null, {
                withCredentials: true,
            });
            if (socket && socket.connected) socket.disconnect();
            navigate("/login", { replace: true });
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
        } catch (error) {
            console.error("Error occurred:", error);
        }
    };

    return (
        <>
            {!isSidebarVisible && windowSize.width <= 1024 && (
                <button className="hamburger-button" onClick={toggleSidebar}>
                    {!isSidebarVisible && <HamburgerSVG />}
                </button>
            )}
            <div ref={sidebarRef} className={`sidebar-container ${isSidebarVisible ? "open" : ""}`}>
                {isSidebarVisible && (
                    <button className="close-button" onClick={toggleSidebar}>
                        {isSidebarVisible && <CloseOutlined />}
                    </button>
                )}
                <div className="sidebar-actions">
                    <div className="sidebar-greeting">
                        <h3>שלום, {user.name}</h3>
                    </div>
                    <ul>
                        <li>
                            <div
                                className={`sidebar-option ${isActive("/home") ? "active" : ""}`}
                                onClick={() => handleNavigate("/home")}
                                onMouseDown={(e) => handleMouseDown(e, "/home")}>
                                <HomeOutlined />
                                <span>בית</span>
                            </div>
                        </li>
                        {(user.isStudent || user.isAdvisor || user.isCoordinator) && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/announcements") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/announcements")}
                                    onMouseDown={(e) => handleMouseDown(e, "/announcements")}>
                                    <MessageOutlined />
                                    <span>הודעות</span>
                                </div>
                            </li>
                        )}
                        {windowSize.width <= 768 && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/chat") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/chat")}
                                    onMouseDown={(e) => handleMouseDown(e, "/chat")}>
                                    <WechatWorkOutlined />
                                    <span>צ׳אטים</span>
                                    {chats.some((c) => c.unreadTotal > 0) && (
                                        <Badge
                                            count={chats.reduce((total, c) => total + c.unreadTotal, 0)}
                                            style={{ border: "none", boxShadow: "none" }}
                                        />
                                    )}
                                </div>
                            </li>
                        )}

                        {user.isStudent && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/journal") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/journal")}
                                    onMouseDown={(e) => handleMouseDown(e, "/journal")}>
                                    <JournalSVG />
                                    <span>יומן עבודה</span>
                                </div>
                            </li>
                        )}
                        {user.isStudent && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/projects") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/projects")}
                                    onMouseDown={(e) => handleMouseDown(e, "/projects")}>
                                    <ProjectOutlined />
                                    <span>פרויקטים</span>
                                </div>
                            </li>
                        )}
                        <li>
                            <div
                                className={`sidebar-option ${isActive("/templates") ? "active" : ""}`}
                                onClick={() => handleNavigate("/templates")}
                                onMouseDown={(e) => handleMouseDown(e, "/templates")}>
                                <FileSearchOutlined />
                                <span> תבנית דוחות</span>
                            </div>
                        </li>
                        {user.isCoordinator && !user.isAdvisor && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/create-project") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/create-project")}
                                    onMouseDown={(e) => handleMouseDown(e, "/create-project")}>
                                    <ApartmentOutlined />
                                    יצירת פרויקט חדש
                                </div>
                            </li>
                        )}
                        {user.isStudent && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/my-submissions") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/my-submissions")}
                                    onMouseDown={(e) => handleMouseDown(e, "/my-submissions")}>
                                    <ApartmentOutlined />
                                    הגשות
                                </div>
                            </li>
                        )}
                        {user.isStudent && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/suggest-project") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/suggest-project")}
                                    onMouseDown={(e) => handleMouseDown(e, "/suggest-project")}>
                                    <CreateProjectSVG />
                                    <span>הצעת פרויקט</span>
                                </div>
                            </li>
                        )}
                        {user.isAdvisor && (
                            <li className={`${openSubmenus.myProjects ? "open" : "closed"}`}>
                                <div
                                    className="sidebar-option"
                                    onClick={() => toggleSubmenu("myProjects")}
                                    onMouseDown={(e) => handleMouseDown(e, "/create-project")}>
                                    <FundProjectionScreenOutlined />
                                    <span>פרויקטים שלי</span>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10"
                                            stroke="#0C0310"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div className={`sidebar-drop-menu ${openSubmenus.myProjects ? "open" : "closed"}`}>
                                    <ul>
                                        <li
                                            className={`${isActive("/create-project") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/create-project")}
                                            onMouseDown={(e) => handleMouseDown(e, "/create-project")}>
                                            הזנת פרויקט
                                        </li>
                                        <li
                                            className={`${isActive("/list-projects") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/list-projects")}
                                            onMouseDown={(e) => handleMouseDown(e, "/list-projects")}>
                                            סטטוס פרויקטים
                                        </li>
                                        <li
                                            className={`${isActive("/journal-status") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/journal-status")}
                                            onMouseDown={(e) => handleMouseDown(e, "/journal-status")}>
                                            מעקב עבודה
                                        </li>
                                        <li
                                            className={`${isActive("/submission-status") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/submission-status")}
                                            onMouseDown={(e) => handleMouseDown(e, "/submission-status")}>
                                            סטטוס הגשות
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        )}

                        {user.isCoordinator && (
                            <li className={`sidebar-drop-menu ${openSubmenus.manageProjects ? "open" : "closed"}`}>
                                <div
                                    className="sidebar-option"
                                    onClick={() => toggleSubmenu("manageProjects")}
                                    onMouseDown={(e) => handleMouseDown(e, "/overview-projects")}>
                                    <BarChartOutlined />
                                    <span>ניהול פרויקטים</span>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10"
                                            stroke="#0C0310"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div className={`sidebar-drop-menu ${openSubmenus.manageProjects ? "open" : "closed"}`}>
                                    <ul>
                                        <li
                                            className={`${isActive("/overview-projects") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/overview-projects")}
                                            onMouseDown={(e) => handleMouseDown(e, "/overview-projects")}>
                                            הצגת פרויקטים
                                        </li>
                                        <li
                                            className={`${isActive("/groups") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/groups")}
                                            onMouseDown={(e) => handleMouseDown(e, "/groups")}>
                                            קבוצות
                                        </li>
                                        <li
                                            className={`${isActive("/approve-projects") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/approve-projects")}
                                            onMouseDown={(e) => handleMouseDown(e, "/approve-projects")}>
                                            אישור פרויקטים
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        )}
                        {user.isCoordinator && (
                            <li className={`sidebar-drop-menu ${openSubmenus.manageSubmissions ? "open" : "closed"}`}>
                                <div
                                    className="sidebar-option"
                                    onClick={() => toggleSubmenu("manageSubmissions")}
                                    onMouseDown={(e) => handleMouseDown(e, "/submissions")}>
                                    <SubmissionsSVG />
                                    <span>ניהול הגשות</span>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10"
                                            stroke="#0C0310"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div
                                    className={`sidebar-drop-menu ${
                                        openSubmenus.manageSubmissions ? "open" : "closed"
                                    }`}>
                                    <ul>
                                        <li
                                            className={`${isActive("/submissions") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/submissions")}
                                            onMouseDown={(e) => handleMouseDown(e, "/submissions")}>
                                            ניהול הגשות
                                        </li>
                                        <li
                                            className={`${isActive("/grade-distribution") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/grade-distribution")}
                                            onMouseDown={(e) => handleMouseDown(e, "/grade-distribution")}>
                                            התפלגויות ציונים
                                        </li>
                                        <li
                                            className={`${isActive("/approve-extra-file") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/approve-extra-file")}
                                            onMouseDown={(e) => handleMouseDown(e, "/approve-extra-file")}>
                                            אישור הגשה נוספת
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        )}
                        {user.isCoordinator && (
                            <li className={`${openSubmenus.manageUsers ? "open" : "closed"}`}>
                                <div
                                    className="sidebar-option"
                                    onClick={() => toggleSubmenu("manageUsers")}
                                    onMouseDown={(e) => handleMouseDown(e, "/create-user")}>
                                    <TeamOutlined />
                                    <span>ניהול משתמשים</span>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10"
                                            stroke="#0C0310"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div className={`sidebar-drop-menu`}>
                                    <ul>
                                        <li
                                            className={`${isActive("/create-user") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/create-user")}
                                            onMouseDown={(e) => handleMouseDown(e, "/create-user")}>
                                            יצירת משתמשים
                                        </li>
                                        <li
                                            className={`${isActive("/display-users") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/display-users")}
                                            onMouseDown={(e) => handleMouseDown(e, "/display-users")}>
                                            הצגת משתמשים
                                        </li>
                                        <li
                                            className={`${isActive("/create-users-file") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/create-users-file")}
                                            onMouseDown={(e) => handleMouseDown(e, "/create-users-file")}>
                                            יצירת קובץ רישום
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        )}
                        {(user.isCoordinator || user.isAdvisor) && (
                            <li className={`${openSubmenus.zoomMeetings ? "open" : "closed"}`}>
                                <div
                                    className="sidebar-option"
                                    onClick={() => toggleSubmenu("zoomMeetings")}
                                    onMouseDown={(e) => handleMouseDown(e, "/zoom-scheduler")}>
                                    <ZoomMeetingSVG />
                                    <span>ניהול פגישות</span>
                                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10"
                                            stroke="#0C0310"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </div>
                                <div className={`sidebar-drop-menu`}>
                                    <ul>
                                        <li
                                            className={`${isActive("/zoom-scheduler") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/zoom-scheduler")}
                                            onMouseDown={(e) => handleMouseDown(e, "/zoom-scheduler")}>
                                            קביעת פגישה חדשה
                                        </li>
                                        <li
                                            className={`${isActive("/list-zoom-meetings") ? "active" : ""}`}
                                            onClick={() => handleNavigate("/list-zoom-meetings")}
                                            onMouseDown={(e) => handleMouseDown(e, "/list-zoom-meetings")}>
                                            רשימת פגישות
                                        </li>
                                    </ul>
                                </div>
                            </li>
                        )}
                        {!user.isAdvisor && !user.isCoordinator && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/list-zoom-meetings") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/list-zoom-meetings")}
                                    onMouseDown={(e) => handleMouseDown(e, "/list-zoom-meetings")}>
                                    <ZoomMeetingSVG />
                                    <span>רשימת פגישות</span>
                                </div>
                            </li>
                        )}
                        {user.isJudge && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/check-submissions") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/check-submissions")}
                                    onMouseDown={(e) => handleMouseDown(e, "/check-submissions")}>
                                    <JudgeSVG />
                                    <span>בדיקת הגשות</span>
                                </div>
                            </li>
                        )}
                        <li>
                            <div
                                className={`sidebar-option ${isActive("/more-information") ? "active" : ""}`}
                                onClick={() => handleNavigate("/more-information")}
                                onMouseDown={(e) => handleMouseDown(e, "/more-information")}>
                                <InfoCircleOutlined />
                                <span>מידע לסטודנט</span>
                            </div>
                        </li>
                        {user.isCoordinator && (
                            <li>
                                <div
                                    className={`sidebar-option ${isActive("/system") ? "active" : ""}`}
                                    onClick={() => handleNavigate("/system")}
                                    onMouseDown={(e) => handleMouseDown(e, "/system")}>
                                    <SettingOutlined />
                                    <span>ניהול מערכת</span>
                                </div>
                            </li>
                        )}
                        {windowSize.width <= 768 && (
                            <li>
                                <div className="sidebar-option" onClick={handleLogout}>
                                    <LogoutOutlined className="logout-icon" />
                                    <span>התנתקות</span>
                                </div>
                            </li>
                        )}
                        {/* {user.isCoordinator && (
              <li>
                <div
                  className={`sidebar-option ${
                    isActive("/delete-all") ? "active" : ""
                  }`}
                  onClick={() => handleNavigate("/delete-all")}
                  onMouseDown={(e) => handleMouseDown(e, "/delete-all")}
                >
                  <DeleteOutlined />
                  <span>מחיקת מערכת</span>
                </div>
              </li>
            )} */}
                    </ul>
                </div>
            </div>

            {windowSize.width > 768 && (
                <div className="chat-list-container">
                    <div className={`chat-list ${chatListOpen ? "open" : ""}`}>
                        <div className="header">
                            <div className="right-side">
                                <MessageSVG />
                                <span>צ'אטים</span>
                                <div className="svg-msg-icon">
                                    {chats.some((c) => c.unreadTotal > 0) && (
                                        <Badge
                                            count={chats.reduce((total, c) => total + c.unreadTotal, 0)}
                                            style={{ border: "none", boxShadow: "none" }}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="left-side">
                                <div className="new-message-chat" onClick={() => selectChat("new")}>
                                    <WriteMessageSVG />
                                </div>
                                <div
                                    className="open-close-chat"
                                    onClick={() => {
                                        setChatListOpen(!chatListOpen);
                                    }}>
                                    <ChevronSVG />
                                </div>
                            </div>
                        </div>
                        {chatListOpen && (
                            <>
                                <div className="filter-chat">
                                    <div className="search-wrapper">
                                        <SearchOutlined />
                                        <input
                                            type="text"
                                            placeholder="חפש שיחות..."
                                            onChange={(e) => {
                                                setChatFilter(e.target.value.toLowerCase());
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="chat-list-items">
                                    {chats.length === 0 && <p>אין שיחות זמינות</p>}
                                    {chats
                                        .filter((chat) => {
                                            const title =
                                                chat.participants.length === 2
                                                    ? chat.participants.filter((p) => p._id !== user._id)[0].name
                                                    : chat.chatName
                                                    ? chat.chatName
                                                    : chat.participants.map((p) => p.name).join(", ");

                                            return title.toLowerCase().includes(chatFilter);
                                        })
                                        .map((chat) => {
                                            return (
                                                <div
                                                    key={chat._id}
                                                    className="chat-item"
                                                    onClick={() => selectChat(chat)}>
                                                    <div className="chat-header">
                                                        <span className="chat-title">
                                                            {chat.participants.length === 2
                                                                ? chat.participants.filter((p) => p._id !== user._id)[0]
                                                                      .name
                                                                : chat.chatName
                                                                ? chat.chatName
                                                                : (() => {
                                                                      let title = chat.participants
                                                                          .map((p) => p.name)
                                                                          .join(", ");
                                                                      if (title.length > 40)
                                                                          title = title.substring(0, 40).concat("...");
                                                                      return title;
                                                                  })()}
                                                        </span>
                                                    </div>
                                                    <div className="message-description">
                                                        <div className="last-message">
                                                            <div
                                                                className={`seen ${
                                                                    chat.lastMessage?.seenBy?.length ===
                                                                    chat.participants.length
                                                                        ? "all"
                                                                        : ""
                                                                }`}>
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    viewBox="0 0 960 960">
                                                                    <g transform="translate(0, 960)">
                                                                        <path
                                                                            d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z"
                                                                            fill="#666"
                                                                        />
                                                                    </g>
                                                                </svg>
                                                            </div>
                                                            <span className="last-message-content">
                                                                {chat?.lastMessage?.sender?.name}:{" "}
                                                                {chat?.lastMessage?.message?.length > 10
                                                                    ? `${chat?.lastMessage?.message?.substring(
                                                                          0,
                                                                          50,
                                                                      )}...`
                                                                    : chat?.lastMessage?.message}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {chat.unreadTotal > 0 && (
                                                        <div className="unread-total">
                                                            <Badge count={chat?.unreadTotal} color="#1daa61" />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                </div>
                            </>
                        )}
                    </div>
                    {selectedChats.map((chat) => {
                        return (
                            <Chat
                                key={chat._id || "new"}
                                chatID={chat}
                                onClose={() => {
                                    setSelectedChats((prev) => prev.filter((c) => c._id !== chat._id));
                                }}
                                onWatch={() => {
                                    setChats((prevChats) => {
                                        const updatedChats = prevChats.map((c) => {
                                            if (c._id.toString() === chat._id.toString()) {
                                                c.unreadTotal = c.unreadTotal ? c.unreadTotal - 1 : 0;
                                            }
                                            return c;
                                        });
                                        return updatedChats;
                                    });
                                }}
                                onCreateChat={handleCreateChat}
                            />
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default Sidebar;
