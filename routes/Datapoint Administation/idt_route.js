const express = require('express');
const jsons = require('../../services/Datapoint Administration/IDT/idt');
const mapping = require('../../services/Datapoint Administration/IDT/eventMapping');
const router = express.Router();

router.route('/postIdt').post(jsons.post_Idt);
router.route('/getIdtList').post(jsons.get_idt_list)
router.route('/getIdt').get(jsons.get_Idt);
router.route('/getIdt/:id').get(jsons.get_Idt_ID);
router.route('/idt_odt_mapping/:id').get(jsons.get_Idt_Odt_Mapping);

router.route('/odtMapping').post(mapping.odt_mapping);
router.route('/getOdt/:id').get(mapping.get_odt);
router.route('/valueMapping').get(mapping.value_odt_mapping);
router.route('/pageMapping').post(mapping.page_odt_mapping);
// entityForm
router.route('/entityForm').post(mapping.entity_form_mapping);

// Report
router.route('/reportForm').post(mapping.report_form_mapping);
router.route('/getAttributesById/:id').get(mapping.get_page_attributes)

router.route('/valueMappingById').post(mapping.value_odt_mapping_Id);
router.route('/updateEmitterId').post(mapping.update_odt_emitterId);
router.route('/entityMapping').post(mapping.entity_mapping);


module.exports = router;