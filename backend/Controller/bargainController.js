const Buyer = require("../Models/buyerSchema");
const Car = require("../Models/carSchema");
const Dealer = require("../Models/dealerSchema");
const Chat = require("../Models/chatSchema");
const ErrorHandler = require("../Utils/ErrorHandler");
const Bargain = require("../Models/bargainSchema");

exports.sendBargain = async (data) => {
  try {
    const { chat_id, car_id, price, sender, receiver } = data;

    if (!chat_id || !price || !car_id || !sender || !receiver) {
      console.log("here");
      return new ErrorHandler("All required fields were not provided!", 500);
    }

    const existingChat = await Chat.findById(chat_id);

    const car = await Car.findById(car_id);

    if (!existingChat) {
      return new ErrorHandler("Chat does not exists", 500);
    }

    if (!car) {
      return new ErrorHandler("Car id not exists", 500);
    }

    const newBargain = await Bargain.create({
      sender,
      receiver,
      car_id,
      price: { price, status: "Ongoing" },
      chat_id: existingChat._id,
    });
    existingChat.bargain.length
      ? existingChat.bargain.push(newBargain._id)
      : (existingChat.bargain = [newBargain._id]);
    existingChat.last_bargain = { price: price, status: "Ongoing" };
    existingChat.unread = true;

    car.bargain = true;
    car.bargained.length == 0 && (car.bargained = []);

    await existingChat.save();
    await car.save();

    return {
      status: 200,
      bargain: newBargain,
    };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

exports.rejectBargain = async (id) => {
  try {
    const bargain = await Bargain.findById(id);

    if (!bargain) return new ErrorHandler("Bargain does not exists", 500);

    bargain.price.status = "Rejected";
    const chat = await Chat.findById(bargain.chat_id);

    chat.last_bargain.status = "Rejected";

    await chat.save();
    await bargain.save();

    return { status: 200, bargain };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

exports.acceptBargain = async (id) => {
  try {
    const bargain = await Bargain.findById(id);
    if (!bargain) return new ErrorHandler("Bargain does not exists", 500);

    const car = await Car.findById(bargain.car_id);
    if (!car) return new ErrorHandler("Car id does not exists", 500);

    bargain.price.status = "Accepted";
    const chat = await Chat.findById(bargain.chat_id);

    chat.last_bargain.status = "Accepted";

    car.bargained.length == 0
      ? (car.bargained = [{ id: chat.buyer_id, price: bargain.price.price }])
      : car.bargained.push({ id: chat.buyer_id, price: bargain.price.price });

    await chat.save();
    await bargain.save();
    await car.save();

    let newBargain = { ...bargain.toObject(), buyer_id: chat.buyer_id };

    return { status: 200, bargain: newBargain };
  } catch (error) {
    console.log(error);
    return new ErrorHandler(error.message, 500);
  }
};

exports.unreadBargain = async (chat_id) => {
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
