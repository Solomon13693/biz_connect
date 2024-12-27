const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        minLength: [8, 'Name must be a least 8 characters above'],
        required: [true, "Name is required"]
    },
    email: {
        type: String,
        unique: true,
        required: [true, "Email address is required"],
    },
    phone: {
        type: String,
        unique: true,
        required: [true, "Phone number is required"]
    },
    document: {
        type: String,
        required: [true, "Document is required"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        select: false
    },
    status: {
        type: String,
        enum: ['active', 'banned'],
        default: 'active',
    },
    joined: {
        type: Date,
        default: Date.now()
    }
})

userSchema.pre('save', async function(next){
    if(!this.isModified('password')) return next
    this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.passwordCompare = async function(password){
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.jwtTokenGenerator = async function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION
    })
}

const User = mongoose.model('User', userSchema)

module.exports = User