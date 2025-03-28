import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null); // Use state for the socket
    const [isConnected, setIsConnected] = useState(false);
    const [user, setUser] = useState(JSON.parse(sessionStorage.getItem("user")) || null);

    useEffect(() => {
        if (user) {
            socket?.emit("join", user._id);
        }
    }, [user, socket]);

    useEffect(() => {
        const socketInstance = io(process.env.REACT_APP_BACKEND_URL, {
            withCredentials: true,
            transports: ["websocket", "polling"],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
        });

        socketInstance.on("connect", () => {
            setIsConnected(true);
        });

        socketInstance.on("disconnect", () => {
            setIsConnected(false);
        });

        socketInstance.on("reconnect", () => {
            setIsConnected(true);
        });

        setSocket(socketInstance); // Set the socket instance to state

        return () => {
            if (socketInstance) {
                socketInstance.disconnect();
            }
        };
    }, []);

    return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
    return useContext(SocketContext);
};
