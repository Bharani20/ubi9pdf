const express = require('express');
const instance = require('../../services/Datapoint Administration/Instance/instance');
const router = express.Router();
    
router.route('/postinstance').post(instance.post_instance);

module.exports = router;