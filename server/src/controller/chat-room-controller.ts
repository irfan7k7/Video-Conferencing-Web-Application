import { Request, Response } from "express"
import textMessageModel from "../model/mongoose/message-model/text-message-model"
import ChatRoomModel from "../model/mongoose/chat-room-model/chat-room-model"
import GroupModel from "../model/mongoose/group-model"
import mongoose from "mongoose"
import ConnectionModel from "../model/mongoose/connections-model"
import UserModel from "../model/mongoose/user-model"
import MessageReactionModel from "../model/mongoose/message-model/message-reaction-model"

export const getAllChatUsersHandler = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user as userInterface

    const userObjectId = new mongoose.Types.ObjectId(_id)

    const chatUser = await ConnectionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$friends" },
      {
        $lookup: {
          from: "users", // The 'users' collection name in MongoDB
          localField: "friends.userId",
          foreignField: "_id",
          pipeline: [
            {
              $project: { name: 1, email: 1, profileImageUrl: 1, _id: 1, userId: 1, chatRoomId: "friends.chatRoomId" },
            },
          ],
          as: "friendsDetails",
        },
      },
      { $unwind: "$friendsDetails" },
      {
        $addFields: {
          "friendsDetails.chatRoomId": "$friends.chatRoomId", // Add chatRoomId from the friends array to friendDetails
        },
      },
      {
        $group: {
          _id: "$_id", // Group by the Connection document's _id
          friendsDetails: { $push: "$friendsDetails" }, // Push the friendDetails with chatRoomId into an array
        },
      },

      {
        // $project: { friendsDetails: { $first: "$friendsDetails" } },
        $project: { friendsDetails: 1 },
      },
    ])
    return res.status(200).json(chatUser[0]?.friendsDetails)
  } catch (error) {
    console.log(error)
  }
}

export const getAllChatGroupsHandler = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user as userInterface
    const userObjectId = new mongoose.Types.ObjectId(_id)

    const allChatGroups = await ConnectionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$groups" },
      {
        $lookup: {
          from: "groups", // The 'users' collection name in MongoDB
          localField: "groups.groupId",
          foreignField: "_id",
          pipeline: [
            {
              $project: {
                name: 1,
                discription: 1,
                groupImage: 1,
                totalMembers: 1,
                setting: 1,
                adminsDetail: 1,
              },
            },
            {
              $addFields: {
                isAdmin: { $in: [userObjectId, "$adminsDetail.userId"] },
              },
            },
          ],
          as: "groupsDetails",
        },
      },
      { $unwind: "$groupsDetails" },
      {
        $addFields: {
          "groupsDetails.chatRoomId": "$groups.chatRoomId",
          // "groupsDetails.isAdmin": { $in: [userObjectId, "$groups.adminsDetail"] },
          // "groupsDetails.isAdmin": "$groups.names",
        },
      },
      {
        $group: {
          _id: "$_id",
          groupsDetails: { $push: "$groupsDetails" },
        },
      },

      {
        $project: { groupsDetails: 1 },
      },
    ])

    return res.status(200).json(allChatGroups[0]?.groupsDetails)
  } catch (error) {
    console.log(error)
    return res.status(400).json({})
  }
}

