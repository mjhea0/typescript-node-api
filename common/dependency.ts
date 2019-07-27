import * as mocha from 'mocha';
import * as chai from 'chai';
import chaiHttp = require('chai-http');
import app from '../src/App';
chai.use(chaiHttp);
export const expect = chai.expect;
export const request = chai.request(app)