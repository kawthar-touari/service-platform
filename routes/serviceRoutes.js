import express from 'express';
import {
  addService,
  updateService,
  deleteService,
  getWorkerServices,
  getAllServices,
  getServiceById,
  getUserFromService,
  toggleServiceStatus,
} from '../controllers/serviceController.js';
import { protect, canModifyService, adminOnly } from '../middleware/authMiddleware.js';

const router = express.Router();


router.post('/',protect, addService);

router.put('/:id', protect,canModifyService, updateService);

router.delete('/:id', protect, deleteService);

router.get('/my-services', protect, getWorkerServices);

router.patch('/toggle-status/:id', protect, toggleServiceStatus);

router.get('/', getAllServices);

router.get('/services/:userId', getServiceById);


router.get('/informationofwhocreattheservice/:id',protect,getUserFromService )

export default router  ;