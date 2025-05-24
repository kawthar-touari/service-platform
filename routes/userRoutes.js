import express from "express";
import { registerUser, loginUser, getAllUsers, getUserById, getMyProfile, searchWorkersByLocation,getMyServiceBookings,getUserStats,verifyOTP } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { updateUser } from '../controllers/userController.js';
import { deleteUser } from '../controllers/userController.js';



const router = express.Router(); 
router.post('/register', registerUser);
router.post('/login', loginUser); 
router.get('/', protect, getAllUsers); // حماية هذا المسار
router.put('update/', protect, updateUser);
router.delete('/', deleteUser);
router.post('/verify-otp', verifyOTP); // تحقق من OTP
router.get('/:id', getUserById); 
router.get('/me', protect, getMyProfile); 
router.get('/search', searchWorkersByLocation);
router.get('/my-services', protect, getMyServiceBookings);
router.get('/stats', protect, getUserStats);

// جلب الحجوزات الخاصة بالعامل مع فلترة الحالة (pending, in-progress, done, cancelled-client, cancelled-worker)


// تحديث حالة الحجز (قبول، رفض، قيد الإنجاز، من طرف العامل)



export default router;
  