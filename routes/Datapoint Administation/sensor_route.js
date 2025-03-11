const express = require('express');
const sensor = require('../../services/Datapoint Administration/Sensor/sensor');
const router = express.Router();
    
router.route('/getSensor').get(sensor.get_sensor);
router.route('/postSensor').post(sensor.post_sensor);
router.route('/getSensor/:id').get(sensor.get_sensor_ID);
router.route('/attributeMapping').post(sensor.attribute_mapping);


module.exports = router;