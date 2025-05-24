import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Service from '../models/Service.js';
import asyncHandler from 'express-async-handler';

export const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      res.status(401);
      throw new Error('توكن غير صالح أو منتهي');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('لا يوجد توكن، غير مصرح');
  }
});

// 2. تحقق إن المستخدم أدمن (للوصول للإدارة فقط)
export const adminOnly = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    return res.status(403).json({ message: 'غير مصرح لك بالدخول كمسؤول' });
  }
};

// 3. تحقق صلاحية تعديل أو حذف الحجز: الزبون صاحب الحجز أو الأدمن فقط
export const canModifyService = async (req, res, next) => {
  const serviceId = req.params.id;

  try {
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'الخدمة غير موجودة' });
    }

    // تأكد أن service.createdBy موجودة
    if (!service.createdBy) {
      return res.status(400).json({ message: 'معلومات الخدمة ناقصة' });
    }

    if (req.user.isAdmin || service.createdBy.toString() === req.user._id.toString()) {
      req.service = service;
      next();
    } else {
      return res.status(403).json({ message: 'غير مصرح لك بتعديل هذه الخدمة' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'خطأ في الخادم', error: error.message });
  }
};


export const canModifyBooking = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'مستخدم غير مصرح' });
  }

  const bookingId = req.params.id;

  try {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود' });
    }

    // السماح بالتعديل إذا كان المستخدم أدمن أو صاحب الحجز
    if (req.user.isAdmin || booking.user.toString() === req.user._id.toString()) {
      req.booking = booking; // تمرير الحجز
      next();
    } else {
      return res.status(403).json({ message: 'غير مصرح لك بتعديل هذا الحجز' });
    }
  } catch (error) {
    return res.status(500).json({ message: 'خطأ في الخادم' });
  }
};