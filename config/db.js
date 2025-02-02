const mongoose = require('mongoose')

const connectDB = async () => {
    const conn = await mongoose.connect(process.env.MONGODB_URL, {
        serverSelectionTimeoutMS: 5000,
    })

    console.log(`MongoDB connected: ${conn.connection.host}`);

}

module.exports = connectDB