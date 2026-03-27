const Chat = require("../Controller/chatController");
const Bargain = require("../Controller/bargainController");

exports.socketMiddleware = (socket, next) => {
  const { id, name } = socket.handshake.auth;
  if (!id && !name) {
    console.log("Id or name not provided");
    return next(new Error("invalid id or name"));
  }
  socket.id = id;
  socket.name = name;
  next();
};

exports.onConnect = (socket) => {
  console.log({ connected: socket.id });
  socket.emit("connected", "connected");

  socket.on("create-chat", async (data) => {
    const res = await Chat.createChat(data);
    console.log({res});
    if (res.status == 200 || res.status == 201)
      socket.to(data.dealer_id).emit("chat-created", res);
    return socket.emit("chat-created", res);

    socket.emit("chat-created", {
      status: res.statusCode,
      message: res.message,
    });
  });

  socket.on("send-message", async (data) => {
    const res = await Chat.sendMessage(data);
    console.log(socket.id == data.sender);
    console.log({ res });
    socket.emit("message-sent", res);
    socket.to(data.receiver).emit("receive-message", res);
  });

  socket.on("send-price", async (data) => {
    const res = await Bargain.sendBargain(data);
    socket.emit("price-sent", res);
    socket.to(data.receiver).emit("receive-price", res);
  });

  socket.on("price-reject", async (id) => {
    const res = await Bargain.rejectBargain(id);
    console.log({ price_reject: res });
    socket.emit("price-rejected", res);
    socket.to(res.bargain.sender.toString()).emit("price-reject", res);
  });

  socket.on("price-accept", async (id) => {
    const res = await Bargain.acceptBargain(id);
    console.log({ price_accept: res });
    socket.emit("price-accepted", res);
    socket.to(res.bargain.sender.toString()).emit("price-accept", res);
  });

  socket.on("unread-message", async (chatId) => {
    const res = await Chat.unreadMessage(chatId);

    console.log({ unread_socket: res });
  });

  socket.on("disconnect", () => {
    console.log({ disconnected: socket.id });
  });
};