export const getChatRoomMessageHandler = async (req: Request, res: Response) => {
  try {
    const { chatRoomId, skip, step, limit, sort } = req.body
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId)

    const arrayStartingFrom = skip != undefined ? -(skip + 1) * step : -1
    const messageLimit = limit != undefined ? limit : 10

    const messageSort = sort != undefined && sort == "ACCENDING" ? -1 : 1
    const chatRoomMessages = await ChatRoomModel.aggregate([
      { $match: { _id: chatRoomObjectId } },
      { $project: { chatRoomConversations: { $slice: ["$chatRoomConversations", arrayStartingFrom, messageLimit] } } },
      { $unwind: "$chatRoomConversations" },
      {
        $group: {
          _id: null,
          messages: { $push: { type: "$chatRoomConversations.messageType", id: "$chatRoomConversations.messageId" } },
        },
      },

      {
        $project: {
          allMessages: {
            $map: {
              input: "$messages",
              as: "message",
              in: {
                textMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "textMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                voiceMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "voiceMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                imageMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "imageMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                videoMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "videoMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
              },
            },
          },
        },
      },

      {
        $lookup: {
          from: "textmessages",
          let: { messageIds: "$allMessages.textMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$messageIds"] } } }],
          as: "textMessage",
        },
      },
      {
        $lookup: {
          from: "voicemessages",
          let: { voiceMessageIds: "$allMessages.voiceMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$voiceMessageIds"] } } }],
          as: "voiceMessage",
        },
      },
      {
        $lookup: {
          from: "imagemessages",
          let: { imageMessageIds: "$allMessages.imageMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$imageMessageIds"] } } }],
          as: "imageMessage",
        },
      },
      {
        $lookup: {
          from: "videomessages",
          let: { videoMessageIds: "$allMessages.videoMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$videoMessageIds"] } } }],
          as: "videoMessage",
        },
      },

      {
        $addFields: {
          messages: { $concatArrays: ["$textMessage", "$voiceMessage", "$imageMessage", "$videoMessage"] },
        },
      },
      {
        $project: {
          messages: {
            $sortArray: {
              input: "$messages",
              sortBy: { createdAt: messageSort },
            },
          },
        },
      },
    ])

    const chatRoomMessageReactions = await ChatRoomModel.aggregate([
      { $match: { _id: chatRoomObjectId } },
      { $project: { chatRoomConversations: { $slice: ["$chatRoomConversations", arrayStartingFrom, limit] } } },
      {
        $lookup: {
          from: "messagereactions",
          let: { messageIds: "$chatRoomConversations" },
          pipeline: [{ $match: { $expr: { $in: ["$messageId", "$$messageIds.messageId"] } } }],
          as: "messageReaction",
        },
      },
    ])

    chatRoomMessages[0].messages = chatRoomMessages[0].messages.map((messages: any) => {
      const messageReaction = chatRoomMessageReactions[0].messageReaction.find(
        //@ts-ignore
        (reaction) => reaction.messageId == messages._id,
      )
      return { ...messages, reactions: messageReaction?.reactions ?? [] }
    })

    let totalMessages: undefined | number = undefined
    if (skip == 0) {
      const messageSizeData = await ChatRoomModel.aggregate([
        { $match: { _id: chatRoomObjectId } },
        { $project: { totalMessages: { $size: "$chatRoomConversations" } } },
      ])
      if (messageSizeData[0].totalMessages != undefined) totalMessages = messageSizeData[0].totalMessages
    }
    return res.status(200).json({ ...chatRoomMessages, totalMessages })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ isValid: false })
    // console.log(error)
  }
}

export const getGroupDetailHandler = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params
    const groupObjectId = new mongoose.Types.ObjectId(groupId)
    const groups = await GroupModel.findOne({ _id: groupObjectId })
    if (groups == null) return res.status(400).json({})

    const groupWithUserDetails = await GroupModel.aggregate([
      {
        $match: { _id: groupObjectId },
      },
      {
        $lookup: {
          from: "users",
          localField: "members.userId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, profileImageUrl: 1, _id: 1, userId: 1 } }],
          as: "members",
        },
      },
      {
        $addFields: {
          members: "$members",
        },
      },
    ])

    const group = groupWithUserDetails[0] ?? {}
    return res.status(200).json({ ...group })
  } catch (error) {}
}
// creating the group
export const createGroupHandler = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user as userInterface
    const userObjectId = new mongoose.Types.ObjectId(_id)

    const { name, members, description, groupImage } = req.body
    members.push({ userId: _id })

    console.log(members)
    const membersObjectId = members.map((member: { userId: string }) => ({
      userId: new mongoose.Types.ObjectId(member.userId),
    }))

    console.log(membersObjectId)
    const newChatRoom = new ChatRoomModel({})
    await newChatRoom.save()

    if (newChatRoom == null) return res.status(400).json({})
    const newGroup = new GroupModel({
      name,
      adminsDetail: [{ userId: userObjectId }],
      members: membersObjectId,
      chatRoomId: newChatRoom._id,
      totalMembers: members.length,
      groupImage,
      setting: { adminOnlyMessaging: false, allowJoinByUrl: false, hideMemberPhoneNumber: false },
    })
    await newGroup.save()

    const membersObjectIds = members.map((member: { userId: string }) => new mongoose.Types.ObjectId(member.userId))

    await ConnectionModel.updateMany(
      { userId: { $in: membersObjectIds } },
      { $push: { groups: { groupId: newGroup._id, chatRoomId: newChatRoom._id } } },
    )

    return res.status(200).json({ isValid: true, chatRoomId: newChatRoom._id })
  } catch (error) {
    console.log(error)
    return res.status(400).json({})
  }
}

