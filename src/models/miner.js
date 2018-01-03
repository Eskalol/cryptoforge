import mongoose, { Schema } from 'mongoose';
import OrganizationUser from './organizationUser';
import Organization from './organization';


export class MinerError extends Error {
  constructor(...args) {
    super(...args);
    this.name = 'Miner Error';
  }
}


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
    required: true,
  },
});

/**
 * Gets all miners which the user has access through organizations
 * @param user
 * @returns {Promise}
 */
minerSchema.query.filterUserHasAccessUser = function (user) {
  return OrganizationUser.find().filterUserIsPartOf(user)
    .then(orgusers => this.find({
      organization: { $in: orgusers.map(orguser => orguser.organization) },
    }));
};

/**
 * Gets all miners which the user has access through an organization
 * @param user
 * @param organizationId
 * @returns {Promise}
 */
minerSchema.query.filterUserHasAccessWithinOrganization = function (user, organizationId) {
  return Organization.findById(organizationId)
    .then(org => org.userHasAccess(user))
    .then((access) => {
      if (!access) {
        throw new MinerError("User does not have access to Miner");
      }
      return this.find({ organization: organizationId });
    })
    .catch(err => {
      throw err;
    });
};

export default mongoose.model('Miner', minerSchema);
