import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // الزبون الذي يقوم بالحجز
    required: true,
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Service", // الخدمة التي تم حجزها، وداخلها بيانات صاحب الخدمة (العامل)
    required: true,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "confirmed", "completed", "canceled"],
    default: "pending",
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
  },
  review: {
    type: String,
    trim: true,
  },
  location: {
    type: String,
    required: true,
  }
}, { timestamps: true });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
