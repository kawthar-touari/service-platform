import mongoose from 'mongoose';


const serviceSchema = new mongoose.Schema({
  User: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, 
  category: { type: String, required: true },
  title: { type: String, required: true }, 
  description: { type: String, required: true }, 
  duration: { type: Number, required: true },
  experienceYears: { type: Number, required: true },
  previousWorkplaces: [String], 
  educationLevel: { type: String, required: true },
  skillLevel: { type: String, required: true },
  startingPrice: { type: Number, required: true }, 
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['available', 'unavailable'], default: 'available' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  ratingsAverage: { type: Number, default: 0 },
  ratingsQuantity: { type: Number, default: 0 },
  bio: { type: String },
  createdByName: { type: String },
createdByEmail: { type: String },
createdByPhone: { type: String },
  services: {
  type: [String],
  default: [],
 files: [
    {
      name: { type: String }, // original filename
      url: { type: String },  // file storage URL or path
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

},
});

serviceSchema.index({ location: '2dsphere' });

export default mongoose.model('Service', serviceSchema);
