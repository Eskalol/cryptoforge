import server from '../../index';
import Miner from '../../models/miner';
import Organization from '../../models/organization';
import User from '../../models/user';
import OrganizationUser from '../../models/organizationUser';


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

let miner;
const genMiner = (org) => {
  miner = new Miner({
    name: 'Miner 1',
    description: 'this is a nvidia miner',
    location: 'Karasjok',
    organization: org
  });
  return miner;
};

describe('Miner model', () => {
  before(() => {
    return Miner.remove()
      .then(() => Organization.remove());
  });

  beforeEach(() => {
    genOrganization();
  });

  afterEach(() => {
    return Organization.remove()
      .then(() => Miner.remove());
  });

  it('should begin with no miners', () => {
    return expect(Miner.find({}).exec()).to.eventually.have.length(0);
  });

  it('should create miner', () => {
    return organization.save()
      .then(org => genMiner(org).save())
      .then(m => {
        expect(m.name).to.be.eql('Miner 1');
      });
  });

  describe('#name', () => {
    before(() => {
      return organization.save()
        .then((org) => genMiner(org));
    });

    it('should reject when saving with a blank name', () => {
      miner.name = '';
      return expect(miner.save()).to.be.rejected;
    });

    it('should fail when saving with a null name', () => {
      miner.name = null;
      return expect(miner.save()).to.be.rejected;
    });

    it('should fail when saving without a name', () => {
      miner.name = undefined;
      return expect(miner.save()).to.be.rejected;
    });

    it('should be an unique name', () => {
      return expect(miner.save()
        .then(() => {
          return Miner({
            name: 'Miner 1',
            description: 'amd miner',
            location: 'Lakselv',
            organization: organization
          }).save();
        })).to.be.rejected;
    });
  });

  describe('filters', () => {
    let user1;
    let user2;
    let organization1;
    let organization2;
    let organization3;
    let miner1;
    let miner2;
    let miner3;

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
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user2,
          organization: organization2,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user1,
          organization: organization2,
          invite: true
        }).save())
        .then(() => new Miner({
          name: 'Miner 1',
          organization: organization1
        }).save())
        .then(miner => miner1 = miner)
        .then(() => new Miner({
          name: 'Miner 2',
          organization: organization2
        }).save())
        .then(miner => miner2 = miner)
        .then(() => new Miner({
          name: 'Miner 3',
          organization: organization3
        }).save())
        .then(miner => miner3 = miner);
    });

    afterEach(() => {
      return Organization.remove()
        .then(() => OrganizationUser.remove())
        .then(() => User.remove())
        .then(() => Miner.remove())
    });

    describe('filterUserHasAccessUser', () => {
      it('should only contain miners that user have access to', async () => {
        const miners1 = await Miner.find().filterUserHasAccessUser(user1)
          .then(miners => miners.map(miner => miner.name));
        const miners2 = await Miner.find().filterUserHasAccessUser(user2)
          .then(miners => miners.map(miner => miner.name));

        assert.include(miners1, miner1.name);
        assert.include(miners1, miner3.name);
        assert.notInclude(miners1, miner2.name);

        assert.include(miners2, miner1.name);
        assert.include(miners2, miner2.name);
        assert.notInclude(miners2, miner3.name);
      });
    });

    describe('filterUserHasAccessWithinOrganization', () => {
      it('should have access to miner in organization', async () => {
        let miners = await Miner.find().filterUserHasAccessWithinOrganization(user1, organization1._id);
        miners = miners.map(miner => miner.name);
        assert.include(miners, 'Miner 1');
        assert.notInclude(miners, 'Miner 2');
        assert.notInclude(miners, 'Miner 3');
      });

      it('should not have access to miners when not part of organization', async () => {
        let miners = await Miner.find().filterUserHasAccessWithinOrganization(user2, organization3._id)
          .catch(() => null);
        assert.isNull(miners);
      });

      it('should not have access to miners when have a pending invite to an organization', async () => {
        let miners = await Miner.find().filterUserHasAccessWithinOrganization(user1, organization2._id)
          .catch(() => null);
        assert.isNull(miners);
      });
    });
  });
});
