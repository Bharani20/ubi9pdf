const express = require('express');
const pdfReport = require('../../services/PDFReports/PDFReport/PDF');
const router = express.Router();
    
router.route('/generatePDFFromHtml').post(pdfReport.generate_pdfReport);


module.exports = router;