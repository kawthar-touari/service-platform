import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose' ;
import userRoutes from './routes/userRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import http from "http";
import jwt from 'jsonwebtoken';
import {Server} from "socket.io";
import { protect } from './middleware/authMiddleware.js';
import userDashboardRoutes from './routes/userDashboard.js';
import postRoutes from './routes/postRoutes.js';
import messageRoutes from  './routes/messageRoutes.js';
import { createAdminUser } from './createAdmin.js';

const app = express();

import cors from 'cors';

app.use(cors()); // ✅ تمكين CORS

// السماح بقراءة بيانات JSON من الطلبات
app.use(express.json());
 
app.use('/api/users', userRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/worker", bookingRoutes);
app.use("/api/worker-dashboard", userDashboardRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);

// تحميل المتغيرات البيئية
dotenv.config();

// ربط قواعد البيانات
mongoose.connect(process.env.BD_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 500000
}).then(() => {  createAdminUser(); 
  console.log("✅kawthar MongoDB Connected");
})
.catch(error => console.error("❌ Database Connection Error:", error));
// إنشاء مستخدم أدمن تلقائيًا عند تشغيل السيرفر


app.get("/api/test", (req, res) => {
res.status(200).json({ message: "✅ Server is running!" });
});

 // إنشاء السيرفر باستخدام HTTP
const server = http.createServer(app);

// إعداد Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("bookingUpdate", (data) => {
    io.emit("updateBooking", data);
  });
});


io.on("connection", (socket) => {
  console.log("⚡ عميل متصل:", socket.id);

  socket.on("disconnect", () => {
    console.log("❌ عميل قطع الاتصال");
  });
    });


    // مسار GET لعرض نموذج التسجيل (مثال)
app.get('/register', (req, res) => {
  res.send('This is the registration page');
  
});

// تشغيل السيرفر
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log("🚀 Server running on port" ,{PORT});
});