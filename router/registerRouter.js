const express=require('express');
const registerModule=require('../modules/registerModule');
const router=express.Router();

router.post('/signup',registerModule.signup);
router.post('/login',registerModule.signin);
router.post('/forgotpassword',registerModule.forgotPassword);
router.put('/resetpassword/:id',registerModule.resetPassword);

module.exports =router;