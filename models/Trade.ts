import mongoose, { Schema, Document } from 'mongoose';

export interface ITrade extends Document {
  ownerId: mongoose.Types.ObjectId;
  offeredItem: string;
  requestedItem: string;
  offeredPlantId?: mongoose.Types.ObjectId;
  requestedPlantId?: mongoose.Types.ObjectId;
  locationZip: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: 'active' | 'pending' | 'completed' | 'cancelled';
  createdAt: Date;
}

const TradeSchema: Schema = new Schema({
  ownerId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  offeredItem: {
    type: String,
    required: true,
  },
  requestedItem: {
    type: String,
    required: true,
  },
  offeredPlantId: {
    type: Schema.Types.ObjectId,
    ref: 'Plant',
  },
  requestedPlantId: {
    type: Schema.Types.ObjectId,
    ref: 'Plant',
  },
  locationZip: {
    type: String,
    required: true,
  },
  coordinates: {
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'completed', 'cancelled'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Trade || mongoose.model<ITrade>('Trade', TradeSchema);

