import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { type } from 'os';

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    resetPasswordToken: {type: String},
    resetPasswordExpires : {type : Date},
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false }, // حالة التحقق من البريد الإلكتروني
    otp: { type: String }, 
    isAdmin: { type: Boolean, default: false }, 
    otpExpiration: { type: Date }, 
    nationalId: {
  type: String,
  required: false,

  validate: {
    validator: function (v) {
      return !v || /^\d{1,14}$/.test(v);
    },
    message: 'The National Identification Number must contain only numbers and not exceed 14 digits.',
  },},
    phone: { type: String, required: true, unique: true, match: /^[0-9]{10}$/ },
    profileImage: { type: String } // رابط الصورة الشخصية
}, { timestamps: true });



// تشفير كلمة المرور قبل الحفظ
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// دالة لمقارنة كلمة المرور عند تسجيل الدخول
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;