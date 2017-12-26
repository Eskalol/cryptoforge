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

  describe('filters', () => {
    let user1;
    let user2;
    let organization1;
    let organization2;
    let organization3;

    beforeEach(() => {
      user1 = new User({
        provider: 'local',
        name: 'Fake User',
        email: 'test1@example.com',
        password: 'password'
      });
      user2 = new User({
        provider: 'local',
        name: 'Fake User2',
        email: 'test2@example.com',
        password: 'password'
      });
      organization1 = new Organization({
        name: 'org1',
        description: 'awesome organization',
        location: 'Karasjok',
        email: 'cool@example.com',
        url: 'lol.com'
      });
      organization2 = new Organization({
        name: 'org2',
        description: 'awesome organization',
        location: 'Karasjok',
        email: 'cool@example.com',
        url: 'lol.com'
      });
      organization3 = new Organization({
        name: 'org3',
        description: 'awesome organization',
        location: 'Karasjok',
        email: 'cool@example.com',
        url: 'lol.com'
      });
      return user1.save()
        .then(user => user1 = user)
        .then(() => user2.save())
        .then(user => user2 = user)
        .then(() => organization1.save())
        .then(org => organization1 = org)
        .then(() => organization2.save())
        .then(org => organization2 = org)
        .then(() => organization3.save())
        .then(org => organization3 = org)
        .then(() => new OrganizationUser({
          user: user1,
          organization: organization1,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user1,
          organization: organization3,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user2,
          organization: organization1,
          invite: true
        }).save())
        .then(() => new OrganizationUser({
          user: user2,
          organization: organization2,
          invite: false
        }).save());
    });

    afterEach(() => {
      return Organization.remove()
        .then(() => OrganizationUser.remove())
        .then(() => User.remove());
    });

    describe('filterUserIsPartOf', () => {
      it('user should be part of correct organizations', () => {
        return OrganizationUser.find().filterUserIsPartOf(user1)
          .then(orgusers => orgusers.map(orguser => orguser.organization))
          .then(orgs => {
            assert.include(orgs, organization1._id);
            assert.include(orgs, organization3._id);
            assert.notInclude(orgs, organization2._id);
          });
      });

      it('user should be part of correct organizations, invites are filtered away', () => {
        return OrganizationUser.find().filterUserIsPartOf(user2)
          .then(orgusers => orgusers.map(orguser => orguser.organization))
          .then(orgs => {
            assert.notInclude(orgs, organization1._id);
            assert.include(orgs, organization2._id);
            assert.notInclude(orgs, organization3._id);
          });
      });
    });

    describe('filterUserHasInvite', () => {
      it('should not contain any invites', () => {
        return OrganizationUser.find().filterUserHasInvite(user1)
          .then(orgusers => orgusers.map(orguser => orguser.organization))
          .then(orgs => {
            expect(orgs).to.be.empty;
          });
      });

      it('user should have an invite', () => {
        return OrganizationUser.find().filterUserHasInvite(user2)
          .then(orgusers => orgusers.map(orguser => orguser.organization))
          .then(orgs => {
            assert.include(orgs, organization1._id);
            assert.notInclude(orgs, organization2._id);
            assert.notInclude(orgs, organization3._id);
          });
      });
    });
  });
});
