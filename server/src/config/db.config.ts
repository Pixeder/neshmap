import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGOOSE_URI;
    
    if (!mongoURI) {
      throw new Error("MONGO_URI is missing in your .env file");
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`MongoDB Connection Error: ${error.message}`);
    } else {
      console.error('An unknown error occurred during MongoDB connection');
    }
    // Exit process with failure so the server doesn't run without a database
    process.exit(1);
  }
};

export default connectDB;