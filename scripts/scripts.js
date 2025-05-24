//هذا متمشوهش كامل يتمشى مرى و حدة برك كي ندير كونت للادمين

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('تم الاتصال بقاعدة البيانات');

    const existingAdmin = await User.findOne({ isAdmin: true });
    if (existingAdmin) {
      console.log('يوجد بالفعل حساب Admin');
      process.exit();
    }

    const hashedPassword = await bcrypt.hash('admin1234', 10);

    const admin = new User({
      fullName: 'Admin',
      email: 'admin@service.com',
      phone: '0000000000',
      password: hashedPassword,
      isAdmin: true,
    });

    await admin.save();
    console.log('تم إنشاء حساب الـ Admin بنجاح');
    process.exit();
  } catch (error) {
    console.error('حدث خطأ أثناء إنشاء حساب Admin:', error);
    process.exit(1);
  }
};

createAdmin();