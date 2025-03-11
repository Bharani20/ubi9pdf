const express = require('express');
const group = require('../../services/Organization Administation/Groups/groups');
const router = express.Router();
    
router.route('/postGroup').post(group.post_group);
router.route('/getGroup').get(group.get_group);
router.route('/getGroup/:id').get(group.get_group_ID);
router.route('/updateGroup').post(group.update_group);


module.exports = router;