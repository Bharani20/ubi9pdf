const express = require('express');
const dataPoint = require('../../services/Datapoint Administration/Datapoint/datapoint');
const router = express.Router(); 
    
router.route('/getDatapoint').get(dataPoint.get_dataPoint);
router.route('/postDatapoint').post(dataPoint.post_dataType);


module.exports = router;