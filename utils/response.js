class ErrorResponse extends Error {
    constructor(message, statusCode, error = null) {
        super(message);
        this.statusCode = statusCode;
        if (error) {
            this.error = error;
        }
    }
}

const SuccessResponse = (res, message, data = {}, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};

module.exports = { SuccessResponse, ErrorResponse };
