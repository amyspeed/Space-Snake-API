'use strict';

const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');

const { PORT } = require('./config');

const app = express();

app.use(morgan('common'));

app.use(express.json());

app.get('/api', (req, res) => {
    res.json({ok: true});
});

app.use('*', function (req, res) {
    res.status(404).json({ message: `Not Found` });
});

let server;

function runServer(port = PORT) {
    return new Promise((resolve, reject) => {
        server = app.listen(port, () => {
            console.log(`App is listening on port ${port}`);
            resolve();
        })
    });
}

function closeServer() {
    return new Promise((resolve, reject) => {
        console.log('Closing server');
        server.close(err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
}