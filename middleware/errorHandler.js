const {ErrorResponse} = require('../utils/response');

const errorHandler = (err, req, res, next) => {

    let error = { ...err };
    error.message = err.message;

    console.log(error);
    

    if (err.name === 'CastError') {
        const message = `Resource not found with id ${err.value}`;
        error = new ErrorResponse(message, 404);
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `Duplicate value entered for field: ${field}`;
        error = new ErrorResponse(message, 400);
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        const message = messages.join(', ');
        error = new ErrorResponse(message, 400);
    }

    if (err.name === 'JsonWebTokenError') {
        error = new ErrorResponse('Invalid token, please login again', 401);
    }

    if (err.name === 'TokenExpiredError') {
        error = new ErrorResponse('Your token has expired, please login again', 401);
    }

    const statusCode = error.statusCode || 500;
    const message =
        process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    });
};

module.exports = errorHandler;
