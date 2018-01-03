/**
 * Populate DB with sample data, to Disable edit config/environment/index.js,
 * and set 'seedDB: false'
 */

import User from '../models/user';
import Organization from '../models/organization';
import OrganizationUser from '../models/organizationUser';
import Miner from '../models/miner';
import config from './environment/';

const generateUsers = () => User.find({}).remove()
  .then(() => User.create({
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    password: 'admin',
    provider: 'local',
  }, {
    name: 'Test',
    email: 'test@example.com',
    role: 'user',
    password: 'test',
    provider: 'local',
  }));

const generateOrganizations = () => Organization.find({}).remove()
  .then(() => Organization.create({
    name: 'black rock mining',
    description: 'Make ironforge great again',
    location: 'Azeroth',
    email: 'mail@ironforge.example.com',
    url: 'theforge.example.com',
  }, {
    name: 'Eska Mining',
    description: 'the mest miners',
    location: 'Karasjok',
    email: 'lol@eska.no',
    url: 'eska.no',
  }, {
    name: 'Awesome mining',
    description: 'this is just awesome',
    location: 'imaginationland',
    email: 'hello@example.com',
    url: 'example.com',
  }, {
    name: 'secret organization',
    description: 'this is top secret',
    location: 'N/A',
    email: 'N/A',
    url: 'example@example.com',
  }));

const generateOrganizationUsers = async () => {
  const user = await User.findOne({ email: 'test@example.com' }).exec();
  const org1 = await Organization.findOne({ name: 'black rock mining' });
  const org2 = await Organization.findOne({ name: 'Eska Mining' });
  const org3 = await Organization.findOne({ name: 'secret organization' });
  return OrganizationUser.find({}).remove()
    .then(() => OrganizationUser.create({
      user: user._id,
      organization: org1._id,
      invite: false,
    }, {
      user: user._id,
      organization: org2._id,
      invite: false,
    }, {
      user: user._id,
      organization: org3._id,
    }));
};

export default async function seedDB() {
  if (config.seedDB) {
    console.log('*** [SEEDING DB] ***');
    await generateUsers();
    await generateOrganizations();
    await generateOrganizationUsers();
  }
}
