import server from '../../index';
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
});
