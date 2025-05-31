import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/emailService.js';

export const forgetPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user with this email' });
    }

    // إنشاء توكن JWT صالح لمدة 15 دقيقة
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });

    // تحديث بيانات المستخدم
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 دقيقة
    await user.save();

    // رابط إعادة التعيين
    const resetLink = `http://localhost:3000/reset-password/${token}`; // عدّله حسب الفرونت

    // إرسال الإيميل
    await sendEmail(user.email, 'Password Reset', `
      Click the link below to reset your password:
      ${resetLink}
    `);

    res.status(200).json({ message: 'Password reset link sent to email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending reset link', error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    // تحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // إعادة تعيين كلمة السر
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();
    res.status(200).json({ message: 'Password reset successful' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error resetting password', error: err.message });
  }
};