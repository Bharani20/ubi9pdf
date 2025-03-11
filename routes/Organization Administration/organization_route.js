const express = require('express');
const organization = require('../../services/Organization Administation/Organization/organization');
const router = express.Router();
    
router.route('/getOrg').get(organization.get_organization);
router.route('/postOrg').post(organization.post_organization);
router.route('/getOrg/:id').get(organization.get_org_ID);
router.route('/updateOrg').post(organization.update_org);
router.route('/getCount').get(organization.get_count)


module.exports = router;