import Booking from '../models/Booking.js';
import jwt from 'jsonwebtoken';
import Service from '../models/Service.js';
// إنشاء حجز جديد
export const createBooking = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { service: serviceId, bookingDate, location } = req.body;

    const service = await Service.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      return res.status(404).json({ message: 'Service not available or unavailable' });
    }

    if (new Date(bookingDate) < new Date()) {
      return res.status(400).json({ message: 'Booking date must be in the future' });
    }

    const newBooking = new Booking({
      customer: customerId,
      service: serviceId,
      bookingDate,
      location
    });

    const savedBooking = await newBooking.save();
    res.status(201).json(savedBooking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to create reservation', error: err.message });
  }
};

//  استرجاع جميع الحجوزات مثلا للادمن ترجع اسم و ايمايل تع الزيون الي دار الحجز و العامل الي دار هاذ الخدمة
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'name email')
      .populate({
        path: 'service',
        populate: { path: 'User', model: 'User', select: 'name email' }
      });
    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve reservations', error: err.message });
  }
};

// تحديث حالة الحجز (قيد التنفيذ، مكتمل، ملغى...)
const validStatuses = ["pending", "confirmed", "completed", "canceled"];
//يقدر ابدل الحالة يكونفيرمي العامل برك اي الي خدم هذيك الخدمة و يقدر بلغيها العامل ولازبون لزوج و لا الادمين و باه ادري بلي كملت لازم تكون كانت confirmed من قبل
export const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const bookingId = req.params.id;
    const userId    = req.user._id.toString();

    // 1) Validate new status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status' });
    }

    // 2) Load booking + service → provider
    const booking = await Booking.findById(bookingId)
      .populate({ path:'service', populate:{ path:'createdBy', select:'_id', model:'User' } });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isCustomer = booking.customer.toString()    === userId;
    const isWorker   = booking.service.createdBy._id.toString() === userId;
    const isAdmin    = req.user.isAdmin;

    // 3) Authorization & allowed transitions
    if (status === 'confirmed' || status === 'in-progress' || status === 'completed') {
      if (!(isWorker||isAdmin)) {
        return res.status(403).json({ message: 'Only provider or admin may confirm/progress/complete' });
      }
    }
    else if (status === 'canceled') {
      if (!(isCustomer||isWorker||isAdmin)) {
        return res.status(403).json({ message: 'Only customer, provider or admin may cancel' });
      }
      // optional: disallow cancel after completed
      if (booking.status === 'completed') {
        return res.status(400).json({ message: 'Cannot cancel a completed booking' });
      }
    }
    else if (status === 'pending') {
      return res.status(400).json({ message: 'Cannot reset status to pending' });
    }

    // 4) Apply and save
    booking.status = status;
    await booking.save();

    res.status(200).json(booking);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update booking status', error: err.message });
  }
};

// إضافة تقييم ومراجعة بعد إنهاء الخدمة
export const addReview = async (req, res) => {
  try {
    const { rating, review } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود' });
    }

    // تحقق أن المستخدم هو صاحب الحجز
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'غير مصرح لك بتقييم هذا الحجز' });
    }

    // لا يمكن التقييم إلا بعد إتمام الخدمة
    if (booking.status !== 'done') {
      return res.status(400).json({ message: 'لا يمكن إضافة تقييم قبل إتمام الخدمة' });
    }

    // لا يمكن التقييم أكثر من مرة
    if (booking.rating || booking.review) {
      return res.status(400).json({ message: 'لقد قمت بتقييم هذا الحجز من قبل' });
    }

    // تحقق من صحة التقييم
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    booking.rating = rating;
    booking.review = review;
    await booking.save();

    res.status(200).json({ message: 'تمت إضافة التقييم بنجاح', booking });
  } catch (err) {
    res.status(500).json({ message: 'فشل في إضافة التقييم', error: err.message });
  }
};

