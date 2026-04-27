import { io } from "socket.io-client";

var socket;

export const initializeConnection = (user) => {
  if (socket?.connected) return;

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const backendUrl = import.meta.env.VITE_API_URL || "http://localhost:5002";
  socket = io(backendUrl, {
    autoConnect: false,
  });
  socket.auth = { id: user._id, name: user.user_name };
  socket.connect();
};

export const sendMessage = (data) => {
  console.log({ data });
  socket.emit("send-message", data);
};

export const sendPrice = (data) => {
  console.log({ data });
  socket.emit("send-price", data);
};

export const sendMessageResponse = (callback) => {
  socket.on("send-message-response", (res) => {
    callback(res);
  });
};

export const disconnect = () => {
  socket?.disconnect();
};

export const getSocket = () => {
  return socket;
};
