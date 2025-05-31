import express from 'express';
import { createPost, getAllPosts, deletePost } from '../controllers/postController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createPost); // إنشاء بوست
router.get('/', protect, getAllPosts); // جلب كل البوستات
router.delete('/:id', protect, deletePost); // حذف بوست

export default router;