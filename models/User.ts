import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  joinDate: Date;
  bio?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  plants: mongoose.Types.ObjectId[];
  tradesCompleted: number;
  locationZip?: string;
}

const UserSchema: Schema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  joinDate: {
    type: Date,
    default: Date.now,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  plants: [{
    type: Schema.Types.ObjectId,
    ref: 'Plant',
  }],
  tradesCompleted: {
    type: Number,
    default: 0,
  },
  locationZip: {
    type: String,
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

