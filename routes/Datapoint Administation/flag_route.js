const express = require('express');
const flags = require('../../services/Datapoint Administration/Flag/flag');
const router = express.Router();
    
router.route('/postFlag').post(flags.post_flag);
router.route('/validateFlag').post(flags.validate_Flag);
router.route('/getFlag').get(flags.get_flag);
router.route('/getFlag/:id').get(flags.get_template_ID);
router.route('/updateFlag').post(flags.update_flag);

module.exports = router;