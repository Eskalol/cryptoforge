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
          organization: organization1
        }).save())
        .then(() => new OrganizationUser({
          user: user1,
          organization: organization3
        }).save())
        .then(() => new OrganizationUser({
          user: user2,
          organization: organization1
        }).save())
        .then(() => new OrganizationUser({
          user: user2,
          organization: organization2
        }))
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
        .then(() => User.remove())
        .then(() => Miner.remove())
    });

    describe('filterUser', () => {
      it('should print lol', () => {
        return Miner.find().exec()
          .then(miners => {
            console.log(miners);
          });

      });
      it('should only contain miners that user have access to', () => {

        return Miner.find().filterUser(user1).exec()
          .then(miners => {
            console.log(miners);
            // let minerNames = miners.map(miner => miner.name);
            // expect(minerNames).assert.includeMembers(minerNames, ['Miner 1', 'Miner 3']);
          });
      });
    });
  });
});
