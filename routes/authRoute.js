const express = require('express');

const router = express.Router();
const multer = require('../config/multer')

const { Register, Login } = require('../controller/authController');

const upload = multer({
    storagePath: 'public/upload/',  
    allowedTypes: ['.pdf'],  
    maxSize: 5 * 1024 * 1024  
});

router
    .route('/register')
    .post(upload.single('document'), Register);

router
    .route('/login')
    .post(Login)

module.exports = router