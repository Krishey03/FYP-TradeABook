const Chat = require('../../models/Chat');
const Message = require('../../models/Message');
const User = require('../../models/User');

exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required"
    });
  }

  try {
    // Check if chat already exists
    let chat = await Chat.findOne({
      members: { $all: [req.user._id, userId] },
    })
      .populate("members", "-password")
      .populate("lastMessage");

    if (chat) {
      return res.status(200).json({
        success: true,
        chat
      });
    }

    // Create new chat
    const newChat = new Chat({
      members: [req.user._id, userId],
    });

    const createdChat = await newChat.save();
    const fullChat = await Chat.findOne({ _id: createdChat._id })
      .populate("members", "-password");

    res.status(200).json({
      success: true,
      chat: fullChat
    });
  } catch (err) {
    console.error("Chat access error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ 
      members: { $in: [req.user._id] }
    })
    .populate("members", "-password")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      data: chats // Ensure consistent structure
    });
  } catch (err) {
    console.error("Get chats error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  if (!content || !chatId) {
    return res.status(400).json({
      success: false,
      message: "Content and chat ID are required"
    });
  }

  try {
    // Verify the chat exists and user is a member
    const chat = await Chat.findOne({
      _id: chatId,
      members: { $in: [req.user._id] }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or unauthorized"
      });
    }

    // Create new message
    const newMessage = new Message({
      sender: req.user._id,
      content,
      chat: chatId
    });

    let message = await newMessage.save();

    // Populate sender details
    message = await message.populate("sender", "userName email");
    message = await message.populate("chat");
    message = await User.populate(message, {
      path: "chat.members",
      select: "userName email"
    });

    // Update last message in chat
    await Chat.findByIdAndUpdate(chatId, { 
      lastMessage: message 
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(chatId).emit('new_message', message);

    res.status(201).json({
      success: true,
      message
    });
  } catch (err) {
    console.error("Message send error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "userName email")
      .populate("chat")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      messages
    });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

exports.initiateChat = async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required"
    });
  }

  try {
    const recipient = await User.findOne({ email }).select('_id userName email');
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    if (req.user._id.equals(recipient._id)) {
      return res.status(400).json({
        success: false,
        message: "Cannot chat with yourself"
      });
    }

    // Check for existing chat
    let chat = await Chat.findOne({
      members: { $all: [req.user._id, recipient._id] }
    })
    .populate('members', 'userName email')
    .populate('lastMessage');

    if (chat) {
      return res.status(200).json({
        success: true,
        chat
      });
    }

    // Create new chat
    chat = await Chat.create({
      members: [req.user._id, recipient._id]
    });

    const populatedChat = await Chat.findById(chat._id)
      .populate('members', 'userName email');

    res.status(201).json({
      success: true,
      chat: populatedChat // Ensure this matches what frontend expects
    });
  } catch (error) {
    console.error('Error initiating chat:', error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

exports.deleteChat = async (req, res) => {
  const { chatId } = req.params;

  if (!chatId) {
    return res.status(400).json({
      success: false,
      message: "Chat ID is required"
    });
  }

  try {
    // Verify the chat exists and user is a member
    const chat = await Chat.findOne({
      _id: chatId,
      members: { $in: [req.user._id] }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: "Chat not found or unauthorized"
      });
    }

    // Delete all messages associated with this chat
    await Message.deleteMany({ chat: chatId });

    // Delete the chat
    await Chat.findByIdAndDelete(chatId);

    // Emit socket event to notify other users
    const io = req.app.get('io');
    io.to(chatId).emit('chat_deleted', { chatId });

    res.status(200).json({
      success: true,
      message: "Chat deleted successfully"
    });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};