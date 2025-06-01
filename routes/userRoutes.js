import express from "express";
import { registerUser, loginUser, getAllUsers, getUserById, getMyProfile, searchWorkersByLocation,getMyServiceBookings,getUserStats,verifyOTP } from '../controllers/useController.js';
import { protect } from '../middleware/authMiddleware.js';
import { updateUser } from '../controllers/useController.js';
import { deleteUser } from '../controllers/useController.js';
import {resetPassword,forgetPassword } from '../controllers/forgetPasswordController.js';
import { deleteUserByAdmin,  deleteServiceByAdmin  } from '../controllers/adminController.js';
import { protect ,adminOnly} from '../middleware/authMiddleware.js';



const router = express.Router(); 
router.post('/register', registerUser);// doneeeeee
router.post('/login', loginUser); //doneeeeeeeeeeeee
router.get('/', protect, getAllUsers); // doneeeeeeeeeeeee
router.put('/update', protect, updateUser);//doneeeeeeeeeeeeee
router.delete('/',protect, deleteUser);//doneeeeeee
router.post('/verify-otp', verifyOTP); // goooode job
router.get('/me', protect, getMyProfile); //doneeeeeeeee
router.get('/search', searchWorkersByLocation);// it works but need modification
router.get('/my-services', protect, getMyServiceBookings);// doneeeeeeeee
router.get('/stats', protect, getUserStats);//perfeeeeectttttt
router.get('/:id',protect, getUserById); //great job
router.delete('/id', protect, deleteUserByAdmin);
router.delete('/admin/service/:id', protect, deleteServiceByAdmin);
router.post('/forget-password', forgetPassword);
router.post('/reset-password/:token', resetPassword);


export default router;
