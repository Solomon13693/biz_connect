const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
    },
    tx_ref: {
        type: String,
        required: true,
        unique: true, 
    },
    flw_ref: {
        type: String,
        required: false,
        unique: true, 
    },
    status: {
        type: String,
        enum: ['pending', 'successful', 'failed'],
        default: 'pending',
    },
    date: {
        type: Date,
        default: Date.now
    },
    description: String,
});

module.exports = mongoose.model('Transaction', transactionSchema);
