import Message from '../models/message.js';

// إرسال رسالة
export const sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;

  try {
    const message = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Failed to send message', error: error.message });
  }
};

// جلب كل المحادثات بين مستخدمين
export const getMessages = async (req, res) => {
  const otherUserId = req.params.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: otherUserId },
        { sender: otherUserId, receiver: req.user._id },
      ]
    }).sort({ timestamp: 1 }); // ترتيب تصاعدي حسب الوقت

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get messages', error: error.message });
  }
};