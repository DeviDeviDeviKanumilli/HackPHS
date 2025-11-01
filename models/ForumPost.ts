import mongoose, { Schema, Document } from 'mongoose';

export interface IForumPost extends Document {
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  category: string;
  replies: Array<{
    userId: mongoose.Types.ObjectId;
    content: string;
    timestamp: Date;
  }>;
  timestamp: Date;
}

const ForumPostSchema: Schema = new Schema({
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['general', 'trading-tips', 'care-advice', 'community'],
    default: 'general',
  },
  replies: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ForumPost || mongoose.model<IForumPost>('ForumPost', ForumPostSchema);

