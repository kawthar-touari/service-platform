import express from 'express';
import { 
  getTotalBookings,
  getAverageRating,
  getMostDemandedService,
  getRecentReviews,
  getMonthlyBookingsStats,
  getWorkerStats,
  getWorkerBookings,
  getWorkerReviews,
  getWorkerBookingCountsByMonth,
  filterWorkerReviewsByRating,
  getIncomingBookings,
  getWorkerBookingsByStatus,
  getWorkerDashboardStats,
  getWorkerServices,
} from '../controllers/useDashboardController.js';

import { getMyProfile } from  '../controllers/userController.js';

import {  protect } from '../middleware/authMiddleware.js';


const router = express.Router();

router.get('/total-bookings', protect , getTotalBookings);
router.get('/average-rating', protect, getAverageRating);
router.get('/most-demanded-service', protect, getMostDemandedService);
router.get('/recent-reviews', protect, getRecentReviews);
router.get('/monthly-bookings', protect, getMonthlyBookingsStats);
router.get('/stats', protect, getWorkerStats);
router.get('/bookings', protect, getWorkerBookings);
router.get('/reviews', protect, getWorkerReviews);
router.get('/earnings', protect, getWorkerBookingCountsByMonth);
router.get('/dashboard/reviews', protect, filterWorkerReviewsByRating);
router.get('/incoming-bookings', protect, getIncomingBookings);
router.get('/bookings-by-status', protect, getWorkerBookingsByStatus);
router.get('/dashboard/stats', protect, getWorkerDashboardStats);
router.get('/me', protect, getMyProfile); // delete this 
router.get('/incoming_services', protect, getWorkerServices);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       

export default router;