export const updateGroupHandler = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.body
    const groupObjectId = new mongoose.Types.ObjectId(groupId)

    const group = await GroupModel.findOneAndUpdate({ _id: groupObjectId }, { ...req.body }, { new: true })
    return res.status(200).json({ group })
  } catch (error) {
    return res.status(400).json({})
  }
}

export const updateGroupSettingHandler = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params
    const { groupSetting } = req.body
    const groupObjectId = new mongoose.Types.ObjectId(groupId)
    const group = await GroupModel.findOneAndUpdate({ _id: groupObjectId }, { setting: groupSetting }, { new: true })
    return res.status(200).json({ group })
  } catch (error) {
    return res.status(400).json({})
  }
}

export const groupAddMembersHandler = async (req: Request, res: Response) => {
  try {
    const { members, groupId } = req.body
    const groupObjectId = new mongoose.Types.ObjectId(groupId)

    const group = await GroupModel.findOneAndUpdate({ _id: groupObjectId }, { members }, { new: true })
    return res.status(200).json({ group })
  } catch (error) {}
}

export const groupRemoveMemberHandler = async (req: Request, res: Response) => {
  try {
    const { member, groupId } = req.body
    const groupObjectId = new mongoose.Types.ObjectId(groupId)

    const group = await GroupModel.findOneAndUpdate(
      { _id: groupObjectId },
      { $pull: { members: { userId: member.userId } } },
    )
    return res.status(200).json({ group })
  } catch (error) {}
}

export const acceptGroupHandler = async (req: Request, res: Response) => {
  try {
    const { _id } = req.user as userInterface
    const { groupId, groupChatRoomId } = req.body

    const userObjectId = new mongoose.Types.ObjectId(_id)
    const groupObjectId = new mongoose.Types.ObjectId(groupId)
    const groupChatRomObjectId = new mongoose.Types.ObjectId(groupChatRoomId)
    await ConnectionModel.findOneAndUpdate(
      { userId: userObjectId, groups: { $not: { $elemMatch: { groupId: groupObjectId } } } },
      { $push: { groups: { groupId: groupObjectId, chatRoomId: groupChatRomObjectId } } },
    )
  } catch (error) {
    return res.status(400).json({})
  }
}

export const leaveGroupHandler = async (req: Request, res: Response) => {
  try {
  } catch (error) {}
}

