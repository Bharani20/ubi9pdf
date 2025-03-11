const express = require('express');
const event = require('../../services/Datapoint Administration/Event/event');
const router = express.Router();
    
router.route('/postEvent').post(event.post_event);
router.route('/getEvent').get(event.get_event);
router.route('/getEvent/:id').get(event.get_event_ID);
router.route('/updateEvent').post(event.update_event);

module.exports = router;