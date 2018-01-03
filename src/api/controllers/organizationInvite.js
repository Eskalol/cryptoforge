/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /organization/invite                          ->  indexInvites
 * POST    /organization/invite                          ->  createInvite
 * GET     /organization/invite/:organizationId/accept   ->  acceptInvite
 * DELETE  /organization/invite/:organizationId          ->  destroy
 */

import OrganizationUser, { OrganizationUserError } from '../../models/organizationUser';
import Organization from '../../models/organization';
import User from '../../models/user';
import {
  respondWithResult,
  handleError,
  handleEntityNotFound,
  removeEntity,
} from './helpers';

// Gets a list of all invitations
export function indexInvites(req, res) {
  return Organization.find({}, '_id name').filterUserHasInvite(req.user)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates an invitation
export async function createInvite(req, res) {
  const organization = await Organization.findById(req.body.organization).catch(() => null);
  if (!organization || !await organization.userHasAccess(req.user)) {
    return res.status(403).json(
      { message: 'Cannot invite to organization: organization does not exists or request user is not part of it' });
  }
  const user = await User.findOne({email: req.body.email});
  if (!user) {
    return res.status(404).json(
      { message: `User with email: ${req.body.email} does not exists` }
    );
  }
  return new OrganizationUser({
    organization: organization,
    user: user
    }).save()
    .then(() => {
      return res.status(201).json({message: `Invitation sent to ${req.body.email}`});
    })
    .catch(err => {
      if (err.name === 'OrganizationUser Error') {
        return res.status(400).json({ message: err.message });
      } else {
        return handleError(res)(err);
      }
    });
}

export function acceptInvite(req, res) {
  return OrganizationUser.findOne({
    organization: req.swagger.params.organizationId.value,
    user: req.user,
    invite: true
  }).then(orguser => {
    if (!orguser) {
      res.status(404).json({ message: 'Invite does not exists' });
    } else {
      orguser.invite = false;
      orguser.save().then(() => {
        res.status(200).json({ message: 'Invite accepted' })
      });
    }
  })
  .catch(handleError(res));
}

// destroy a specifix organizationUser
export function destroyInvite(req, res) {
  return OrganizationUser.findOne({
    organization: req.swagger.params.organizationId.value,
    user: req.user,
    invite: true
  }).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}
