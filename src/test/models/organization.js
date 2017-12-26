import server from '../../index';
import Organization from '../../models/organization';
import OrganizationUser from '../../models/organizationUser';
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

describe('Ornagization model', () => {
  before(() => {
    return Organization.remove();
  });

  beforeEach(() => {
    genOrganization();
  });

  afterEach(() => {
    Organization.remove();
  });

  it('should begin with no organization', () => {
    return expect(Organization.find({}).exec()).to.eventually.have.length(0);
  });

  it('should fail when saving a duplicate organization', () => {
    return expect(organization.save()
      .then(() => {
        const duplicate = genOrganization();
        return duplicate.save();
      })).to.be.rejected;
  });

  it('should fail when saving an organization with already taken name', () => {
    return expect(organization.save()
      .then(() => {
        return new Organization({
          name: 'cool',
          description: 'lol org',
          location: 'Lakselv',
          email: 'imba@example.com',
          url: 'imba.com'
        }).save();
    })).to.be.rejected;
  });

  describe('create organization successfully', () => {
    beforeEach(() => {
      return Organization.remove()
        .then(() => genOrganization().save());
    });

    it('should have created organization', () => {
      return Organization.findById(organization._id)
        .then(org => {
          expect(org.name).to.be.eql('cool');
        });
    });
  });

  describe('#name', () => {
    it('should reject when saving with a blank name', () => {
      organization.name = '';
      return expect(organization.save()).to.be.rejected;
    });

    it('should fail when saving with a null name', () => {
      organization.name = null;
      return expect(organization.save()).to.be.rejected;
    });

    it('should fail when saving without a name', () => {
      organization.name = undefined;
      return expect(organization.save()).to.be.rejected;
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
        return Organization.find().filterUserIsPartOf(user1)
          .then(orgs => orgs.map(org => org._id))
          .then(orgs => {
            assert.include(orgs, organization1._id);
            assert.include(orgs, organization3._id);
            assert.notInclude(orgs, organization2._id);
          });
      });

      it('user should be part of correct organizations, invites are filtered away', () => {
        return Organization.find().filterUserIsPartOf(user2)
          .then(orgs => orgs.map(org => org._id))
          .then(orgs => {
            assert.notInclude(orgs, organization1._id);
            assert.include(orgs, organization2._id);
            assert.notInclude(orgs, organization3._id);
          });
      });
    });

    describe('filterUserHasInvite', () => {
      it('should not contain any invites', () => {
        return Organization.find().filterUserHasInvite(user1)
          .then(orgs => orgs.map(org => org._id))
          .then(orgs => {
            expect(orgs).to.be.empty;
          });
      });

      it('user should have an invite', () => {
        return Organization.find().filterUserHasInvite(user2)
          .then(orgs => orgs.map(org => org._id))
          .then(orgs => {
            assert.include(orgs, organization1._id);
            assert.notInclude(orgs, organization2._id);
            assert.notInclude(orgs, organization3._id);
          });
      });
    });
  });
});
