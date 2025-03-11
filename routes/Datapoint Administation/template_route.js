const express = require('express');
const templates = require('../../services/Datapoint Administration/Template/template');
const router = express.Router();
    
router.route('/postTemplate').post(templates.post_template);
router.route('/getTemplate').post(templates.get_template);
router.route('/getTemplate/:id').get(templates.get_template_ID);


module.exports = router;