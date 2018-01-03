import should from 'should';
import request from 'supertest';
import server from '../../index';
import OrganizationUser from '../../models/organizationUser';
import Organization from '../../models/organization';
import User from '../../models/user';

let testUser1, testUser2, token1, token2;

const auth = (email, pass) => {
  return request(server)
    .post('/auth/login')
    .send({
      email: `${email}`,
      password: `${pass}`
    }).then(res => {
      return res.body.token;
    });
};

describe('controllers', () => {
  describe('organizationInvite', () => {
    let organization1;
    let organization2;
    let organization3;

    beforeEach(() => {
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
        name: 'org4',
        description: 'awesome organization',
        location: 'Karasjok',
        email: 'cool@example.com',
        url: 'lol.com'
      });

      return User.remove()
        .then(() => Organization.remove())
        .then(() => OrganizationUser.remove())
        .then(() => new User({
          name: 'Fake User',
          email: 'test@example.com',
          password: 'password',
          provider: 'local',
          role: 'user'
        }).save())
        .then(user => testUser1 = user)
        .then(() => new User({
          name: 'Fake User2',
          email: 'test2@example.com',
          password: 'password',
          provider: 'local',
          role: 'user'
        }).save())
        .then(user => testUser2 = user)
        .then(() => organization1.save())
        .then(org => organization1 = org)
        .then(() => organization2.save())
        .then(org => organization2 = org)
        .then(() => organization3.save())
        .then(org => organization3 = org)
        .then(() => new OrganizationUser({
          user: testUser1,
          organization: organization1,
          invite: false
        }).save())
        .then(() => new OrganizationUser({
          user: testUser1,
          organization: organization2,
          invite: true
        }).save())
        .then(() => auth('test@example.com', 'password'))
        .then(token => token1 = token)
        .then(() => auth('test2@example.com', 'password'))
        .then(token => token2 = token);
    });

    afterEach(() => {
      return OrganizationUser.remove()
        .then(() => User.remove())
        .then(() => Organization.remove());
    });

    describe('GET /organization/invite', () => {
      it('should return a list with invitations', (done) => {
        request(server)
          .get('/organization/invite')
          .set('authorization', `${token1}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Array);
            res.body.should.have.length(1);
            const orgNames = res.body.map(org => org.name);
            const orgIds = res.body.map(org => org._id);
            assert.include(orgNames, 'org2');
            assert.include(orgIds, `${organization2._id}`);
            assert.notInclude(orgNames, 'org1');
            assert.notInclude(orgNames, 'org3');
            assert.notInclude(orgIds, `${organization3._id}`);
            assert.notInclude(orgIds, `${organization1._id}`);
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .get('/organization/invite')
          .expect(401)
          .end(done);
      });
    });

    describe('POST /organization/invite', () => {
      it('should create an invitation', (done) => {
        request(server)
          .post('/organization/invite')
          .set('authorization', `${token1}`)
          .send({
            email: 'test2@example.com',
            organization: `${organization1._id}`
          })
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('Invitation sent to test2@example.com');

            OrganizationUser.findOne({
              organization: organization1,
              user: testUser2,
              invite: true
            }).then(orguser => {
              should.exist(orguser);
              done();
            });
          });
      });

      it('user is already invited to the organization', done => {
        request(server)
          .post('/organization/invite')
          .set('authorization', `${token1}`)
          .send({
            email: 'test2@example.com',
            organization: `${organization1._id}`
          })
          .expect('Content-Type', /json/)
          .expect(201)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('Invitation sent to test2@example.com');

            request(server)
              .post('/organization/invite')
              .set('authorization', `${token1}`)
              .send({
                email: 'test2@example.com',
                organization: `${organization1._id}`
              })
              .expect('Content-Type', /json/)
              .expect(400)
              .end((err, res) => {
                should.not.exists(err);
                res.body.should.be.an.instanceOf(Object);
                res.body.message.should.equal('User already invited to organization');
                done();
              });
          });
      });

      it('user is already member of the organization', done => {
        new OrganizationUser({
          organization: organization1,
          user: testUser2,
          invite: false
        }).save()
        .then(() => {
          request(server)
            .post('/organization/invite')
            .set('authorization', `${token1}`)
            .send({
              email: 'test2@example.com',
              organization: `${organization1._id}`
            })
            .expect('Content-Type', /json/)
            .expect(400)
            .end((err, res) => {
              should.not.exists(err);
              res.body.should.be.an.instanceOf(Object);
              res.body.message.should.equal('User is already member of the organization');
              done();
            });
        });
      });

      it('should not be able to add user when request user is not part of that organization', done => {
        request(server)
          .post('/organization/invite')
          .set('authorization', `${token1}`)
          .send({
            email: 'test2@example.com',
            organization: `${organization2._id}`
          })
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('Cannot invite to organization: ' +
              'organization does not exists or request user is not part of it');
            done();
          });
      });

      it('should not be able to add user to an organization which does not exists', done => {
        request(server)
          .post('/organization/invite')
          .set('authorization', `${token1}`)
          .send({
            email: 'test2@example.com',
            organization: 'abc'
          })
          .expect('Content-Type', /json/)
          .expect(403)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('Cannot invite to organization: ' +
              'organization does not exists or request user is not part of it');
            done();
          });
      });

      it('should not ba able to add user who does not exists', done => {
        request(server)
          .post('/organization/invite')
          .set('authorization', `${token1}`)
          .send({
            email: 'noOne@example.com',
            organization: `${organization1._id}`
          })
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.should.be.an.instanceOf(Object);
            res.body.message.should.equal('User with email: noOne@example.com does not exists');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .post('/organization/invite')
          .send({
            email: 'test2@example.com',
            organization: `${organization1._id}`
          })
          .expect(401)
          .end(done);
      });
    });

    describe('GET /organization/invite/:id/accept', () => {
      it('should accept invite', (done) => {
        request(server)
          .get(`/organization/invite/${organization2._id}/accept`)
          .set('authorization', `${token1}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('Invite accepted');
            OrganizationUser.findOne({
              organization: organization2,
              user: testUser1,
              invite: false
            }).then(orguser => {
              should.exist(orguser);
              done();
            });
          });
      });

      it('should not be able to accept an invite to an organization where there is no invite', (done) => {
        request(server)
          .get(`/organization/invite/${organization3._id}/accept`)
          .set('authorization', `${token1}`)
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('Invite does not exists');
            done();
         });
      });

      it('should not be able to accept an invite when the user is already part of the organization', done => {
        request(server)
          .get(`/organization/invite/${organization1._id}/accept`)
          .set('authorization', `${token1}`)
          .expect('Content-Type', /json/)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('Invite does not exists');
            done();
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .get(`/organization/invite/${organization2._id}/accept`)
          .expect(401)
          .end(done);
      });
    });

    describe('DELETE /organization/invite/:id/destroy', () => {
      it('should delete a organizationUser', (done) => {
        request(server)
          .delete(`/organization/invite/${organization2._id}/destroy`)
          .set('authorization', `${token1}`)
          .expect('Content-Type', /json/)
          .expect(200)
          .end((err, res) => {
            should.not.exists(err);
            res.body.message.should.equal('entity deleted');
            OrganizationUser.findOne({
              organization: organization2,
              user: testUser1
            }).then(orguser => {
              should.not.exists(orguser);
              done();
            });
          });
      });

      it('should not be able to delete an organizationUser when invite is false', done => {
        request(server)
          .delete(`/organization/invite/${organization1._id}/destroy`)
          .set('authorization', `${token1}`)
          .expect(404)
          .end((err, res) => {
            should.not.exists(err);
            OrganizationUser.findOne({
              organization: organization1._id,
              user: testUser1
            }).then(orguser => {
              should.exist(orguser);
              done();
            });
          });
      });

      it('it should not be authenticated', done => {
        request(server)
          .delete(`/organization/invite/${organization2._id}/destroy`)
          .expect(401)
          .end(done);
      });
    });
  });
});
