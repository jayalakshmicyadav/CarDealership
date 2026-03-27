const Buyer = require("../Models/buyerSchema");
const Dealer = require("../Models/dealerSchema");
const Chat = require("../Models/chatSchema");
const Message = require("../Models/messageSchema");
const ErrorHandler = require("../Utils/ErrorHandler");

exports.createChat = async (data) => {
  try {
    const { buyer_id, dealer_id, car_id, chat_name_buyer, chat_name_dealer } =
      data;

    if (
      !buyer_id ||
      !dealer_id ||
      !chat_name_buyer ||
      !chat_name_dealer ||
      !car_id
    ) {
      console.log("here");
      return new ErrorHandler("All required fields were not provided!", 500);
    }

    const existingChat = await Chat.findOne({
      $and: [{ buyer_id }, { dealer_id }, { car_id }],
    }).populate({
      path: "car_id",
      select: "image.main.url", // Select only the image.main.url property
    });

    if (!existingChat) {
      const newChat = await Chat.create({
        buyer_id,
        dealer_id,
        car_id,
        chat_name_buyer,
        chat_name_dealer,
        last_message: null,
      });

      await newChat.populate({
        path: "car_id",
        select: "image.main.url", // Select only the image.main.url property
      });

      await Dealer.findByIdAndUpdate(dealer_id, {
        $push: { chat: newChat._id },
      });
      await Buyer.findByIdAndUpdate(buyer_id, { $push: { chat: newChat._id } });

      return {
        status: 200,
        message: "New Chat created!",
        chat: newChat,
      };
    }

    return { status: 201, message: "Chat Already exists", chat: existingChat };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

exports.sendMessage = async (data) => {
  try {
    const { chat_id, car_id, message, sender, receiver } = data;

    if (!chat_id || !message || !car_id || !sender || !receiver) {
      console.log("here");
      return new ErrorHandler("All required fields were not provided!", 500);
    }

    const existingChat = await Chat.findById(chat_id);

    if (!existingChat) {
      return new ErrorHandler("Chat does not exists", 500);
    }

    const newMessage = await Message.create({
      sender,
      receiver,
      car_id,
      message,
      chat_id: existingChat._id,
    });

    existingChat.last_message = newMessage.message;
    existingChat.messages.push(newMessage._id);
    existingChat.unread = true;
    await existingChat.save();

    return {
      status: 200,
      message: newMessage,
    };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

exports.unreadMessage = async (chat_id) => {
  try {
    if (!chat_id) return new ErrorHandler("Chat id is required!", 500);

    const chat = await Chat.findById(chat_id);

    if (!chat) return new ErrorHandler("Chat does not exists", 500);

    chat.unread = false;
    await chat.save();

    return { stats: 200, chat };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

exports.getMessage = async (data) => {
  try {
    const { chatId } = data;

    if (!chatId) return new ErrorHandler("Chat Id is required!", 500);

    const chat = await Chat.findById(chatId).populate("messages");

    return { status: 200, chat };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

// exports.addChatField = async () => {
//   try {
//     const buyer = await Dealer.updateMany({}, { $set: { chat: [] } });
//     console.log({ buyer });
//   } catch (error) {
//     console.log(error);
//   }
// };
