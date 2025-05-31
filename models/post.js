import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, trim: true }, // وصف الخدمة المطلوبة
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Post', postSchema);