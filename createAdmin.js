import User from './models/User.js';

export const createAdminUser = async () => {
  const existingAdmin = await User.findOne({ isAdmin: true });

  if (existingAdmin) {
    console.log('⚠️ Admin already exists.');
    return;
  }

  const admin = new User({
    fullName: 'FIXED',
    email: 'kawthargrace@gmail.com',
    password: 'admin123', // ستُشفّر تلقائيًا
    phone: '0773315334',
    isAdmin: true,
    isVerified: true,
  });

  await admin.save();
  console.log('✅ Admin created successfully!');
};