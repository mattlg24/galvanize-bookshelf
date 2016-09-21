'use strict'

const express = require('express')

// eslint-disable-next-line new-cap
const router = express.Router()
const knex = require('../knex')
const humps = require('humps')
process.env.NODE_ENV = 'test'

router.get('/', (req, res, next) => {
    knex('books')
        .orderBy('title')
        .then((books) => {
            res.send(humps.camelizeKeys(books))
        })
        .catch((err) => {
            next(err)
        })
})

router.get('/:id', (req, res, next) => {
    knex('books')
        .where('id', req.params.id)
        .first()
        .then((book) => {
            if (!book) {
                return next()
            }

            res.send(humps.camelizeKeys(book))
        })
        .catch((err) => {
            next(err)
        })
})

router.post('/', (req, res, next) => {
    const insertBook = {
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        description: req.body.description,
        cover_url: req.body.coverUrl,
    }
    knex('books')
        .insert(humps.decamelizeKeys(insertBook), '*')
        .then((record) => {
            const book = humps.camelizeKeys(record[0])
            res.send(book)
        })
        .catch((err) => {
            next(err)
        })
})

router.patch('/:id', (req, res, next) => {
    const updateBook = {
        title: req.body.title,
        author: req.body.author,
        genre: req.body.genre,
        description: req.body.description,
        cover_url: req.body.coverUrl,
    }
    knex('books')
        .where('id', req.params.id)
        .first()
        .update(updateBook, '*')
        .then((book) => {
            if (!book) {
                return next()
            }
            res.json(humps.camelizeKeys(book[0]))
        })
        .catch((err) => {
            next(err)
        })
})

router.delete('/:id', (req, res, next) => {
    let book;

    knex('books')
        .where('id', req.params.id)
        .first()
        .then((record) => {
            if (!record) {
                return next()
            }
            book = record
            return knex('books')
                .del()
                .where('id', req.params.id)
        })
        .then(() => {
            delete book.id
            res.send(humps.camelizeKeys(book))
        })
        .catch((err) => {
            next(err)
        })
})

module.exports = router;
