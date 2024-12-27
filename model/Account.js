const mongoose = require('mongoose')

const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accountNumber: { type: String, unique: true },
    balance: { type: Number, default: 0 },
}, { timestamps: true })

const Account = mongoose.model('Account', accountSchema)

module.exports = Account