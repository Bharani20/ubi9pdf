const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {
    get_entitydata: async function (req, res, next) {
        try {
            const entityId = req.params.id
            const db = await connectToMongoDB();
            const entityCollectionName = process.env.ENTITY_DATA_COLLECTION;

            // const projection = { DataType: 1, _id: 0 };
            const result = await db.collection(entityCollectionName).find({ entityOrInstanceId: entityId }).toArray();
            if (result) {
                // return res.json({ token: '200', Entity_Attribute: result });
                return res.status(200).json(result);
            } else {
                return res.status(404).json({ error: 'Entity data not found' });
            }
        } catch (err) {
            console.error('Error fetching data from MongoDB:', err);
            return res.status(500).json({ error: 'Error fetching data from MongoDB', details: err.message });
        }
    },
    post_entitydata: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const entityCollectionName = process.env.ENTITY_DATA_COLLECTION;

            const newObjectId = new ObjectId();

            const entityDataSchema = {
                _id: newObjectId,
                dataId: newObjectId.toHexString(),
                entityOrInstanceId: req.body.entityOrInstanceId,
                type: req.body.type,
                data: req.body.data,
                createdOn: new Date()
            };

            const result = await db.collection(entityCollectionName).insertOne(entityDataSchema);
            return res.json({ token: '200', response: 'Successfully created in database', Flag: entityDataSchema });
        } catch (err) {
            console.error('Error creating entity data:', err);
            return res.status(500).json({ token: '500', response: 'Failed to create entity data', error: err.message });
        }
    },
    get_data: async (req, res) => {
        try {
            const db = await connectToMongoDB();
            const dataId = req.body.dataId;
            const entityOrInstanceId = req.body.entityId;
            const entityCollectionName = process.env.ENTITY_DATA_COLLECTION;
            const attributeCollection = process.env.ATTRIBUTE_COLLECTION;
            const data = await db.collection(entityCollectionName).findOne({ dataId: dataId });
            const schema = await db.collection(attributeCollection).find({ entityOrInstanceId: entityOrInstanceId }).toArray();
            let finalSchema = await Promise.all(
                schema.map(async (item) => {
                    const formValue = data.data[item.attributeName];
            
                    if (item.isLookup && item.lookupId !== null) {
                        const attrList = await getLookupDatas(
                            item.lookupId.entityId,
                            item.lookupAttribute.attributeName
                        );
                        return { ...item, formValue, attrList };
                    }
            
                    return { ...item, formValue };
                })
            );
            
            return res.json({ token: '200', response: 'Successfully created in database', data: finalSchema });
        }
        catch (err) {
            console.error('Error getting entity data:', err);
            return res.status(500).json({ token: '500', response: 'Failed to get entity data', error: err.message });
        }

    },
    update_entitydata: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const entityCollectionName = process.env.ENTITY_DATA_COLLECTION;
    
            const { dataId, data } = req.body;
    
            if (!dataId || !data) {
                return res.status(400).json({ token: '400', response: 'Missing required fields: dataId and data' });
            }
    
            const filter = { dataId: dataId };
            const update = { $set: { data: data } };
    
            const result = await db.collection(entityCollectionName).updateOne(filter, update);
    
            if (result.matchedCount === 0) {
                return res.status(404).json({ token: '404', response: 'No matching record found for the given dataId' });
            }
    
            return res.json({ token: '200', response: 'Successfully updated data', Flag: data });
        } catch (err) {
            console.error('Error updating entity data:', err);
            return res.status(500).json({ token: '500', response: 'Failed to update entity data', error: err.message });
        }
    }
};

async function getLookupDatas(entityId, attributeName) {
    try {
        const entityCollectionName = process.env.ENTITY_DATA_COLLECTION;
        const db = await connectToMongoDB();
        const results = await db.collection(entityCollectionName).find({ entityOrInstanceId: entityId }).project({ [`data.${attributeName}`]: 1, _id: 0 }).toArray();
        const values = results.map(item => item.data[attributeName]).filter(value => value !== undefined);
        return values;
    } catch (error) {
        console.error(error);
        return [];
    }
}
