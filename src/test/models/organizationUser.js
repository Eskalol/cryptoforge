import server from '../../index';
import OrganizationUser from '../../models/organizationUser';
import Organization from '../../models/organization';
import User from '../../models/user';


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
  return organizationUser;
};

describe('OrganizationUser model', () => {
  before(() => {
    return Organization.remove()
      .then(() => User.remove())
      .then(() => OrganizationUser.remove());
  });

  beforeEach(() => {
    genOrganization();
    genUser();
  });

  afterEach(() => {
    return Organization.remove()
      .then(() => User.remove())
      .then(() => OrganizationUser.remove());
  });

  it('should begin with no organizationUser', () => {
    return expect(OrganizationUser.find({}).exec()).to.eventually.have.length(0);
  });

  describe('#user', () => {
    beforeEach(() => {
      return organization.save();
    });

    it('should fail when saving with a null user', () => {
      genOrganizationUser(null, organization);
      return expect(organizationUser.save()).to.be.rejected;
    });

    it('should fail when saving without a user', () => {
      genOrganizationUser(undefined, organization);
      return expect(organizationUser.save()).to.be.rejected;
    });
  });

  describe('#organization', () => {
    beforeEach(() => {
      return user.save();
    });

    it('should fail when saving with a null organization', () => {
      genOrganizationUser(user, null);
      return expect(organizationUser.save()).to.be.rejected;
    });

    it('should fail when saving without a organization', () => {
      genOrganizationUser(user, undefined);
      return expect(organizationUser.save()).to.be.rejected;
    });
  });

  describe('#user, #organization unique together', () => {
    beforeEach(() => {
      return user.save()
        .then(() => organization.save());
    });

    it('should fail when user is added to the same organization twice', () => {
      return expect(organizationUser.save()
        .then(() => organizationUser.save())).to.be.rejected;
    });
  });

  describe('Should create organizationUser', () => {
    beforeEach(() => {
      return user.save()
        .then(() => organization.save())
        .then(() => genOrganizationUser(user, organization).save());
    });

    it('should have saved organization user', () => {
      return OrganizationUser.findById(organizationUser._id)
        .then(orgUser => {
          expect(orgUser.user).to.be.eql(user._id);
          expect(orgUser.organization).to.be.eql(organization._id);
        });
    });
  });
});
