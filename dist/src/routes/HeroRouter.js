"use strict";
const express_1 = require("express");
const Heroes = require('../data');
class HeroRouter {
    constructor() {
        this.router = express_1.Router();
        this.init();
    }
    getAll(req, res, next) {
        res.send(Heroes);
    }
    getOne(req, res, next) {
        let query = parseInt(req.params.id);
        let hero = Heroes.find(hero => hero.id === query);
        if (hero) {
            res.status(200)
                .send({
                message: 'Success',
                status: res.status,
                hero
            });
        }
        else {
            res.status(404)
                .send({
                message: 'No hero found with the given id.',
                status: res.status
            });
        }
    }
    init() {
        this.router.get('/', this.getAll);
        this.router.get('/:id', this.getOne);
    }
}
exports.HeroRouter = HeroRouter;
const heroRoutes = new HeroRouter();
heroRoutes.init();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = heroRoutes.router;
