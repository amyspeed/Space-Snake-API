'use strict'

const chai = require('chai');
const chaiHttp = require('chai-http');
const jwt = require('jsonwebtoken');

const { app, runServer, closeServer } = require('../server');
const { JWT_SECRET, TEST_DATABASE_URL } = require('../config');
const { User } = require('../users')

const expect = chai.expect;
chai.use(chaiHttp);

describe('Protect all endpoints', function() {
    const username = 'testUserName';
    const password = 'testPassword';
    const firstName = 'testFirst';
    const lastName = 'testLast';
    const score = '0';

    before(function() {
        return runServer(TEST_DATABASE_URL);
    });

    beforeEach(function() {
        return User.hashPassword(password)
            .then(password => 
                User.create({
                    username,
                    password,
                    firstName,
                    lastName,
                    score
                })
        );
    });

    afterEach(function() {
        return User.deleteOne({});
    });


    after(function() {
        return closeServer();
    });

    describe('Get API', function() {
        it('should 200 on GET', function() {
            return chai
                .request(app)
                .get('/api')
                .then(function(res) {
                    expect(res).to.have.status(200);
                });
        });
    });

    describe('/api/users/scores/*', function() {

        const authToken = jwt.sign(
            {
                user: {
                    username,
                    firstName,
                    lastName
                }
            },
            JWT_SECRET,
            {
                algorithm: 'HS256',
                subject: username,
                expiresIn: '7d'
            }
        );


        it(`should GET all users' scores`, function() {
            return chai
                .request(app)
                .get('/api/users/scores')
                .set('Authorization', `Bearer ${authToken}`)
                .then(function(res) {
                    expect(res).to.have.status(200);
                    expect(res).to.be.json;
                    expect(res.body).to.be.an('array');
                    res.body.forEach(function(user) {
                        expect(user).to.be.an('object');
                        expect(user).to.contain.keys(
                            'username',
                            'score',
                        );
                    });
                });
        });

        it(`should GET one user's scores by ID`, function() {
            return User
                .findOne()
                .then(function(user) {
                    let id = user._id;

                    return chai 
                        .request(app)
                        .get(`/api/users/scores/${id}`)
                        .set('Authorization', `Bearer ${authToken}`)
                        .then(function(res) {
                            expect(res).to.have.status(200);
                            expect(res).to.be.json;
                            expect(res.body).to.be.an('object');
                            expect(res.body).to.contain.keys(
                                'username',
                                'score',
                            );
                        });
            });
            
        });

        it(`Should update user's score with PUT by ID`, function() {
            const newScore = {
                score: 100,
            };

            return User
                .findOne()
                .then(function(user) {
                    newScore.id = user._id;

                    return chai 
                        .request(app)
                        .put(`/api/users/scores/${user._id}`)
                        .send(newScore)
                        .set('Authorization', `Bearer ${authToken}`);
                })
                .then(function(res) {
                    expect(res).to.have.status(204);
                    return User.findById(newScore.id);
                })
                .then(function(updatedUser) {
                    expect(updatedUser.level1).to.equal(newScore.level1);
                    expect(updatedUser.totalScore).to.equal(newScore.totalScore);
                });
        });
    });
});