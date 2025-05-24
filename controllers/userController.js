import Booking from '../models/Booking.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../utils/emailService.js';


// إنشاء توكن JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "المستخدم غير موجود" });

    if (user.isVerified) return res.status(400).json({ message: "تم التحقق من الحساب مسبقًا" });

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: "OTP غير صالح أو منتهي الصلاحية" });
    }

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: "تم التحقق من البريد الإلكتروني بنجاح" });
  } catch (error) {
    res.status(500).json({ message: "فشل التحقق", error: error.message });
  }
};

export const registerUser = async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      confirmPassword,
      phone,
      nationalId // اختياري
    } = req.body;

    // تحقق من الحقول الإلزامية
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      return res.status(400).json({ message: 'يرجى ملء جميع الحقول الإلزامية.' });
    }

    // تحقق من تطابق كلمتي المرور
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'كلمتا المرور غير متطابقتين.' });
    }

    // التحقق من وجود المستخدم مسبقًا
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '❌ هذا البريد الإلكتروني مسجل بالفعل.' });
    }

    // إنشاء المستخدم
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      ...(nationalId && { nationalId }) // أضف nationalId فقط إذا تم إرساله
    });

    // توليد OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiration = new Date(Date.now() + 10 * 60 * 1000); // صالح لمدة 10 دقائق
    await user.save();

    // إرسال البريد الإلكتروني
    await sendEmail({
      to: user.email,
      subject: 'مرحبًا بك في خدمتنا',
      text: `مرحبًا ${user.fullName}، تم إنشاء حسابك بنجاح. رمز التحقق (OTP): ${otp}`
    });

    // إرسال الرد
    res.status(201).json({
      message: '✅ تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني.',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        token: generateToken(user._id)
      }
    });

  } catch (error) {
    res.status(500).json({ message: '❌ حدث خطأ أثناء التسجيل.', error: error.message });
  }
};



// تسجيل الدخول
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: '❌ User not found.' });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: '❌ Incorrect password.' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

        res.json({
            message: '✅ Login successful.',
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
            }
        });
    } catch (error) {
        res.status(500).json({ message: '❌ An error occurred during login.', error: error.message });
    }
};


// استرجاع جميع المستخدمين (مسار محمي) export const getAllUsers = async (req, res) => {
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password'); // لا نعرض كلمات المرور
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: '❌ An error occurred while fetching users.', error: error.message });
    }
};


// جلب مستخدم واحد حسب ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password'); 
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password'); // لا تُرجع كلمة السر
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
};


// تحديث بيانات المستخدم
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '❌ User not found.' });
    }

  // تحديث البيانات فقط إذا تم إرسالها
    user.fullName = req.body.fullName || user.fullName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.nationalId = req.body.nationalId || user.nationalId;

    const updatedUser = await user.save();
    res.json({ message: '✅ User updated successfully.', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: '❌ An error occurred while updating the user.', error: error.message });
  }
};


// حذف مستخدم
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '❌ User not found.' });
    }

    res.json({ message: '✅ User deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: '❌ An error occurred while deleting the user.', error: error.message });
  }
};



// جلب الحجوزات الخاصة بالعامل مع فلترة الحالة
export const getMyServiceBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    // البحث عن الخدمات التي أنشأها المستخدم الحالي
    const myServices = await Service.find({ createdBy: userId }).select('_id');
    const serviceIds = myServices.map(service => service._id);

    // فلترة اختياري
    const filter = { service: { $in: serviceIds } };
    if (status) filter.status = status;

    // جلب الحجوزات المتعلقة بهذه الخدمات
    const bookings = await Booking.find(filter)
      .populate('customer', 'fullName phone email')
      .populate('service', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (err) {
    res.status(500).json({ message: '❌ Failed to get service bookings.', error: err.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const services = await Service.find({ createdBy: userId }).select('_id');
    const serviceIds = services.map(service => service._id);

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const totalBookings = await Booking.countDocuments({ service: { $in: serviceIds } });

    const completedThisMonth = await Booking.countDocuments({
      service: { $in: serviceIds },
      status: 'done',
      updatedAt: { $gte: startOfCurrentMonth }
    });

    const completedLastMonth = await Booking.countDocuments({
      service: { $in: serviceIds },
      status: 'done',
      updatedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
    });

    const avgRatingAgg = await Booking.aggregate([
      { $match: { service: { $in: serviceIds }, rating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);
    const avgRating = avgRatingAgg.length > 0 ? avgRatingAgg[0].avgRating.toFixed(2) : 0;

    res.status(200).json({
      totalBookings,
      completedThisMonth,
      completedLastMonth,
      difference: completedThisMonth - completedLastMonth,
      avgRating: Number(avgRating)
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get stats', error: err.message });
  }
};

//bah ikhalass
export const updatePaymentInfo = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentDetails } = req.body;// بيانات الدفع (مثلاً رقم حساب بنكي)

    if (!paymentDetails) {
      return res.status(400).json({ message: 'Payment details are required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    user.paymentDetails = paymentDetails;
    await user.save();

    res.status(200).json({
      message: '✅ Payment info updated successfully.',
      paymentDetails: user.paymentDetails
    });
  } catch (err) {
    res.status(500).json({
      message: '❌ Failed to update payment info.',
      error: err.message
    });
  }
};


//نحوس على العامل حسب المهارى او المنطقة
export const searchWorkersByLocation = async (req, res) => {
  try {
    const { skill, lng, lat, radius = 10 } = req.query; // radius بالكيلومتر

    let filter = { status: 'available' };

    if (skill) filter.services = { $regex: skill, $options: 'i' };

    if (lng && lat) {
      filter.location = {
        $geoWithin: {
          $centerSphere: [
            [parseFloat(lng), parseFloat(lat)],
            radius / 6378.1 // تحويل نصف القطر من كم لنصف قطر الأرض بالكيلومتر
          ]
        }
      };
    }

    const services = await Service.find(filter).limit(20);

    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ message: 'Failed to search services', error: err.message });
  }
};

export const getMonthlyEarnings = async (req, res) => {
  try {
    const userId = req.user.id;

    // الخطوة 1: البحث عن الخدمات التي أنشأها المستخدم الحالي
    const services = await Service.find({ createdBy: userId }).select('_id');

    const serviceIds = services.map(service => service._id);

    // الخطوة 2: تجميع الحجوزات لتلك الخدمات
    const earnings = await Booking.aggregate([
      {
        $match: {
          service: { $in: serviceIds },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: { $month: '$updatedAt' },
          totalEarnings: { $sum: '$price' } // بافتراض أن لديك حقل "السعر" في الحجز
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const formattedEarnings = earnings.map(item => ({
      month: item._id,
      totalEarnings: item.totalEarnings
    }));

    res.status(200).json(formattedEarnings);
  } catch (error) {
    console.error('Error calculating monthly earnings:', error);
    res.status(500).json({
      message: 'Error calculating earnings',
      error: error.message
    });
  }
};
// future modefication