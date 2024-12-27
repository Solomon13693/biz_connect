const express = require('express');
const { CreateAccount, getAccount, fundAccount, validateCharge, AccountACH } = require('../controller/userController');
const { Protected } = require('./../middleware/auth')

const router = express.Router();


router
    .route('/account')
    .post(Protected, CreateAccount)
    .get(Protected, getAccount)

router
    .route('/account/fund')        
    .post(Protected, fundAccount); 

router
    .route('/account/fund/validate')        
    .post(Protected, validateCharge); 

router
    .route('/account/ach')        
    .post(Protected, AccountACH); 


module.exports = router