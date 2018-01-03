/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /miner/organization/:organizationId   ->  indexMiner
 * POST    /miner/organization/:organizationId   ->  createMiner
 * PUT     /miner/:id                            ->  upsertMiner
 * DELETE  /miner/:id                            ->  destroymMiner
 */

import Miner from '../../models/miner';
import Organization from '../../models/organization';
import {
  respondWithResult,
  handleError,
  handleEntityNotFound,
  removeEntity,
} from './helpers';

// Gets a list of persons within an organization
export function indexMiner(req, res) {
  return Miner.find({}, '_id name description location')
    .filterUserHasAccessWithinOrganization(req.user, req.swagger.params.organizationId.value)
    .then(respondWithResult(res))
    .catch(err => {
      if (err.name === 'Miner Error') {
        res.status(403).json({ message: 'User does not have access to organization'});
      } else {
        res.status(404).json({ message: 'Organizatin not found'});
      }
    });
}

// Creates a miner within an organization
export async function createMiner(req, res) {
  const organization = await Organization.findById(req.swagger.params.organizationId.value).catch(() => null);

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found'});
  } else if (!await organization.userHasAccess(req.user)) {
    return res.status(403).json({ message: 'User does not have access to organization'});
  }
  return Miner.create({ ...req.body, organization: organization._id })
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// upsert(put) a specific miner
export async function upsertMiner(req, res) {
  const miner = await Miner.findById(req.swagger.params.id.value).catch(() => null);

  if (!miner) {
    return res.status(404).json({ message: 'Miner not found'});
  }
  const organization = await Organization.findById(miner.organization).catch(() => null);

  if (!await organization.userHasAccess(req.user)) {
    // protecting against brute force of miner ids
    return res.status(404).json({ message: 'Miner not found'});
  }
  return miner.update({ ...req.body, organization: organization._id })
    .then(respondWithResult(res, 200))
    .catch(handleError(res));
}

// destroy a specifix miner
export async function destroyMiner(req, res) {
  const miner = await Miner.findById(req.swagger.params.id.value).catch(() => null);
  console.log('WTF!!!');
  if (!miner) {
    return res.status(404).json({ message: 'Miner not found'});
  }
  const organization = await Organization.findById(miner.organization).catch(() => null);

  if (!await organization.userHasAccess(req.user)) {
    return res.status(404).json({ message: 'Miner not found'});
  }
  return miner.remove()
    .then(() => {
      return res.status(200).json({ message: 'Miner removed' });
    })
    .catch(handleError(res));
}

