/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /organization              ->  index
 * POST    /organization              ->  create
 * GET     /organization/:id          ->  show
 * PUT     /organization/:id          ->  upsert
 */

import Organization from '../../models/organization';
import OrganizationUser from '../../models/organizationUser';
import {
  respondWithResult,
  handleError,
  handleEntityNotFound,
} from './helpers';

// Gets a list of persons
export function indexOrganization(req, res) {
  return Organization.find({}, '_id name description location email url')
    .filterUserIsPartOf(req.user)
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Gets a specific Organization by id
export function showOrganization(req, res) {
  return Organization.findById(
    req.swagger.params.id.value,
    '_id name description location email url',
  ).exec()
    .then(org => org.userHasAccess(req.user._id)
      .then(access => (access ? org : null)))
    .then(handleEntityNotFound(res))
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a Organization
export function createOrganization(req, res) {
  return Organization.create(req.body)
    .then(org => OrganizationUser.create({
      user: req.user,
      organization: org,
      invite: false,
    }).then(() => org))
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// upsert(put) a specific Organization
export function upsertOrganization(req, res) {
  // TODO: fix this some day.
  return Organization.findOneAndUpdate({
    _id: req.swagger.params.id.value,
  },
  req.body,
  {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
    runValidators: true,
  }).exec()
    .then(respondWithResult(res, 200))
    .catch(handleError(res));
}