// get group chat room messages
export const getGroupChatRoomMessageHandler = async (req: Request, res: Response) => {
  try {
    const { chatRoomId, skip, step, limit, sort } = req.body
    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId)

    const arrayStartingFrom = skip != undefined ? -(skip + 1) * step : -1
    const messageLimit = limit != undefined ? limit : 10

    const messageSort = sort != undefined && sort == "ACCENDING" ? -1 : 1
    const chatRoomMessages = await ChatRoomModel.aggregate([
      { $match: { _id: chatRoomObjectId } },
      { $project: { chatRoomConversations: { $slice: ["$chatRoomConversations", arrayStartingFrom, messageLimit] } } },
      { $unwind: "$chatRoomConversations" },
      {
        $group: {
          _id: null,
          messages: { $push: { type: "$chatRoomConversations.messageType", id: "$chatRoomConversations.messageId" } },
        },
      },

      {
        $project: {
          allMessages: {
            $map: {
              input: "$messages",
              as: "message",
              in: {
                textMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "textMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                voiceMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "voiceMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                imageMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "imageMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                videoMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "videoMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
                pollMessageIds: {
                  $cond: { if: { $eq: ["$$message.type", "pollMessage"] }, then: "$$message.id", else: "$$REMOVE" },
                },
              },
            },
          },
        },
      },

      {
        $lookup: {
          from: "textmessages",
          let: { messageIds: "$allMessages.textMessageIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$messageIds"] } } },
            {
              $addFields: { postedByUser: { $toObjectId: "$postedByUser" } },
            },
            {
              $lookup: {
                from: "users",
                localField: "postedByUser",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, name: 1, profileImageUrl: 1 } }],
                as: "postedByUser",
              },
            },
            {
              $addFields: { postedByUser: { $arrayElemAt: ["$postedByUser", 0] } },
            },
          ],
          as: "textMessage",
        },
      },
      {
        $lookup: {
          from: "voicemessages",
          let: { voiceMessageIds: "$allMessages.voiceMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$voiceMessageIds"] } } }],
          as: "voiceMessage",
        },
      },
      {
        $lookup: {
          from: "imagemessages",
          let: { imageMessageIds: "$allMessages.imageMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$imageMessageIds"] } } }],
          as: "imageMessage",
        },
      },
      {
        $lookup: {
          from: "videomessages",
          let: { videoMessageIds: "$allMessages.videoMessageIds" },
          pipeline: [{ $match: { $expr: { $in: ["$_id", "$$videoMessageIds"] } } }],
          as: "videoMessage",
        },
      },
      {
        $lookup: {
          from: "pollmessages",
          let: { pollMessageIds: "$allMessages.pollMessageIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$pollMessageIds"] } } },
            { $addFields: { messageType: "pollMessage" } },
            { $addFields: { postedByUser: { $toObjectId: "$postedByUser" } } },
            {
              $lookup: {
                from: "users",
                localField: "postedByUser",
                foreignField: "_id",
                pipeline: [{ $project: { _id: 1, name: 1, profileImageUrl: 1 } }],
                as: "postedByUser",
              },
            },
            { $addFields: { postedByUser: { $arrayElemAt: ["$postedByUser", 0] } } },
          ],
          as: "pollMessage",
        },
      },

      {
        $addFields: {
          messages: {
            $concatArrays: ["$textMessage", "$voiceMessage", "$imageMessage", "$videoMessage", "$pollMessage"],
          },
        },
      },
      {
        $project: {
          messages: {
            $sortArray: {
              input: "$messages",
              sortBy: { createdAt: messageSort },
            },
          },
        },
      },
    ])

    const chatRoomMessageReactions = await ChatRoomModel.aggregate([
      { $match: { _id: chatRoomObjectId } },
      { $project: { chatRoomConversations: { $slice: ["$chatRoomConversations", arrayStartingFrom, limit] } } },
      {
        $lookup: {
          from: "messagereactions",
          let: { messageIds: "$chatRoomConversations" },
          pipeline: [{ $match: { $expr: { $in: ["$messageId", "$$messageIds.messageId"] } } }],
          as: "messageReaction",
        },
      },
    ])

    //@ts-ignore
    chatRoomMessages[0].messages = chatRoomMessages[0].messages.map((messages) => {
      const messageReaction = chatRoomMessageReactions[0].messageReaction.find(
        //@ts-ignore
        (reaction) => reaction.messageId == messages._id,
      )
      return { ...messages, reactions: messageReaction?.reactions ?? [] }
    })

    let totalMessages: undefined | number = undefined
    if (skip == 0) {
      const messageSizeData = await ChatRoomModel.aggregate([
        { $match: { _id: chatRoomObjectId } },
        { $project: { totalMessages: { $size: "$chatRoomConversations" } } },
      ])
      if (messageSizeData[0].totalMessages != undefined) totalMessages = messageSizeData[0].totalMessages
    }
    return res.status(200).json({ ...chatRoomMessages, totalMessages })
  } catch (error) {
    console.log(error)
    return res.status(400).json({ isValid: false })
    // console.log(error)
  }
}

