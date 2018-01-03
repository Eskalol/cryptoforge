import mongoose, { Schema } from 'mongoose';

export class OrganizationUserError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'OrganizationUser Error';
  }
}

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

organizationUserSchema.pre('save', async function (next) {
  if (this.isModified('invite')) {
    return next();
  }
  const orguser = await this.constructor.findOne({
    user: this.user,
    organization: this.organization,
  });

  if (orguser) {
    if (orguser.invite) {
      return next(new OrganizationUserError('User already invited to organization'));
    }
    return next(new OrganizationUserError('User is already member of the organization'));
  }
  return next();
});

organizationUserSchema.query.filterUserIsPartOf = function (user) {
  return this.find({ user: user._id, invite: false });
};

organizationUserSchema.query.filterUserHasInvite = function (user) {
  return this.find({ user: user._id, invite: true });
};

organizationUserSchema.index({ user: 1, organization: 1 }, { unique: true });
export default mongoose.model('OrganizationUser', organizationUserSchema);
