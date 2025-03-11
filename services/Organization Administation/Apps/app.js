const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {
    post_app: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const appsCollectionName = process.env.APPS_COLLECTION;

            const newObjectId = new ObjectId();

            const appSchema = {
                _id: newObjectId,
                appId: newObjectId.toHexString(),
                appName: req.body.appName,
                orgId: req.body.orgId,
                roles: req.body.roles,
                createdOn: new Date()
            };

            const result = await db.collection(appsCollectionName).insertOne(appSchema);
            return res.json({ token: '200', response: 'Successfully created in database', app: appSchema });
        } catch (err) {
            console.error('Error creating instance:', err);
            return res.status(500).json({ token: '500', response: 'Failed to create apps records', error: err.message });
        }
    },

    get_app: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const appsCollectionName = process.env.APPS_COLLECTION;

            // const projection = { DataType: 1, _id: 0 };
            const result = await db.collection(appsCollectionName).find({}).toArray();
            if (result) {
                return res.json({ token: '200', apps: result });
            } else {
                return res.status(404).json({ error: 'apps not found' });
            }
        } catch (err) {
            console.error('Error fetching data from MongoDB:', err);
            return res.status(500).json({ error: 'Error fetching data from MongoDB', details: err.message });
        }
    },

    get_app_ID: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const CollectionName = process.env.APPS_COLLECTION;

            const appId = req.params.id;

            if (!ObjectId.isValid(appId)) {
                return res.status(204).json({ error: 'Invalid appId' });
            }

            const appJson = await db.collection(CollectionName).find({ appId: appId }).toArray();

            if (appJson.length > 0) {
                return res.status(200).json({
                    token: '200',
                    response: 'Successfully fetched grp Json',
                    appJson
                });
            } else {
                return res.status(204).json({ error: 'No grp found for this Id' });
            }
        } catch (err) {
            console.error('Error fetching appJson:', err);
            return res.status(500).json({
                error: 'Error fetching appJson',
                details: err.message
            });
        }
    },

    update_app: async function (req, res, next) {
        try {
          const db = await connectToMongoDB();
          const CollectionName = process.env.APPS_COLLECTION;
    
          const { appId } = req.body;
    
          if (!appId || appId.trim() === "") {
            return res.status(400).json({
              token: "400",
              response: "appId is required and cannot be empty",
            });
          }
    
          const existingapp = await db
            .collection(CollectionName) 
            .findOne({ appId });
          if (!existingapp) {
            return res.status(404).json({
              token: "404",
              response:"records not found with the provided appId",
            });
          }
    
          const updatedapp = {
            appName: req.body.appName || existingapp.appName,
            orgId:
              req.body.orgId || existingapp.orgId,
              roles:
              req.body.roles || existingapp.roles,
          };
    
          await db
            .collection(CollectionName)
            .updateOne({ appId }, { $set: updatedapp });
    
          return res.json({
            token: "200",
            response: "Successfully updated",
            updatedapp,
          });
        } catch (err) {
          console.error("Error while updating:", err);
          return res.status(500).json({
            token: "500",
            response: "Failed to update",
            error: err.message,
          });
        }
      },
};