const express = require('express');
// const reports = require('../services/Report/reports');
const reports = require('../../services/Datapoint Administration/Report/reports')
const router = express.Router();
    
router.route('/postReport').post(reports.post_report);
router.route('/getReport').get(reports.get_report);


module.exports = router;