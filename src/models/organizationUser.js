import mongoose, { Schema } from 'mongoose';

const organizationUserSchema = new mongoose.Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  role: {
    type: String,
    default: 'org_user',
  },
  invite: {
    type: Boolean,
    default: true,
  },
});

organizationUserSchema.query.filterUserIsPartOf = function (user) {
  return this.find({ user: user._id, invite: false });
};

organizationUserSchema.query.filterUserHasInvite = function (user) {
  return this.find({ user: user._id, invite: true });
};

organizationUserSchema.index({ user: 1, organization: 1 }, { unique: true });
export default mongoose.model('OrganizationUser', organizationUserSchema);
