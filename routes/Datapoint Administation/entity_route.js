const express = require('express');
const entity = require('../../services/Datapoint Administration/Entity/entity');
const router = express.Router();

router.route('/createEntityOrInstance').post(entity.post_entity);
router.route('/getEntitySSE').get(entity.get_entity_sse);
router.route('/getEntityOrInstance/:id').get(entity.get_entity_attributeByID);
router.route('/getEntityAttribute/:id').get(entity.get_attr_list);
router.route('/getEntityDetails/:id').get(entity.get_entity_details);
router.route('/getEntityOrInstance').post(entity.get_entity_attribute);
router.route('/updateEntityOrInstance').post(entity.update_entity);
router.route('/getEntiryOrInstanceCount').get(entity.get_count_entity);
router.route('/getAppEntityCount').post(entity.get_count_app_entity);
router.route('/postAttrValue').post(entity.post_attr_value);
router.route('/getAttrValue').post(entity.get_attr_value);
router.route('/getLogs').post(entity.get_entity_logs);
router.route('/getAttributeLogs').get(entity.get_attribute_logs);
router.route('/getAttributeLogs/:id').get(entity.get_attribute_logs_ID);
router.route('/postMonthlyTargetAttr').post(entity.post_monthlytarget_attr);
router.route('/getMonthlyTargetAttr/:id').get(entity.get_monthlytarget_attr_ID);
router.route('/getFreqValuesByDate').post(entity.get_freq_value_by_date);
router.route('/getFreqValues').post(entity.get_freq_value_for_graph);
router.route('/getMultiFreqValues').post(entity.get_freq_multi_value_for_graph);
router.route('/getMultiFreqExcels').post(entity.get_freq_multi_value_for_excel);
router.route('/getFreqExcels').post(entity.get_freq_value_for_excel);
router.route('/updateFreqValueById').post(entity.update_freq_value_by_id);

// Added by rangarao on 14-02-2025
router.route('/getAttributes').post(entity.get_attribute_list),
router.route('/getAttrById').post(entity.get_attr_by_id)
router.route('/postAttr').post(entity.create_attribute);
router.route('/updateAttr').post(entity.update_attribute);



// added by rangarao
router.route('/postEntityValue').post(entity.post_entity_values);


module.exports = router;