
import dotenv from "dotenv"
dotenv.config();
// تكوين SMTP باستخدام Gmail (أو أي خدمة بريد أخرى)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // البريد الإلكتروني المرسل
    pass: process.env.EMAIL_PASS, // استخدمي كلمة مرور التطبيقات من Google
  },
});

// دالة لإرسال الإشعارات عبر البريد الإلكتروني
import nodemailer from 'nodemailer';

export const sendEmail = async ({ to, subject, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: `"Service Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text
    });

    console.log('✅ Email sent successfully');
  } catch (error) {
    console.error('❌ فشل إرسال البريد:', error);
    throw error;
  }
};
export default sendEmail;