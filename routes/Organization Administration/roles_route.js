const express = require('express');
const roles = require('../../services/Organization Administation/Roles/roles');
const router = express.Router();
    
router.route('/postRoles').post(roles.post_roles);
router.route('/getRoles').get(roles.get_roles);
router.route('/getRoles/:id').get(roles.get_roles_ID);
router.route('/updateRoles').post(roles.update_roles);


module.exports = router;