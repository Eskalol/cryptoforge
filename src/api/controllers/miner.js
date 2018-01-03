/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /miner/organization/:organizationId   ->  indexMiner
 * POST    /miner/organization/:organizationId   ->  createMiner
 * PUT     /miner/:id                            ->  upsertMiner
 * DELETE  /miner/:id                            ->  destroymMiner
 */

import miner from '../../models/miner';
import {
  respondWithResult,
  handleError,
  handleEntityNotFound,
  removeEntity,
} from './helpers';

// Gets a list of persons within an organization
export function indexMiner(req, res) {
  return miner.find().exec()
    .then(respondWithResult(res))
    .catch(handleError(res));
}

// Creates a miner within an organization
export function createMiner(req, res) {
  return miner.create(req.body)
    .then(respondWithResult(res, 201))
    .catch(handleError(res));
}

// upsert(put) a specific miner
export function upsertMiner(req, res) {
  return miner.findOneAndUpdate({
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

// destroy a specifix miner
export function destroymMiner(req, res) {
  return miner.findById(req.swagger.params.id.value).exec()
    .then(handleEntityNotFound(res))
    .then(removeEntity(res))
    .catch(handleError(res));
}

