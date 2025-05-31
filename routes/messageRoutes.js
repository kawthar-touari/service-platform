import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, sendMessage); // إرسال رسالة
router.get('/:userId', protect, getMessages); // جلب الرسائل مع مستخدم معين

export default router;