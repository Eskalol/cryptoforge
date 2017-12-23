import server from '../../index';
import OrganizationUser from '../../models/organizationUser';

// Write tests for model here

let organization;
const genOrganization = () => {
  organization = new Organization({
    name: 'cool',
    description: 'awesome organization',
    location: 'Karasjok',
    email: 'cool@example.com',
    url: 'lol.com'
  });
  return organization;
};

let user;
const genUser = () => {
  user = new User({
    provider: 'local',
    name: 'Fake User',
    email: 'test@example.com',
    password: 'password'
  });
  return user;
};

let organizationUser;
const genOrganizationUser = (u, org, role) => {
  organizationUser = new OrganizationUser({
    user: u,
    organization: org,
    role: role
  });
};