export const getChatRoomMessageReactionHandler = async (req: Request, res: Response) => {
  try {
    const { chatRoomId, skip, step, limit } = req.body

    const chatRoomObjectId = new mongoose.Types.ObjectId(chatRoomId)

    const arrayStartingFrom = -(skip + 1) * step

    console.log(arrayStartingFrom, limit)
    const chatRoomMessageReactions = await ChatRoomModel.aggregate([
      { $match: { _id: chatRoomObjectId } },
      { $project: { chatRoomConversations: { $slice: ["$chatRoomConversations", arrayStartingFrom, limit] } } },
      {
        $lookup: {
          from: "messagereactions",
          let: { messageIds: "$chatRoomConversations" },
          pipeline: [{ $match: { $expr: { $in: ["$messageId", "$$messageIds.messageId"] } } }],
          as: "messageReaction",
        },
      },
    ])
    //@ts-ignore
    chatRoomMessageReactions[0].chatRoomConversations = chatRoomMessageReactions[0].chatRoomConversations.map(
      (conversation: any) => {
        const messageReaction = chatRoomMessageReactions[0].messageReaction.find(
          //@ts-ignore
          (reaction) => reaction.messageId == conversation.messageId,
        )
        return { ...conversation, reactions: messageReaction?.reactions ?? [] }
      },
    )

    return res.status(200).json({ chatRoomConversations: chatRoomMessageReactions[0].chatRoomConversations })
  } catch (error) {
    console.log(error)
    return res.status(400).json({})
  }
}

export const postFreindRequestHandler = async (req: Request, res: Response) => {
  try {
    console.log("post freind request")
    const _id = req.user?._id as string
    const userObjectId = new mongoose.Types.ObjectId(_id)
    const { friendRequestorId } = req.body

    if (!friendRequestorId) return res.status(400).json({})
    const freindRequestorObjectId = new mongoose.Types.ObjectId(friendRequestorId)

    const userConnections = await ConnectionModel.findOne({ userId: userObjectId })
    if (!userConnections) return res.status(400).json({})

    const isContainSendedFreindRequest = userConnections?.sendedFreindRequest.some(
      (request) => request.userId == friendRequestorId,
    )
    if (isContainSendedFreindRequest) return res.status(400).json({ isValid: false })
    const isContainReceivedFreindRequest = userConnections?.receivedFreindRequest.some(
      (request) => request.userId == friendRequestorId,
    )
    if (isContainReceivedFreindRequest) return res.status(400).json({ isValid: false })

    await ConnectionModel.findOneAndUpdate(
      { userId: userObjectId },
      { $push: { sendedFreindRequest: { userId: friendRequestorId, status: "pending" } } },
    )
    await ConnectionModel.findOneAndUpdate(
      { userId: freindRequestorObjectId },
      { $push: { receivedFreindRequest: { userId: userObjectId, status: "pending" } } },
    )
    return res.status(200).json({ isValid: true })
  } catch (error) {
    console.log(error)
    return res.status(400).json({})
  }
}