// تحديث تقييم
export const updateReview = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const bookingId = req.params.id;

    const booking = await Booking.findById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود' });
    }

    // تحقق أن المستخدم هو صاحب الحجز
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'غير مصرح لك بتعديل هذا التقييم' });
    }

    // تحقق أن الحجز مكتمل
    if (booking.status !== 'done') {
      return res.status(400).json({ message: 'لا يمكن تعديل التقييم قبل إتمام الخدمة' });
    }

    if (!booking.review) {
      return res.status(404).json({ message: 'لا يوجد تقييم لتحديثه' });
    }

    // تحقق من صحة التقييم
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'التقييم يجب أن يكون بين 1 و 5' });
    }

    booking.rating = rating;
    booking.review = review;

    await booking.save();

    res.status(200).json({ message: 'تم تحديث التقييم بنجاح', booking });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تحديث التقييم', error: error.message });
  }
};

// حذف تقييم
 export const deleteReview = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking || !booking.review) {
      return res.status(404).json({ message: 'لا يوجد تقييم لحذفه' });
    }

    // تأكد أن المستخدم هو صاحب الحجز
    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ message: 'غير مصرح لك بحذف هذا التقييم' });
    }

    // تأكد أن الحجز مكتمل
    if (booking.status !== 'done') {
      return res.status(400).json({ message: 'لا يمكن حذف التقييم قبل إتمام الخدمة' });
    }

    booking.review = undefined;
    booking.rating = undefined;
    await booking.save();

    res.status(200).json({ message: 'تم حذف التقييم بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء حذف التقييم', error: error.message });
  }
};
//cancelbooking يقدر الزبون و لا العامل اي الي دار الخدمة
 export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;  // المستخدم الحالي

    // جلب الحجز مع الخدمة المرتبطة والعامل
    const booking = await Booking.findById(bookingId).populate({
      path: 'service',
      populate: { path: 'user', model: 'User' } // المستخدم الذي يقدم الخدمة (العامل)
    });

    if (!booking) 
      return res.status(404).json({ message: 'الحجز غير موجود' });

    if (booking.status === 'canceled') 
      return res.status(400).json({ message: 'الحجز ملغى بالفعل' });

    if (booking.status === 'completed') 
      return res.status(400).json({ message: 'لا يمكن إلغاء حجز مكتمل' });

    // تحقق أن المستخدم هو الزبون أو العامل (من خلال service.user)
    const workerId = booking.service?.user?._id?.toString(); // التحقق الآمن
    if (booking.customer.toString() !== userId && workerId !== userId) {
      return res.status(403).json({ message: 'غير مصرح لك بإلغاء هذا الحجز' });
    }

    booking.status = 'canceled';
    await booking.save();

    res.status(200).json({ message: 'تم إلغاء الحجز بنجاح' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إلغاء الحجز', error: error.message });
  }
};

// حذف الحجز (مسموح فقط قبل أن يبدأ)


export const deleteBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    // التحقق من وجود توكن المصادقة
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "رمز المصادقة مفقود أو غير صالح" });
    }

    // استخراج والتحقق من التوكن
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { id: userId, role: userRole } = decoded;

    // البحث عن الحجز
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "الحجز غير موجود" });
    }

    // التحقق من حالة الحجز (يجب أن يكون قيد الانتظار فقط للحذف)
    if (booking.status !== "pending") {
      return res.status(403).json({ message: "لا يمكن حذف الحجز بعد بدء المعالجة" });
    }

    // التحقق من صلاحية المستخدم (مالك الحجز أو مسؤول)
    if (booking.customer.toString() !== userId && userRole !== "admin") {
      return res.status(403).json({ message: "ليس لديك صلاحية حذف هذا الحجز" });
    }

    // حذف الحجز
    await booking.deleteOne();

    res.status(200).json({ message: "تم حذف الحجز بنجاح" });

  } catch (error) {
    res.status(500).json({ message: "حدث خطأ أثناء حذف الحجز", error: error.message });
  }
};

// ==============  للادمين للداشبورد ==============

export const getBookingsOfWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    const bookings = await Booking.find()
      .populate({
        path: 'service',
        match: { User: workerId },
        select: 'title startingPrice'
      })
      .populate('customer', 'name email')
      .sort({ bookingDate: -1 });

    const filteredBookings = bookings.filter(b => b.service !== null);

    res.status(200).json(filteredBookings);
  } catch (err) {
    res.status(500).json({ message: 'فشل في جلب الحجوزات للعامل', error: err.message });
  }
};

