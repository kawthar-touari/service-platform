import mongoose from 'mongoose';
const BD_URI = 'mongodb+srv://touarikawther37:popopo@service-platform.ud33c.mongodb.net/?retryWrites=true&w=majority&appName=service-platform';
    const connectDB = async () => {
        try {
          await mongoose.connect(BD_URI, { useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          console.log('mongoDB Connected');
        } catch (err) {
            console.error('Dtabase connection error:', err);
            process.exit(1);
        }
    };
    module.exports = connectDB;