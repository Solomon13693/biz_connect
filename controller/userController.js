const asyncHandler = require('express-async-handler')
const Account = require('../model/Account')
const Transactions = require('../model/Transactions')
const { ErrorResponse, SuccessResponse } = require('../utils/response')
const { v4: uuidv4 } = require('uuid');
const Flutterwave = require('flutterwave-node-v3');
const { default: axios } = require('axios');

const flw = new Flutterwave(process.env.FLW_PUBLIC_KEY, process.env.FLW_SECRET_KEY);

// @desc    Create Account
// @route   POST /api/v1/user/account
// @access  PRIVATE
exports.CreateAccount = asyncHandler(async (req, res, next) => {

    const user = req.user

    const existingAccount = await Account.findOne({ user: user._id });

    if (existingAccount) {
        return next(new ErrorResponse('User already has an account', 400));
    }

    const accountNumber = (parseInt(uuidv4().replace(/-/g, '').slice(0, 11), 16) % 1000000000000).toString().padStart(11, '0');

    const account = await Account.create({
        user: user._id,
        accountNumber: accountNumber,
        balance: 0,
    });

    return SuccessResponse(res, 'Account created successfully', account, 201);

})

// @desc    Fund Account
// @route   POST /api/v1/user/account/fund
// @access  PRIVATE
exports.fundAccount = asyncHandler(async (req, res, next) => {

    const user = req.user

    const { amount, cardNumber, exp_month, exp_year, cvc, pin } = req.body;

    const tx_ref = `tx_${Date.now()}`;

    try {

        const payload = {
            card_number: cardNumber,
            cvv: cvc,
            expiry_month: exp_month,
            expiry_year: exp_year,
            currency: 'NGN',
            amount: amount,
            email: user.email,
            tx_ref: tx_ref,
            enckey: process.env.FLW_ENCRYPTION_KEY,
            "authorization": {
                "mode": "pin",
                "pin": pin
            }
        };

        const response = await flw.Charge.card(payload);

        if (response.status === 'error') {
            return next(new ErrorResponse(response.message, 402));
        }

        const { data, meta } = response
        const { mode, redirect } = meta?.authorization

        await Transactions.create({
            user: user._id,
            type: 'credit',
            amount: amount,
            tx_ref: tx_ref,
            flw_ref: data.flw_ref,
            status: 'pending',
            description: 'Fund Account via Card',
        });

        if (mode == 'otp') {
            return SuccessResponse(res, data.processor_response, { mode, ref: data.flw_ref }, 200);
        } else {
            return SuccessResponse(res, data.processor_response, { mode, ref: data.flw_ref, redirect }, 200);
        }

    } catch (error) {
        return next(new ErrorResponse(error.message, 400));
    }

})

// @desc    Validate Charge Account
// @route   POST /api/v1/user/account/fund/validate
// @access  PRIVATE

exports.validateCharge = asyncHandler(async (req, res, next) => {

    const user = req.user
    const { otp, flw_ref } = req.body;

    try {

        const response = await flw.Charge.validate({
            otp,
            flw_ref
        });

        if (response.status !== 'success') {
            await Transactions.findOneAndUpdate(
                { flw_ref },
                { status: 'failed' },
                { new: true }
            );
            return next(new ErrorResponse('Charge validation failed', 400));
        }

        const transaction = await Transactions.findOneAndUpdate(
            { flw_ref },
            { status: 'successful' },
            { new: true }
        );

        if (!transaction) {
            return next(new ErrorResponse('Transaction not found', 404));
        }

        await Account.findOneAndUpdate(
            { user: user._id },
            { $inc: { balance: transaction.amount } },
            { new: true }
        );

        return SuccessResponse(res, 'Charge validated successfully', transaction, 200);

    } catch (error) {

        await Transactions.findOneAndUpdate(
            { flw_ref },
            { status: 'failed' },
            { new: true }
        );

        return next(new ErrorResponse(error.message, 400));
    }

})

// @desc    Get Account
// @route   Get /api/v1/user/account
// @access  PRIVATE
exports.getAccount = asyncHandler(async (req, res, next) => {

    const user = req.user

    const account = await Account.findOne({ user: user._id });

    return SuccessResponse(res, 'Account retrived successfully', account, 201);

})

// @desc    Fund Account via ACH
// @route   POST /api/v1/user/account/fund/ach
// @access  PRIVATE

exports.AccountACH = asyncHandler(async (req, res, next) => {

    const user = req.user;
    const { amount, accountNumber, routingNumber } = req.body;

    const tx_ref = `ach_tx_${Date.now()}`;

    try {

        const transferPayload = {
            _links: {
                source: {
                    href: `https://api-sandbox.dwolla.com/funding-sources/${accountNumber}`,
                },
                destination: {
                    href: `https://api-sandbox.dwolla.com/funding-sources/${routingNumber}`,
                },
            },
            amount: {
                currency: 'USD',
                value: amount.toFixed(2),
            },
        };

        const dwollaResponse = await axios.post('https://api-sandbox.dwolla.com/transfers', transferPayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.DWOLLA_ACCESS_TOKEN}`,
                },
            }
        );

        if (dwollaResponse.status !== 'processed') {
            return next(new ErrorResponse('Transfer failed', 400));
        }

        await Transactions.create({
            user: user._id,
            type: 'credit',
            amount,
            tx_ref,
            status: 'successful',
            description: 'Fund Account via ACH (Dwolla)',
        });

        await Account.findOneAndUpdate(
            { user: user._id },
            { $inc: { balance: amount } },
            { new: true }
        );

        return SuccessResponse(res, 'Funds successfully transferred via Dwolla ACH', {
            tx_ref, amount
        }, 200);

    } catch (error) {
        return next(new ErrorResponse(error.message, 500));
    }

})