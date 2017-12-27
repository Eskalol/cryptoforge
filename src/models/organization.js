import mongoose from 'mongoose';
import OrganizationUser from './organizationUser';


const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  location: String,
  email: String,
  url: String,
});

organizationSchema.methods.userHasAccess = function (user) {
  return OrganizationUser.findOne({ user: user, organization: this._id, invite: false })
    .then(orguser => {
      return !!orguser;
    });
};

organizationSchema.query.filterUserIsPartOf = function (user) {
  return OrganizationUser.find().filterUserIsPartOf(user)
    .then(orgusers => orgusers.map(orguser => orguser.organization))
    .then(orgs => this.find({ _id: { $in: orgs } }));
};

organizationSchema.query.filterUserHasInvite = function (user) {
  return OrganizationUser.find().filterUserHasInvite(user)
    .then(orgusers => orgusers.map(orguser => orguser.organization))
    .then(orgs => this.find({ _id: { $in: orgs } }));
};

export default mongoose.model('Organization', organizationSchema);
