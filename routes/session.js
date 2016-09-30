'use strict';

const express = require('express')
const bcrypt = require('bcrypt-as-promised')
const humps = require('humps')
const knex = require('../knex')
const boom = require('boom')

const router = express.Router();


router.get('/', (req, res, next) => {
    if (req.session.userId) {
        res.send(true)
    }
    res.send(false)
})

router.post('/', (req, res, next) => {
    // console.log(req);
    if (!req.body.email || !req.body.email.trim()) {
        return next(boom.create(400, 'Email must not be blank'))
    }
    if (!req.body.password || req.body.password.length < 8) {
        return next(boom.create(400, 'Password must not be blank'))
    }
    let user;

    knex('users')
        .where('email', req.body.email)
        .first()
        .then(function(results) {
            if (!results) {
                throw boom.create(400, 'Bad email or password')
            }
            user = humps.camelizeKeys(results)
                // console.log("The User is:", user);
            return bcrypt.compare(req.body.password, user.hashedPassword)
        })
        .then(function() {
            // if (passwordMatch === false) {
            //     throw boom.create(400, 'Bad email or password')
            // } else {
            delete user.hashedPassword
            req.session.userId = user.id
            res.send(user)
                // }
        })
        .catch(bcrypt.MISMATCH_ERROR, () => {
            throw boom.create(400, 'Bad email or password')
        })
        .catch((err) => {
            next(err)
        })
})

router.delete('/', (req, res, next) => {
    req.session = null
    res.send(true)
})

module.exports = router;
