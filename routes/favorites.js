'use strict';

const express = require('express');
const humps = require('humps')
const knex = require('../knex')
const boom = require('boom')

// eslint-disable-next-line new-cap
const router = express.Router()

const authorize = function(req, res, next) {
    if (!req.session.userId) {
        return next(boom.create(401, 'Unauthorized'))
    }

    next()
}

router.get('/', authorize, function(req, res, next) {
    knex('favorites')
        .innerJoin('books', 'books.id', 'favorites.book_id')
        .where('favorites.user_id', req.session.userId)
        .orderBy('books.title', 'ASC')
        .then(function(results) {
            res.send(humps.camelizeKeys(results))
        })
        .catch((err) => {
            next(err)
        })
})

router.get('/check', authorize, function(req, res, next) {

    const bookId = Number.parseInt(req.query.bookId)

    if (!Number.isInteger(bookId)) {
        return next(boom.create(400, 'Book ID must be an integer'));
    }

    knex('books')
        .innerJoin('favorites', 'favorites.book_id', 'books.id')
        .where({
            'favorites.book_id': bookId,
            'favorites.user_id': req.session.userId
        })
        .first()
        .then((results) => {
            if (results) {
                return res.send(true)
            }
            res.send(true)
        })
        .catch((err) => {
            next(err)
        })
})

router.post('/', authorize, function(req, res, next) {

    const bookId = parseInt(req.body.bookId)

    if (!Number.isInteger(bookId)) {
        return next(boom.create(400, 'Book ID must be an integer'));
    }

    knex('books')
        .where('id', bookId)
        .first()
        .then((book) => {
            if (!book) {
                throw boom.create(404, 'Book not found');
            }

            const insertFavorite = {
                bookId,
                userId: req.session.userId
            }

            return knex('favorites')
                .insert(humps.decamelizeKeys(insertFavorite), '*')
        })
        .then((results) => {
            const favorite = humps.camelizeKeys(results[0])

            res.send(favorite)
        })
        .catch((err) => {
            next(err)
        })
})

router.delete('/', function(req, res, next) {
    const bookId = Number.parseInt(req.body.bookId);

    if (!Number.isInteger(bookId)) {
        return next(boom.create(400, 'Book ID must be an integer'));
    }

    const clause = {
        book_id: bookId,
        user_id: req.session.userId
    }

    let favorite

    knex('favorites')
        .where(clause)
        .first()
        .then((results) => {
            if (!results) {
                throw boom.create(404, 'Favorite not found');
            }

            favorite = humps.camelizeKeys(results);

            return knex('favorites')
                .del()
                .where('id', favorite.id);
        })
        .then(() => {
            delete favorite.id;

            res.send(favorite);
        })
        .catch((err) => {
            next(err);
        });
});

module.exports = router;
