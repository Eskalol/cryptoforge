import should from 'should';
import request from 'supertest';
import server from '../../index';
import miner from '../../models/person';

describe('controllers', () => {
  describe('miner', () => {

    describe('GET /miner', () => {
      it('should return a list with miners', (done) => {
        done();
      });
    });

    describe('POST /miner', () => {
      it('should create a miner', (done) => {
        done();
      })
    });

    describe('GET /miner/:id', () => {
      it('should return the correct miner', (done) => {
        done();
      });
    });

    describe('PUT /miner/:id', () => {
      it('should update a miner', (done) => {
        done();
      });
    });

    describe('DELETE /miner/:id', () => {
      it('should delete a miner', (done) => {
        done();
      });
    });
  });
});
