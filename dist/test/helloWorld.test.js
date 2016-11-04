"use strict";
const chai = require("chai");
const chaiHttp = require("chai-http");
const App_1 = require("../src/App");
chai.use(chaiHttp);
const expect = chai.expect;
describe('baseRoute', () => {
    it('should be json', () => {
        chai.request(App_1.default).get('/')
            .then(res => {
            expect(res.type).to.eql('application/json');
        });
    });
    it('should have a message prop', () => {
        chai.request(App_1.default).get('/')
            .then(res => {
            expect(res.body.message).to.eql('Hello World!');
        });
    });
});
