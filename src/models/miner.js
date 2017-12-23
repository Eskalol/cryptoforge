import mongoose, { Schema } from 'mongoose';

const minerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  location: String,
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'organization',
  },
});

export default mongoose.model('Miner', minerSchema);
