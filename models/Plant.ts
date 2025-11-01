import mongoose, { Schema, Document } from 'mongoose';

export interface IPlant extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  scientificName?: string;
  description: string;
  imageURL: string;
  type: string;
  maintenanceLevel: string;
  tradeStatus: 'available' | 'pending' | 'traded';
  likedBy: mongoose.Types.ObjectId[];
  nativeRegion?: string;
  careTips?: string;
}

const PlantSchema: Schema = new Schema({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  scientificName: {
    type: String,
  },
  description: {
    type: String,
    required: true,
  },
  imageURL: {
    type: String,
    default: '/placeholder-plant.jpg',
  },
  type: {
    type: String,
    required: true,
  },
  maintenanceLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  tradeStatus: {
    type: String,
    enum: ['available', 'pending', 'traded'],
    default: 'available',
  },
  likedBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  nativeRegion: {
    type: String,
  },
  careTips: {
    type: String,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Plant || mongoose.model<IPlant>('Plant', PlantSchema);

