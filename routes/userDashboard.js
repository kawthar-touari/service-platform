import express from 'express';
import { 
  getAverageRating,
  getMostDemandedService,
  getRecentReviews,
  getMonthlyBookingsStats,
  getWorkerStats,
  getWorkerBookingCountsByMonth,
  getWorkerBookings,
  getWorkerReviews,
  filterWorkerReviewsByRating,
  getIncomingBookings,
  getWorkerBookingsByStatus,
  getWorkerDashboardStats,
  getWorkerReviewsbyId,
  getWorkerStats2

} from '../controllers/userDashboardController.js';

import { getMyProfile } from  '../controllers/useController.js';

import {  protect } from '../middleware/authMiddleware.js';


const router = express.Router();

router.get('/average-rating', protect, getAverageRating);//done
router.get('/most-demanded-service', protect, getMostDemandedService);//done
router.get('/recent-reviews', protect, getRecentReviews);//done
router.get('/monthly-bookings', protect, getMonthlyBookingsStats);//done
router.get('/stats', protect, getWorkerStats);//done
router.get('/bookings', protect, getWorkerBookings);
router.get('/reviews', protect, getWorkerReviews);
router.get('/dashboard/reviews', protect, filterWorkerReviewsByRating);//done
router.get('/incoming-bookings', protect, getIncomingBookings);//idk try it again
router.get('/bookings-by-status/:status', protect, getWorkerBookingsByStatus);//done
router.get('/dashboard/stats', protect, getWorkerDashboardStats);//done
router.get('/me', protect, getMyProfile); // delete this                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     
router.get('/bookings/monthly-counts', protect, getWorkerBookingCountsByMonth); //mklah double
router.get('/reviews/:id', protect, getWorkerReviewsbyId);
router.get('/stats2', protect, getWorkerStats2); //new endpoint for worker stats
export default router;