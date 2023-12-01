var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getRedisSocketCached } from "../../model/redis/redis.js";
import ChatRoomModel from "../../model/mongoose/chat-room-model/chat-room-model.js";
import textMessageModel from "../../model/mongoose/message-model/text-message-model.js";
import { cloudinaryFileUploadHandler } from "../../config/cloudinary.js";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { __dirname } from "../../server.js";
import voiceMessageModel from "../../model/mongoose/message-model/voice-message-mode.js";
import ImageMessageModel from "../../model/mongoose/message-model/image-message-model.js";
const userMessageSocketIo = (io, socket) => {
    socket.on("message:newMessage", ({ message, receiverId, senderId, chatRoomId }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const receiver = yield getRedisSocketCached(receiverId);
            ChatRoomModel.initiateChat([receiverId, senderId]);
            if (receiver != null) {
                socket.to(receiver.socketId).emit("message:receiveMessage", { message, senderId, chatRoomId, receiverId });
            }
            const textMessage = yield textMessageModel.createNewMessageInChatRoom({
                chatRoomId,
                message,
                postedByUser: senderId,
            });
            console.log(textMessage._id);
            yield ChatRoomModel.addChatConversation({ chatRoomId, messageId: textMessage._id, messageType: "textMessage" });
        }
        catch (error) {
            console.log(error);
        }
    }));
    socket.on("message:newAudioMessage", ({ message, senderId, chatRoomId }) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            // const receiver = awiat getRedisSocketCached(receiverId)
            const randomId = uuidv4();
            const filepath = path.join(__dirname, "..", "public", "uploader", `${randomId}.mp3`);
            // const base64ConvertedData = file.toString("base64")
            yield fs.writeFileSync(filepath, message.file);
            console.log("file", filepath);
            const cloudinaryUpload = yield cloudinaryFileUploadHandler(filepath);
            console.log(cloudinaryUpload.imageUrl);
            if (!cloudinaryUpload.isSuccess || cloudinaryUpload.imageUrl == undefined)
                return;
            const voiceMessage = yield voiceMessageModel.createNewMessageInChatRoom({
                voiceMessageSrc: cloudinaryUpload.imageUrl,
                postedByUser: senderId,
            });
            yield ChatRoomModel.addChatConversation({
                chatRoomId,
                messageId: voiceMessage._id,
                messageType: "voiceMessage",
            });
            console.log("remove file sync");
            // fs.unlinkSync(filepath)
        }
        catch (error) {
            console.log(error);
        }
    }));
    socket.on("message:newImageMessage", ({ chatRoomId, message, receiverId, senderId }) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("new message", receiverId);
        const newMessage = new ImageMessageModel({
            chatRoomId,
            postedByUser: senderId,
            imageMessageSrc: [message.imageMessageSrc],
            messageType: "imageMessage",
        });
        yield newMessage.save();
        if (newMessage == null)
            return;
        const receiver = yield getRedisSocketCached(receiverId);
        if (receiver != null) {
            socket.to(receiver.socketId).emit("message:recieveNewImageMessage", { chatRoomId, message, receiverId, senderId });
        }
        ChatRoomModel.addChatConversation({
            chatRoomId,
            messageId: newMessage._id,
            messageType: "imageMessage",
        });
    }));
};
export default userMessageSocketIo;
