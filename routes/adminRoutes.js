import express from 'express';
import { deleteUserByAdmin,  deleteServiceByAdmin  } from '../controllers/adminController.js';
import { protect ,adminOnly} from '../middleware/authMiddleware.js';

const router = express.Router();

router.delete('/user/:id', protect, adminOnly, deleteUserByAdmin);
router.delete('/admin/service/:id', protect, adminOnly, deleteServiceByAdmin);

export default router;
