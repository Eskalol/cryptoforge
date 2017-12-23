import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  location: String,
  email: String,
  url: String
});

export default mongoose.model('Organization', organizationSchema);
