const express = require('express');
const dataPoint = require('../../Auth/auth')
const router = express.Router();
    
router.route('/getToken').post(dataPoint.get_token);

module.exports = router;