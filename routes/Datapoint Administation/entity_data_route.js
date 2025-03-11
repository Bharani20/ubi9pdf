const express = require('express');
const entity_data = require('../../services/Datapoint Administration/Entity Data/entity_data');
const router = express.Router();

router.route('/getEntityData/:id').get(entity_data.get_entitydata);
router.route('/getDatabyId').post(entity_data.get_data);
router.route('/postEntityData').post(entity_data.post_entitydata);
router.route('/updateEntityData').post(entity_data.update_entitydata);


module.exports = router;