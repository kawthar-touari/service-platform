import express from 'express';
import {
  createBooking,
  getAllBookings,
  updateBookingStatus,
  addReview,
  deleteBooking,
  getWorkerDashboardStats,
  getWorkerBookingCountsByMonth,
  respondToBooking,
  updateReview,
  deleteReview,
  cancelBooking,
  getBookingsOfWorker,
  getReviewsOfWorker,
  sendBookingConfirmationEmail,
  getBookingsByUser,
  getBookingsOfWorkerAndStatus,
  filterWorkerReviewsByRating,
  getStatsOfWorker
} from '../controllers/bookingController.js';
import { protect, adminOnly,canModifyBooking } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/', protect, createBooking);//done
router.get('/', adminOnly, getAllBookings);//done
router.put('/status/:id',protect,canModifyBooking , updateBookingStatus);//done
router.post('/review/:id', protect, addReview);//done
router.get('/dashboard/stats', canModifyBooking, protect, getWorkerDashboardStats);
router.get('/dashboard/monthly-comparison', canModifyBooking, protect, getWorkerBookingCountsByMonth);
router.post('/dashboard/respond/:id', protect, createBooking, respondToBooking);
router.put('/review/:bookingId', protect, updateReview);//done
router.delete('/review/:bookingId', protect, deleteReview);//done
router.put('/cancel/:bookingId', protect, cancelBooking);//done
router.get('/worker', protect, getBookingsOfWorker);
router.get('/worker/reviews', protect, getReviewsOfWorker);
router.post('/notify', protect, sendBookingConfirmationEmail);
router.get('/user', protect, getBookingsByUser);
router.delete('/:id', protect, canModifyBooking, deleteBooking);//done
router.get('/worker/bookings/status/:status/:iduser', protect, getBookingsOfWorkerAndStatus);
router.get('/worker/filter', protect, filterWorkerReviewsByRating);
router.get('/worker/bookings/stats', protect, getStatsOfWorker);


export default router;
 