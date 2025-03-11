const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {
  post_organization: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const organizationCollectionName = process.env.ORGANIZATION_COLLECTION;

      const orgName = req.body.orgName;
      const orgCode = req.body.orgCode;

      if (!orgName || !orgCode) {
        return res.status(400).json({
          token: '400',
          response: 'Org details is required and cannot be empty'
        });
      }


      const newObjectId = new ObjectId();

      const orgSchema = {
        _id: newObjectId,
        orgId: newObjectId.toHexString(),
        orgName: req.body.orgName,
        orgCode: req.body.orgCode,
        createdOn: new Date()
      };

      const result = await db.collection(organizationCollectionName).insertOne(orgSchema);
      return res.json({ token: '200', response: 'Successfully created in database', Organization: orgSchema });
    } catch (err) {
      console.error('Error creating instance:', err);
      return res.status(500).json({ token: '500', response: 'Failed to create Organization records', error: err.message });
    }
  },

  get_organization: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const organizationCollectionName = process.env.ORGANIZATION_COLLECTION;

      // const projection = { DataType: 1, _id: 0 };
      const result = await db.collection(organizationCollectionName).find({}).toArray();
      if (result) {
        return res.json({ token: '200', Organization: result });
      } else {
        return res.status(404).json({ error: 'Organization not found' });
      }
    } catch (err) {
      console.error('Error fetching data from MongoDB:', err);
      return res.status(500).json({ error: 'Error fetching data from MongoDB', details: err.message });
    }
  },

  get_org_ID: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const CollectionName = process.env.ORGANIZATION_COLLECTION;

      const orgId = req.params.id;

      if (!ObjectId.isValid(orgId)) {
        return res.status(204).json({ error: 'Invalid orgId' });
      }

      const orgJson = await db.collection(CollectionName).find({ orgId: orgId }).toArray();

      if (orgJson.length > 0) {
        return res.status(200).json({
          token: '200',
          response: 'Successfully fetched Org Json',
          orgJson
        });
      } else {
        return res.status(204).json({ error: 'No Org found for this template Id' });
      }
    } catch (err) {
      console.error('Error fetching orgJson:', err);
      return res.status(500).json({
        error: 'Error fetching orgJson',
        details: err.message
      });
    }
  },

  update_org: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const CollectionName = process.env.ORGANIZATION_COLLECTION;

      const { orgId } = req.body;

      if (!orgId || orgId.trim() === "") {
        return res.status(400).json({
          token: "400",
          response: "orgId is required and cannot be empty",
        });
      }

      const existingJson = await db
        .collection(CollectionName)
        .findOne({ orgId });
      if (!existingJson) {
        return res.status(404).json({
          token: "404",
          response: "records not found with the provided orgId",
        });
      }

      const updatedJson = {
        orgName: req.body.orgName || existingJson.orgName,
        orgCode: req.body.orgCode || existingJson.orgCode,
      };

      await db
        .collection(CollectionName)
        .updateOne({ orgId }, { $set: updatedJson });

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

  get_count: async function (req, res, next) {
    const db = await connectToMongoDB();
    const Orgcollection = process.env.ORGANIZATION_COLLECTION;
    const Appcollection = process.env.APPS_COLLECTION;
    const Groupcollection = process.env.GROUPS_COLLECTION;
    const Rolecollection = process.env.ROLES_COLLECTION;
    const Shiftcollection = process.env.SHIFT_COLLECTION;
    const Usercollection = process.env.USERS_COLLECTION;


    const orgCount = await db.collection(Orgcollection).countDocuments();
    const appCount = await db.collection(Appcollection).countDocuments();
    const groupCount = await db.collection(Groupcollection).countDocuments();
    const roleCount = await db.collection(Rolecollection).countDocuments();
    const shiftCount = await db.collection(Shiftcollection).countDocuments();
    const userCount = await db.collection(Usercollection).countDocuments();


    return res.status(200).json([
      { label: "Organization", "count": orgCount },
      { label: "Apps", "count": appCount },
      { label: "Groups", "count": groupCount },
      { label: "Roles", "count": roleCount },
      { label: "Shifts", "count": shiftCount },
      { label: "Users", "count": userCount },

    ]);
  }
};