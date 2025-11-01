import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  // Check environment variable at runtime (not module load time)
  const MONGODB_URI = process.env.MONGODB_URI;
  
  if (!MONGODB_URI || MONGODB_URI.trim() === '') {
    const errorMsg = 'MONGODB_URI is not set. Please check your .env.local file. Make sure there are NO spaces after the = sign.';
    console.error('ERROR:', errorMsg);
    throw new Error(errorMsg);
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI.trim(), opts).then((mongoose) => {
      return mongoose;
    }).catch((error) => {
      cached.promise = null;
      console.error('MongoDB connection error:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;

