const express = require('express');
const users = require('../../services/Organization Administation/Users/users');
const router = express.Router();
    
router.route('/postUsers').post(users.post_users);
router.route('/getUsers').get(users.get_users);
router.route('/getUsers/:id').get(users.get_user_ID);
router.route('/updateUsers').post(users.update_users);
router.route('/getUserApps').post(users.get_users_app)


module.exports = router;