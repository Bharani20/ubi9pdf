const express = require('express');
const connectToMongoDB = require('../../../config/connection');

require('dotenv').config();

module.exports = {
    post_report: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.REPORT_COLLECTION;
            // const ReportSchema = {
            //     id: req.body.id,
            //     name: req.body.name,
            //     layout_type: req.body.layout_type,
            //     authorization_id: req.body.authorization_id,
            //     datapoint_id: req.body.datapoint_id,
            //     key: req.body.key,
            //     type: req.body.type,
            //     properties: {
            //         label: req.body.properties.label,
            //         placeholder: req.body.properties.placeholder,
            //         value: req.body.properties.value,
            //         required: req.body.properties.required,
            //         metadata: req.body.properties.metadata
            //     },
            //     position: {
            //         x: req.body.position.x,
            //         y: req.body.position.y
            //     }
            // };

            const ReportSchema = {
                reportId : req.body.reportId,
                container : req.body.container
            };

            const result = await db.collection(collectionName).insertOne(ReportSchema);
            return res.json({ token: '200', Users: ReportSchema });
        } catch (err) {
            return next(err);
        }
    },
    get_report: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.REPORT_COLLECTION;

            const result = await db.collection(collectionName).find({}).toArray();
            return res.json({ token: '200', Reports: result });
        } catch (err) {
            return next(err);
        }
    }
};
