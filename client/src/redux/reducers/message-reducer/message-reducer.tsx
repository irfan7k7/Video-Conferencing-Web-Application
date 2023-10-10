import { createSlice } from "@reduxjs/toolkit"

interface textMessage {
  _id: string
  chatRoomId: string
  postedByUser: string
  message: string
  messageType: "textMessage",
  messageSendedTime:Date
}

interface voiceMessage {
  _id: string
  chatRoomId: string
  postedByUser: string
  message: string
  messageType: "voiceMessage"
  messageSendedTime:Date
}

interface outGoingMessage {
  messegeChannelType: "outgoingMessage"
  messageData: textMessage | voiceMessage
  messageStatus?: "sended" | "notSended"
  messageDeliveryStatus?: "notDelivered" | "delivered" | "watched"
}
interface incomingMessage {
  messegeChannelType: "incomingMessage"
  messageData: textMessage | voiceMessage
}



interface chatRoomMessages{
  chatRoomId:string,
  messages:Array<outGoingMessage|incomingMessage>,
}


interface allChatRoomMessages{
  chatRoomMessages:chatRoomMessages[],
  currentChaterMessage?:chatRoomMessages
}
export type chatRoomMessagesReducerSlate = allChatRoomMessages 
const chatRoomMessagesIntialState:chatRoomMessagesReducerSlate = {
  chatRoomMessages:[]
}

export const chatRoomsMessageReducer = createSlice({
  name: "chatRoomMessageReducer",
  initialState: chatRoomMessagesIntialState,
  reducers: {
    addIntialChatRoomMessage:(state,action)=> {
      return {chatRoomMessages:[action.payload],currentChaterMessage:action.payload}
    },
    addChatRoomMessage: (state, action) => {
      return {chatRoomMessages:[...state.chatRoomMessages,action.payload],currentChaterMessage:action.payload}
    },
    removeCurrentChaterMessage:(state,action) => {
      return {chatRoomMessages:state.chatRoomMessages,currentChaterMessage:undefined}
    },
    addCurrentChaterMessage:(state,action) => {
      const currentChaterMessage = state.chatRoomMessages.map((chatRoom) => chatRoom.chatRoomId == action.payload.chatRoomId)
      console.log('current chater message ')
      state.currentChaterMessage = currentChaterMessage
    }

  },
})
export const chatRoomMessageAction = chatRoomsMessageReducer.actions




interface availabeChatRoom {
  chatRoomId: string
}
interface messageAvailableChatRoomsReducer {
  chatRooms: availabeChatRoom[]
  isIntialData: boolean
}

export type messageAvailableChatRoomsSlate = messageAvailableChatRoomsReducer

const messageAvailableChatRoomsInitialSate: messageAvailableChatRoomsSlate = {
  chatRooms: [],
  isIntialData: true,
}

export const messageAvailableChatRooms = createSlice({
  name: "messageAvailableChatRoomsReducer",
  initialState: messageAvailableChatRoomsInitialSate,
  reducers: {
    addMessageAvailableChatRooms: (state, action) => {
      const isAlreadAvailableMessage = state.chatRooms.some(
        (chatRoom) => chatRoom.chatRoomId == action.payload.chatRoomId,
      )
      if (isAlreadAvailableMessage) return { ...state }
      return { isIntialData: false, chatRooms: [...state.chatRooms, action.payload] }
    },
  },
})

export const messageAvailableChatRoomsAction = messageAvailableChatRooms.actions