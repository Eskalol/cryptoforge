import mongoose, { Schema } from 'mongoose';
import OrganizationUser from './organization';


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

minerSchema.query.filterUser = function (user) {
  return this.find({ })
  // return OrganizationUser.find({ user: user._id })
  //   .then(orgusers => this.find(
  //     { organization: { $in: orgusers.map(orguser => orguser.organization) } },
  //   ));
};

// minerSchema.query.filterUserInOrganization = (user, organization) => this.filterUser(user)
//   .then(() => this.find({ organization }));
export default mongoose.model('Miner', minerSchema);
