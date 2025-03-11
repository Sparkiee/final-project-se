import React from "react";
import { Badge } from "antd";

const ChatPage = () => {
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

    const ChevronSVG = () => (
        <svg className="chevron" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 10L12.35 15.65a.5.5 0 01-.7 0L6 10" stroke="#0C0310" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    const selectChat = (chat) => {};

    return (
        <div className="chat-list">
            <div className="chat-header">
                <div className="right-side">
                    <MessageSVG />
                    <span>צ'אטים</span>
                    <div className="svg-msg-icon">
                        {/* {chats.some((c) => c.unreadTotal > 0) && (
                            <Badge
                                count={chats.reduce((total, c) => total + c.unreadTotal, 0)}
                                style={{ border: "none", boxShadow: "none" }}
                            />
                        )} */}
                        <Badge count={69} />
                    </div>
                </div>
                <div className="left-side">
                    <div className="new-message-chat" onClick={() => selectChat("new")}>
                        <WriteMessageSVG />
                    </div>
                    <div
                        className="open-close-chat"
                        onClick={() => {
                            // setChatListOpen(!chatListOpen);
                        }}>
                        <ChevronSVG />
                    </div>
                </div>
            </div>
            <>
                {/* <div className="filter-chat">
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
                                <div key={chat._id} className="chat-item" onClick={() => selectChat(chat)}>
                                    <div className="chat-header">
                                        <span className="chat-title">
                                            {chat.participants.length === 2
                                                ? chat.participants.filter((p) => p._id !== user._id)[0].name
                                                : chat.chatName
                                                ? chat.chatName
                                                : (() => {
                                                      let title = chat.participants.map((p) => p.name).join(", ");
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
                                                    chat.lastMessage?.seenBy?.length === chat.participants.length
                                                        ? "all"
                                                        : ""
                                                }`}>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960">
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
                                                    ? `${chat?.lastMessage?.message?.substring(0, 50)}...`
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
                </div> */}
            </>
        </div>
    );
};

export default ChatPage;
