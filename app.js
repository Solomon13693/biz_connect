const express = require('express');
const dotenv = require('dotenv').config();
const mongoDB = require('./config/db')
const morgan = require('morgan');
const { ErrorResponse } = require('./utils/response');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

mongoDB()

app.use(express.json());
app.use(express.static('public'))

app.use(morgan('dev'))

// ROUTES
app.use('/api/v1/', routes)

// Handle 404 Route
app.use('*', (req, res, next) => {
    return next(new ErrorResponse(`${req.path}/${req.baseUrl} route not found`, 404));
})

app.use(errorHandler)

module.exports = app