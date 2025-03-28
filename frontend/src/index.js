import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { ConfigProvider } from "antd";
import { NotificationsProvider } from "./utils/NotificationsContext";
// import { SocketProvider } from "./utils/SocketContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <React.StrictMode>
        <ConfigProvider direction="rtl">
            <NotificationsProvider>
                {/* <SocketProvider> */}
                <App />
                {/* </SocketProvider> */}
            </NotificationsProvider>
        </ConfigProvider>
    </React.StrictMode>,
);
