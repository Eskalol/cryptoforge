import should from 'should';
import request from 'supertest';
import server from '../../index';
import Miner from '../../models/miner';
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
  describe('miner', () => {
    let organization1;
    let organization2;
    let organization3;
    let miner1;
    let miner2;
    let miner3;
    let miner4;

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

      return User.remove()
        .then(() => Miner.remove())
        .then(() => Organization.remove())
        .then(() => OrganizationUser.remove())
        .then(() => genUser().save())
        .then(() => organization1.save())
        .then(org => organization1 = org)
        .then(() => organization2.save())
        .then(org => organization2 = org)
        .then(() => organization3.save())
        .then(org => organization3 = org)
        .then(() => new OrganizationUser({
          user: user,
          organization: organization1,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: user,
          organization: organization2,
          invite: true
        }).save())
        .then(() => new Miner({
          name: 'nvidia miner 1',
          organization: organization1,
          description: '8x1080ti',
          location: 'Karasjok'
        }).save())
        .then(miner => miner1 = miner)
        .then(() => new Miner({
          name: 'nvidia miner 2',
          organization: organization1,
          description: '12x1070',
          location: 'Karasjok'
        }).save())
        .then(miner => miner2 = miner)
        .then(() => new Miner({
          name: 'nvidia miner 3',
          organization: organization2,
          description: '12x1060',
          location: 'Karasjok'
        }).save())
        .then(miner => miner3 = miner)
        .then(() => new Miner({
          name: 'RX miner',
          organization: organization3,
          description: '12xRX570',
          location: 'Oslo'
        }).save())
        .then(miner => miner4 = miner)
        .then(() => auth());
    });

    after(() => {
      return OrganizationUser.remove()
        .then(() => User.remove())
        .then(() => Miner.remove())
        .then(() => Organization.remove());
    });

    describe('GET /miner/organization/:organizationId', () => {
      it('should return a list with miners', (done) => {
        request(server)
          .get(`/miner/organization/${organization1._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Array);
            res.body.should.have.length(2);
            const minerNames = res.body.map(miner => miner.name);
            assert.include(minerNames, 'nvidia miner 1');
            assert.include(minerNames, 'nvidia miner 2');
            assert.notInclude(minerNames, 'RX miner');
            assert.notInclude(minerNames, 'nvidia miner 3');
            done();
          });
      });

      it('should be 403 when user has an invite to the organization', done => {
        request(server)
          .get(`/miner/organization/${organization2._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('User does not have access to organization');
            done();
          });
      });

      it('should be 403 when user is not part of the organization', done => {
        request(server)
          .get(`/miner/organization/${organization3._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('User does not have access to organization');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .get(`/miner/organization/${organization1._id}`)
          .expect(401)
          .end(done);
      });
    });

    describe('POST /miner/organization-:organizationId', () => {
      it('should create a miner', (done) => {
        request(server)
          .post(`/miner/organization/${organization1._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.name.should.equal('Cool miner');
            done();
          });
      });

      it('should not be able to create a miner for an organization which does not exists', done => {
        request(server)
          .post('/miner/organization/abc')
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('Organization not found');
            done();
          });
      });

      it('should not be able to create a miner for an organization where user have been invited to', done => {
        request(server)
          .post(`/miner/organization/${organization2._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('User does not have access to organization');
            done();
          });
      });

      it('should not be able to create a miner for an organization which the user is not part of', done => {
        request(server)
          .post(`/miner/organization/${organization3._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('User does not have access to organization');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .post(`/miner/organization/${organization1._id}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect(401)
          .end(done);
      });
    });

    describe('PUT /miner/:id', () => {
      it('should update a miner', (done) => {
        request(server)
          .put(`/miner/${miner1._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            Miner.findById(miner1._id)
              .then(miner => {
                miner.name.should.equal('Cool miner');
                miner.description.should.equal('ultra Cool miner');
                done();
              });
          });
      });

      it('should not be able to change organization', (done) => {
        request(server)
          .put(`/miner/${miner1._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Super Miner',
            organization: 'abc'
          })
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            Miner.findById(miner1._id)
              .then(miner => {
                miner.name.should.equal('Super Miner');
                assert.notEqual(miner.organization, 'abc');
                done();
              });
          });
      });

      it('should not be able to update where user has pending invite', done => {
        request(server)
          .put(`/miner/${miner3._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner not found');
            done();
          });
      });

      it('should not be able to update where user is not part of organization', done => {
        request(server)
          .put(`/miner/${miner4._id}`)
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner not found');
            done();
          });
      });

      it('should not be able to update a miner which does not exists', done => {
        request(server)
          .put('/miner/123')
          .set('authorization', `${token}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner not found');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .put(`/miner/${miner1._id}`)
          .send({
            name: 'Cool miner',
            description: 'ultra Cool miner'
          })
          .expect(401)
          .end(done);
      });
   });

    describe('DELETE /miner/:id', () => {
      it('should not be able to delete a non existence miner', done => {
        request(server)
          .delete('/miner/abc')
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err ,res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner not found');
            done();
          });
      });

      it('should not be able to delete a miner on an organization where use have a pending invite', done => {
        request(server)
          .delete(`/miner/${miner3._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err ,res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner not found');
            done();
          });
      });

      it('should not be able to delete a miner where user is not part of owner organization', done => {
        request(server)
          .delete(`/miner/${miner4._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err ,res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner not found');
            done();
          });
      });

      it('should delete a miner', (done) => {
        request(server)
          .delete(`/miner/${miner1._id}`)
          .set('authorization', `${token}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err ,res) => {
            should.not.exists(err);
            res.body.message.should.equal('Miner removed');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .delete(`/miner/${miner1._id}`)
          .expect(401)
          .end(done);
      });
    });
  });
});
