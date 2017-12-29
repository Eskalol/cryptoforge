import should from 'should';
import request from 'supertest';
import server from '../../index';
import Organization from '../../models/organization';
import User from '../../models/user';
import OrganizationUser from '../../models/organizationUser';


let user, token;
const genUser = () => {
  user = new User({
    name: 'Fake User',
    email: 'test@example.com',
    password: 'password',
    provider: 'local',
    role: 'user'
  });
  return user;
};

const auth = () => {
  return request(server)
    .post('/auth/login')
    .send({
      email: 'test@example.com',
      password: 'password'
    }).then(res => {
      token = res.body.token;
      return token;
    });
};


describe('controllers', () => {
  describe('organization', () => {
    let organization1;
    let organization2;
    let organization3;
    let organization4;

    before(() => {
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
      organization4 = new Organization({
        name: 'org4',
        description: 'awesome organization',
        location: 'Karasjok',
        email: 'cool@example.com',
        url: 'lol.com'
      });

      return User.remove()
        .then(() => Organization.remove())
        .then(() => OrganizationUser.remove())
        .then(() => genUser().save())
        .then(() => organization1.save())
        .then(org => organization1 = org)
        .then(() => organization2.save())
        .then(org => organization2 = org)
        .then(() => organization3.save())
        .then(org => organization3 = org)
        .then(() => organization4.save())
        .then(org => organization4 = org)
        .then(() => new OrganizationUser({
          user: user,
          organization: organization1,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user,
          organization: organization2,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user,
          organization: organization3,
          invite: true
        }).save())
        .then(() => auth());
    });

    after(() => {
      return OrganizationUser.remove()
        .then(() => User.remove())
        .then(() => Organization.remove());
    });

    describe('GET /organization', () => {
      it('should return a list with organizations', (done) => {
        request(server)
          .get('/organization')
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Array);
            res.body.should.have.length(2);
            const orgNames = res.body.map(org => org.name);
            assert.include(orgNames, 'org1');
            assert.include(orgNames, 'org2');
            assert.notInclude(orgNames, 'org3');
            assert.notInclude(orgNames, 'org4');
            done();
          });
      });
      it('it should not be authenticated', done => {
        request(server)
          .get('/organization')
          .expect(401)
          .end(done);
      });
    });

    describe('POST /organization', () => {
      let orgId;

      it('should create a organization', (done) => {
        request(server)
          .post('/organization')
          .set('authorization', `${token}`)
          .send({
            name: 'SuperCool'
          })
          .expect(201)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.name.should.eql('SuperCool');
            orgId = res.body._id;
            done();
          });
      });

      it('it should have created an organization and added user permission', (done) => {
        request(server)
          .get(`/organization/${orgId}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.name.should.be.eql('SuperCool');
            done();
          });
      });
    });

    describe('GET /organization/:id', () => {
      it('should return the correct organization', (done) => {
        request(server)
          .get(`/organization/${organization1._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.name.should.be.eql('org1');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .get(`/organization/${organization1._id}`)
          .expect(401)
          .end(done);
      });

      it('should not have access to organization where invite is not accepted', done => {
        request(server)
          .get(`/organization/${organization3._id}`)
          .set('authorization', `${token}`)
          .expect(404)
          .end(done);
      });

      it('should not have access to organization which user is not part of', done => {
        request(server)
          .get(`/organization/${organization4._id}`)
          .set('authorization', `${token}`)
          .expect(404)
          .end(done);
      });
    });

    describe('PUT /organization/:id', () => {
      it('should update a organization', (done) => {
        done();
      });
    });
  });
});
