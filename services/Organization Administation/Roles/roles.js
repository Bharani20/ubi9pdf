const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {
    post_roles: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.ROLES_COLLECTION;

            const newObjectId = new ObjectId();

            const roleSchema = {
                _id: newObjectId,
                roleId: newObjectId.toHexString(),
                roleName: req.body.roleName,
                roleDesc: req.body.roleDesc,
                orgId: req.body.orgId,
                defaultRole: req.body.defaultRole,
                entityLevel: req.body.entityLevel,
                instanceLevel: req.body.instanceLevel,
                approvalNeeded: req.body.approvalNeeded,
                raciMatrix: req.body.raciMatrix,
                createdOn: new Date()
            };

            const result = await db.collection(collectionName).insertOne(roleSchema);
            return res.json({ token: '200', response: 'Successfully created in database', roles: roleSchema });
        } catch (err) {
            console.error('Error creating instance:', err);
            return res.status(500).json({ token: '500', response: 'Failed to create entity', error: err.message });
        }
    },

    get_roles: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.ROLES_COLLECTION;

            // const projection = { DataType: 1, _id: 0 };
            const result = await db.collection(collectionName).find({}).toArray();
            if (result) {
                return res.json({ token: '200', roles: result });
            } else {
                return res.status(404).json({ error: 'Roles not found' });
            }
        } catch (err) {
            console.error('Error fetching data from MongoDB:', err);
            return res.status(500).json({ error: 'Error fetching data from MongoDB', details: err.message });
        }
    },

    get_roles_ID: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const CollectionName = process.env.ROLES_COLLECTION;

            const rolesId = req.params.id;

            if (!ObjectId.isValid(rolesId)) {
                return res.status(204).json({ error: 'Invalid rolesId' });
            }

            const rolesJson = await db.collection(CollectionName).find({ roleId: rolesId }).toArray();

            if (rolesJson.length > 0) {
                return res.status(200).json({
                    token: '200',
                    response: 'Successfully fetched role Json',
                    rolesJson
                });
            } else {
                return res.status(204).json({ error: 'No role found for this template Id' });
            }
        } catch (err) {
            console.error('Error fetching rolesJson:', err);
            return res.status(500).json({
                error: 'Error fetching rolesJson',
                details: err.message
            });
        }
    },

    update_roles: async function (req, res, next) {
        try {
          const db = await connectToMongoDB();
          const CollectionName = process.env.ROLES_COLLECTION;
    
          const { roleId } = req.body;
    
          if (!roleId || roleId.trim() === "") {
            return res.status(400).json({
              token: "400",
              response: "roleId is required and cannot be empty",
            });
          }
    
          const existingJson = await db
            .collection(CollectionName)
            .findOne({ roleId });
          if (!existingJson) {
            return res.status(404).json({
              token: "404",
              response:"records not found with the provided roleId",
            });
          }
    
          const updatedJson = {
            roleName: req.body.roleName || existingJson.roleName,
            roleDesc: req.body.roleDesc || existingJson.roleDesc,
            orgId: req.body.orgId || existingJson.orgId,
            defaultRole: req.body.defaultRole || existingJson.defaultRole,
            entityLevel: req.body.entityLevel || existingJson.entityLevel,
            instanceLevel: req.body.instanceLevel || existingJson.instanceLevel,
            approvalNeeded: req.body.approvalNeeded || existingJson.approvalNeeded,
            raciMatrix: req.body.raciMatrix || existingJson.raciMatrix,
          };
    
          await db
            .collection(CollectionName)
            .updateOne({ roleId }, { $set: updatedJson });
    
          return res.json({
            token: "200",
            response: "Successfully updated",
            updatedJson,
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