export const getBookingsOfWorkerAndStatus = async (req, res) => {
  try {
    const { workerId, status } = req.params;

    const bookings = await Booking.find({ status })
      .populate({
        path: 'service',
        match: { User: workerId },
        select: 'title startingPrice'
      })
      .populate('customer', 'name email');

    const filteredBookings = bookings.filter(b => b.service !== null);

    res.status(200).json(filteredBookings);
  } catch (err) {
    res.status(500).json({ message: 'فشل في جلب الحجوزات حسب الحالة', error: err.message });
  }
};

// 2. جلب إحصائيات عدد الحجوزات حسب الحالة للعامل
export const getStatsOfWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    const bookings = await Booking.find()
      .populate({
        path: 'service',
        match: { User: workerId },
        select: '_id'
      });

    const filtered = bookings.filter(b => b.service !== null);

    const total = filtered.length;
    const pending = filtered.filter(b => b.status === 'pending').length;
    const accepted = filtered.filter(b => b.status === 'accepted').length;
    const done = filtered.filter(b => b.status === 'done').length;

    res.status(200).json({ total, pending, accepted, done });
  } catch (err) {
    res.status(500).json({ message: 'فشل في جلب الإحصائيات', error: err.message });
  }
};

// 3. جلب التقييمات التي حصل عليها العامل
export const getReviewsOfWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    const bookings = await Booking.find({ review: { $ne: null } })
      .populate({
        path: 'service',
        match: { User: workerId },
        select: '_id'
      })
      .populate('customer', 'name');

    const filtered = bookings.filter(b => b.service !== null);

    const reviews = filtered.map(b => ({
      rating: b.rating,
      review: b.review,
      customer: b.customer?.name || 'زبون'
    }));

    res.status(200).json(reviews);
  } catch (err) {
    res.status(500).json({ message: 'فشل في جلب التقييمات', error: err.message });
  }
};


// رد العامل على الحجز: قبول أو رفض الحجز (تغيير الحالة)

