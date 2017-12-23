import server from '../../index';
import Miner from '../../models/miner';
import Organization from '../../models/organization';


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
});
