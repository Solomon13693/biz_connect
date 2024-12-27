const asyncHandler = require('express-async-handler')
const User = require('../model/User')
const { ErrorResponse, SuccessResponse } = require('../utils/response')

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.Register = asyncHandler(async (req, res, next) => {

    const { name, email, password, phone } = req.body
    const file = req.file ? req.file.filename : null;

    if (!file) {
        return next(new ErrorResponse('Document is required', 400));
    }

    const checkEmail = await User.findOne({ email: email })

    if (checkEmail) {
        return next(new ErrorResponse('Email already exist', 422))
    }

    const checkPhone = await User.findOne({ phone: phone })

    if (checkPhone) {
        return next(new ErrorResponse('Phone already exist', 422))
    }

    await User.create({
        email,
        phone,
        name,
        password,
        document: file
    })

    return SuccessResponse(res, 'Account created !, You can now login to your account', 201)

})

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.Login = asyncHandler(async (req, res, next) => {

    const { email, password } = req.body

    if (!email || !password) {
        return next(new ErrorResponse('Please enter your email address and password', 422));
    }

    const user = await User.findOne({ email: email }).select('+password')

    if (!user || !(await user.passwordCompare(password))) {
        return next(new ErrorResponse('Invalid login credientials', 401));
    }

    if (user.status == 'banned') {
        return next(new ErrorResponse('Your account has been banned, Contact the admin', 401));
    }

    const token = await user.jwtTokenGenerator()

    return SuccessResponse(res, 'Login successful', {
        token,
        user
    }, 200);

})
