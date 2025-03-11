const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {
    post_instance: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.INSTANCE_COLLECTION;
            
            const newObjectId = new ObjectId();

            const instanceSchema = {
                _id: newObjectId,
               instanceId : newObjectId.toHexString(),
               instanceName : req.body.instanceName,
               instanceDesc : req.body.instanceDesc,
               entityId : req.body.entityId,
               instanceAttribute : req.body.instanceAttribute,
               createdOn: new Date()
            };

            const result = await db.collection(collectionName).insertOne(instanceSchema);
            return res.json({ token: '200', response: 'Successfully created in database', Instance: instanceSchema });
        } catch (err) {
            console.error('Error creating instance:', err);
            return res.status(500).json({ token: '500', response: 'Failed to create entity', error: err.message });
        }
    }
};