export const respondToBooking = async (req, res) => {
  try {
    const userId = req.user.id; // هوية المستخدم من التوكن
    const bookingId = req.params.id;
    const { action } = req.body; // 'accept' أو 'reject'

    // جلب الحجز مع بيانات الخدمة (للوصول لصاحب الخدمة)
    const booking = await Booking.findById(bookingId).populate('service');

    if (!booking) 
      return res.status(404).json({ message: "الحجز غير موجود" });

    // تحقق أن الشخص الذي يرد هو صاحب الخدمة (المستخدم المرتبط بحقل User في الـ service)
    if (!booking.service || booking.service.User.toString() !== userId) {
      return res.status(403).json({ message: "ليست لديك صلاحية الرد على هذا الحجز" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({ message: "تم معالجة هذا الحجز بالفعل" });
    }

    if (action === "accept") {
      booking.status = "accepted";
    } else if (action === "reject") {
      booking.status = "rejected";
    } else {
      return res.status(400).json({ message: "الإجراء غير صالح" });
    }

    await booking.save();

    res.status(200).json({ message: `تم ${booking.status === 'accepted' ? 'قبول' : 'رفض'} الحجز` });

  } catch (error) {
    res.status(500).json({ message: "فشل في الرد على الحجز", error: error.message });
  }
};
 
//تاكيد الحجز من الايمايل (مسييتهاش )


export const sendBookingConfirmationEmail = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // جلب الحجز مع بيانات الخدمة والزبون
    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('customer', 'email');

    if (!booking) {
      return res.status(404).json({ message: 'الحجز غير موجود' });
    }

    const serviceTitle = booking.service?.title || 'خدمة غير معروفة';
    
    const bookingDate = new Date(booking.bookingDate);
    const dateStr = bookingDate.toLocaleDateString('ar-EG');
    const timeStr = bookingDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const message = `
      شكراً لحجزك معنا!
      تفاصيل الحجز:
      - الخدمة: ${serviceTitle}
      - التاريخ: ${dateStr}
      - الوقت: ${timeStr}
      - الموقع: ${booking.location || 'غير محدد'}
    `;

    // استخراج البريد الإلكتروني من الزبون
    const customerEmail = booking.customer.email;

    await sendEmail({
      to: customerEmail,
      subject: 'تأكيد الحجز',
      text: message,
    });

    res.status(200).json({ message: 'تم إرسال تأكيد الحجز عبر البريد الإلكتروني' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء إرسال البريد الإلكتروني', error: error.message });
  }
};


export const getBookingsByUser = async (req, res) => {
  try {
    const userId = req.params.userId;

    // جلب الخدمات التي يملكها هذا المستخدم (العامل)
    const services = await Service.find({ User: userId }).select('_id');
    const serviceIds = services.map(service => service._id);

    // جلب الحجوزات التي إما:
    // - قام بها المستخدم (زبون)، أو
    // - تخص خدمات أنشأها المستخدم (عامل)
    const bookings = await Booking.find({
      $or: [
        { customer: userId },
        { service: { $in: serviceIds } }
      ]
    })
      .populate('customer', 'name email')
      .populate({
        path: 'service',
        select: 'title category User',
        populate: { path: 'User', select: 'name email' }
      });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({
      message: 'حدث خطأ أثناء جلب الحجوزات',
      error: error.message
    });
  }
};

 export const getWorkerDashboardStats = async (req, res) => {
  const workerId = req.user.id;

  try {
    // جلب كل الخدمات التي يملكها العامل
    const services = await Service.find({ User: workerId }).select('_id');
    const serviceIds = services.map(s => s._id);

    // حساب عدد الحجوزات المرتبطة بهذه الخدمات حسب الحالة
    const totalBookings = await Booking.countDocuments({ service: { $in: serviceIds } });
    const completedBookings = await Booking.countDocuments({ service: { $in: serviceIds }, status: 'completed' });
    const cancelledBookings = await Booking.countDocuments({ service: { $in: serviceIds }, status: 'canceled' });
    const pendingBookings = await Booking.countDocuments({ service: { $in: serviceIds }, status: 'pending' });
    const confirmedBookings = await Booking.countDocuments({ service: { $in: serviceIds }, status: 'confirmed' }); // ✅ أُضيفت هذه السطر

    res.status(200).json({
      total: totalBookings,
      completed: completedBookings,
      cancelled: cancelledBookings,
      pending: pendingBookings,
      confirmed: confirmedBookings, // ✅ أُضيفت هذه السطر
    });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب الإحصائيات', error: error.message });
  }
};

 export const filterWorkerReviewsByRating = async (req, res) => {
  const workerId = req.user.id;
  const ratingFilter = parseInt(req.query.rating);

  try {
    // جلب خدمات العامل
    const services = await Service.find({ User: workerId }).select('_id');
    const serviceIds = services.map(s => s._id);

    // جلب الحجوزات التي تخص خدمات العامل وتحمل تقييم مطابق للفلتر
    const bookingsWithRating = await Booking.find({
      service: { $in: serviceIds },
      rating: ratingFilter,
      review: { $exists: true, $ne: null }, // فقط التي تحتوي على تقييم وتعليق
    }).select('review rating');

    // استخراج المراجعات فقط
    const filteredReviews = bookingsWithRating.map(b => ({
      rating: b.rating,
      review: b.review
    }));

    res.status(200).json(filteredReviews);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء جلب التقييمات', error: error.message });
  }
};


export const getWorkerBookingCountsByMonth = async (req, res) => {
  const workerId = req.user.id;

  try {
    const bookings = await Booking.aggregate([
      // أولاً نجلب الحجوزات ونعمل lookup لجلب بيانات الخدمة
      {
        $lookup: {
          from: 'services', // اسم مجموعة الخدمات في MongoDB (جمع الحروف صغير)
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData',
        },
      },
      // تفكيك المصفوفة الناتجة من الlookup (لأنه مفترض تكون عنصر واحد)
      { $unwind: '$serviceData' },

      // فلترة الحجوزات التي تخص خدمات العامل
      { $match: { 'serviceData.User': new mongoose.Types.ObjectId(workerId) } },

      // تجميع حسب شهر تاريخ الحجز (bookingDate)
      {
        $group: {
          _id: { $month: '$bookingDate' },
          count: { $sum: 1 },
        },
      },

      // ترتيب حسب الشهر تصاعدياً
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء حساب الإحصائيات الشهرية', error: error.message });
  }
};