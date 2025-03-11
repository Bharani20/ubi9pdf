const express = require('express');
const shift = require('../../services/Organization Administation/Shifts/shift');
const router = express.Router();
    
router.route('/postShift').post(shift.post_shift);
router.route('/getShift').get(shift.get_shift);
router.route('/getShift/:id').get(shift.get_shift_ID);
router.route('/updateShift').post(shift.update_shifts);


module.exports = router;