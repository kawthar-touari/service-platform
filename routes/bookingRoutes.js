import express from 'express';
import {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  addReview,
  deleteBooking,
  getWorkerDashboardStats,
  getWorkerBookingCountsByMonth,
  updateReview,
  deleteReview,
  cancelBooking,
  getBookingsOfWorker,
  getReviewsOfWorker,
  sendBookingConfirmationEmail,
  getBookingsByUser,
  getBookingsOfWorkerAndStatus,

} from '../controllers/bookingController.js';
import { protect, adminOnly,canModifyBooking } from '../middleware/authMiddleware.js';

const router = express.Router();
 

router.post('/create', protect, createBooking);//done
router.get('/', adminOnly,getAllBookings);//done
router.put('/status/:id',protect , updateBookingStatus);//done
router.post('/review/:id', protect, addReview);//done
router.get('/dashboard/stats', protect, getWorkerDashboardStats);//done
router.get('/dashboard/monthly-comparison', protect, getWorkerBookingCountsByMonth);//done
router.put('/review/:id', protect, updateReview);//done
router.delete('/review/:bookingId', protect, deleteReview);//done
router.put('/cancel/:bookingId', protect, cancelBooking);
router.get('/worker/bookings', protect, getBookingsOfWorker);//done
router.post('/notify', protect, sendBookingConfirmationEmail);//done
router.get('/user', protect, getBookingsByUser);
router.delete('/booking/:bookingId', deleteBooking);//dona
router.get('/worker/bookings/status/:status/:iduser', protect, getBookingsOfWorkerAndStatus);//done



export default router;
 