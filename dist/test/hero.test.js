"use strict";
const chai = require("chai");
const chaiHttp = require("chai-http");
const App_1 = require("../src/App");
chai.use(chaiHttp);
const expect = chai.expect;
describe('GET api/v1/heroes', () => {
    it('responds with JSON array', () => {
        return chai.request(App_1.default).get('/api/v1/heroes')
            .then(res => {
            expect(res.status).to.equal(200);
            expect(res).to.be.json;
            expect(res.body).to.be.an('array');
            expect(res.body).to.have.length(5);
        });
    });
    it('should include Wolverine', () => {
        return chai.request(App_1.default).get('/api/v1/heroes')
            .then(res => {
            let Wolverine = res.body.find(hero => hero.name === 'Wolverine');
            expect(Wolverine).to.exist;
            expect(Wolverine).to.have.all.keys([
                'id',
                'name',
                'aliases',
                'occupation',
                'gender',
                'height',
                'hair',
                'eyes',
                'powers'
            ]);
        });
    });
    describe('GET api/v1/heroes/:id', () => {
        it('responds with single JSON object', () => {
            return chai.request(App_1.default).get('/api/v1/heroes/1')
                .then(res => {
                expect(res.status).to.equal(200);
                expect(res).to.be.json;
                expect(res.body).to.be.an('object');
            });
        });
        it('should return Luke Cage', () => {
            return chai.request(App_1.default).get('/api/v1/heroes/1')
                .then(res => {
                expect(res.body.hero.name).to.equal('Luke Cage');
            });
        });
    });
});
