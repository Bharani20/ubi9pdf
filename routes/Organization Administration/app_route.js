const express = require('express');
const app = require('../../services/Organization Administation/Apps/app');
const router = express.Router();
    
router.route('/postApp').post(app.post_app);
router.route('/getApp').get(app.get_app);
router.route('/getApp/:id').get(app.get_app_ID);
router.route('/updateApp').post(app.update_app);


module.exports = router;