export const getFreindRequestsHandler = async (req: Request, res: Response) => {
  try {
    const _id = req.user?._id as string
    const userObjectId = new mongoose.Types.ObjectId(_id)

    const sendedFreindRequests = await ConnectionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$sendedFreindRequest" },
      {
        $lookup: {
          from: "users",
          localField: "sendedFreindRequest.userId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, profileImageUrl: 1, _id: 1, userId: 1 } }],
          as: "userDetails",
        },
      },
      {
        // Combine sendedFreindRequest status with the user details
        $addFields: {
          "sendedFreindRequest.userDetails": { $arrayElemAt: ["$userDetails", 0] },
        },
      },
      {
        // Group the results back into an array to get the combined sendedFreindRequest array with user details and status
        $group: {
          _id: "$_id",
          sendedFreindRequest: {
            $push: {
              userId: "$sendedFreindRequest.userId",
              status: "$sendedFreindRequest.status",
              userDetails: "$sendedFreindRequest.userDetails",
            },
          },
        },
      },
    ])
    const receivedFreindRequests = await ConnectionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$receivedFreindRequest" },
      {
        $lookup: {
          from: "users",
          localField: "receivedFreindRequest.userId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, profileImageUrl: 1, _id: 1, userId: 1 } }],
          as: "userDetails",
        },
      },
      {
        // Combine receivedFreindRequest status with the user details
        $addFields: {
          "receivedFreindRequest.userDetails": { $arrayElemAt: ["$userDetails", 0] },
        },
      },
      {
        // Group the results back into an array to get the combined receivedFreindRequest array with user details and status
        $group: {
          _id: "$_id",
          receivedFreindRequest: {
            $push: {
              userId: "$receivedFreindRequest.userId",
              status: "$receivedFreindRequest.status",
              userDetails: "$receivedFreindRequest.userDetails",
            },
          },
        },
      },
    ])

    const freinds = await ConnectionModel.aggregate([
      { $match: { userId: userObjectId } },
      { $unwind: "$friends" },
      {
        $lookup: {
          from: "users",
          localField: "friends.userId",
          foreignField: "_id",
          pipeline: [{ $project: { name: 1, email: 1, profileImageUrl: 1, _id: 1, userId: 1 } }],
          as: "userDetails",
        },
      },
      {
        $addFields: {
          "friends.userDetails": { $arrayElemAt: ["$userDetails", 0] },
        },
      },
      {
        $group: {
          _id: "$_id",
          friends: {
            $push: {
              userId: "$friends.userId",
              userDetails: "$friends.userDetails",
            },
          },
        },
      },
    ])
    return res.status(200).json({
      sendedFreindRequests: sendedFreindRequests[0]?.sendedFreindRequest ?? [],
      receivedFreindRequests: receivedFreindRequests[0]?.receivedFreindRequest ?? [],
      freinds: freinds[0]?.friends ?? [],
    })
  } catch (error) {
    console.log(error)
  }
}
export const putFreindRequestsHandler = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id as string
    const userObjectId = new mongoose.Types.ObjectId(userId)
    const { friendRequestorId, isAcceptedFreindRequest } = req.body

    if (!friendRequestorId) return res.status(400).json({})
    const freindRequestorObjectId = new mongoose.Types.ObjectId(friendRequestorId)

    const userConnections = await ConnectionModel.findOne({ userId: userObjectId })
    const freindRequestorConnections = await ConnectionModel.findOne({ userId: freindRequestorObjectId })

    if (!userConnections || !freindRequestorConnections)
      return res.status(400).json({ message: "user connections not found" })

    const recievedRequestIndex = userConnections.receivedFreindRequest.findIndex(
      (request) => request.userId == friendRequestorId,
    )
    const sendRequestIndex = freindRequestorConnections.sendedFreindRequest.findIndex(
      //@ts-ignore
      (request) => request.userId == userId,
    )
    if (recievedRequestIndex < 0 || sendRequestIndex < 0) return res.status(400).json({})

    const status = isAcceptedFreindRequest ? "accepted" : "rejected"
    userConnections.receivedFreindRequest[recievedRequestIndex].status = status
    freindRequestorConnections.sendedFreindRequest[sendRequestIndex].status = status

    if (isAcceptedFreindRequest) {
      const newChatRoom = new ChatRoomModel({ chatRoomConversations: [] })
      await newChatRoom.save()

      if (newChatRoom == null) return res.status(400).json({ message: "chatroom not created" })
      await ConnectionModel.findOneAndUpdate(
        { userId: userObjectId },
        {
          receivedFreindRequest: userConnections.receivedFreindRequest,
          $push: {
            friends: { chatRoomId: newChatRoom._id, userId: freindRequestorObjectId },
          },
        },
      )

      await ConnectionModel.findOneAndUpdate(
        { userId: freindRequestorObjectId },
        {
          sendedFreindRequest: freindRequestorConnections.sendedFreindRequest,
          $push: {
            friends: { chatRoomId: newChatRoom._id, userId: userObjectId },
          },
        },
      )
    } else {
      await ConnectionModel.findOneAndUpdate(
        { userId: userObjectId },
        {
          receivedFreindRequest: userConnections.receivedFreindRequest,
        },
      )

      await ConnectionModel.findOneAndUpdate(
        { userId: freindRequestorObjectId },
        {
          sendedFreindRequest: freindRequestorConnections.sendedFreindRequest,
        },
      )
    }
    return res.status(200).json({})
  } catch (error) {
    console.log(error)
    return res.status(400).json({})
  }
}
