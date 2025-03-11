const express = require("express");
const connectToMongoDB = require("../../../config/connection");
// const utils = require('../../../utils');
const { ObjectId } = require("mongodb");
const { all } = require("axios");
const moment = require("moment");
// const { isRegExp } = require('puppeteer');
// const jwt = require("jsonwebtoken");

const { decodeToken } = require("../../../utils");

require("dotenv").config();

module.exports = {
  post_entity: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const entityCollectionName = process.env.ENTITY_COLLECTION;
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const auditCollectionName = process.env.HISTORY_COLLECTION;
      const newEntityObjectId = new ObjectId();
      const entityOrInstanceId = newEntityObjectId.toHexString();
      const entityOrInstanceName = req.body.entityOrInstanceName;

      if (!entityOrInstanceName || entityOrInstanceName.trim() === "") {
        return res.status(400).json({
          token: "400",
          response: "entityOrInstanceName is required and cannot be empty",
        });
      }

      const existingEntity = await db
        .collection(entityCollectionName)
        .findOne({ entityOrInstanceName });

      if (existingEntity) {
        return res.status(400).json({
          token: "400",
          response:
            "Entity with the provided entityOrInstanceName already exists",
        });
      }

      const entitySchema = {
        _id: newEntityObjectId,
        type: req.body.type,
        entityOrInstanceId,
        entityOrInstanceName,
        entityOrInstanceDesc: req.body.entityOrInstanceDesc,
        entityLevel: req.body.entityLevel,
        entityLevelName: req.body.entityLevelName,
        entityLookupId: req.body.entityLookupId,
        entityFormId: req.body.entityFormId,
        createdOn: new Date(),
      };

      const entityResult = await db
        .collection(entityCollectionName)
        .insertOne(entitySchema);

      // Log entity creation in audit_logs
      const auditEntry = {
        entityOrInstanceId,
        collectionName: entityCollectionName,
        operation: "INSERT",
        before: null,
        after: entitySchema,
        modifiedFields: Object.keys(entitySchema),
        performedBy: req.user ? req.user.username : "system",
        timestamp: new Date(),
      };
      await db.collection(auditCollectionName).insertOne(auditEntry);

      const attributePromises = req.body.entityOrInstanceAttribute.map(
        async (attribute) => {
          const newAttributeObjectId = new ObjectId();

          //  added unique lookup and lookUp and commented min,max and parentEntity field and by rangarao
          const attributeDocument = {
            _id: newAttributeObjectId,
            entityOrInstanceId,
            attributeId: newAttributeObjectId.toHexString(),
            attributeName: attribute.attributeName,
            dataPointID: {
              dataType: attribute.dataPointID.dataType,
              dataTypeId: attribute.dataPointID.dataTypeId,
            },
            minValue: attribute.minValue,
            maxValue: attribute.maxValue,
            defaults: attribute.defaults,
            isLookup: attribute.isLookup,
            validationRule: attribute.validationRule,
            acceptedQuality: attribute.acceptedQuality,
            unique: attribute.unique,
            isNull: attribute.isNull,
            decimalPlaces: attribute.decimalPlaces,
            engineeringUnit: attribute.engineeringUnit,
            comments: attribute.comments,
            dataSource: attribute.dataSource,
            authorizationID: attribute.authorizationID,
            value: attribute.value,
            isActive: attribute.isActive,
            lookupId: attribute.lookupId,
            collection: attribute.collection,
            timeSeries: attribute.timeSeries,
            timeSeriesValue: attribute.timeSeriesValue,
            timeFrequency: attribute.timeFrequency,
            calculationTotal: attribute.calculationTotal,
            calculationAverage: attribute.calculationAverage,
            displayComponent: attribute.displayComponent,
            lookupAttribute: attribute.lookupAttribute,
            order: attribute.order,
            alias: attribute.alias
          };

          await db
            .collection(attributeCollectionName)
            .insertOne(attributeDocument);

          // Log attribute creation in audit_logs
          const attributeAuditEntry = {
            entityOrInstanceId,
            collectionName: attributeCollectionName,
            operation: "INSERT",
            before: null,
            after: attributeDocument,
            modifiedFields: Object.keys(attributeDocument),
            performedBy: req.user ? req.user.username : "system",
            timestamp: new Date(),
          };
          return db
            .collection(auditCollectionName)
            .insertOne(attributeAuditEntry);
        }
      );

      await Promise.all(attributePromises);

      return res.json({
        token: "200",
        response: "Successfully created entity and attributes in database",
        entity: entitySchema,
        attributes: req.body.entityOrInstanceAttribute,
      });
    } catch (err) {
      console.error("Error creating entity and attributes:", err);
      return res.status(500).json({
        token: "500",
        response: "Failed to create entity and attributes",
        error: err.message,
      });
    }
  },
  get_entity_sse: async function (req, res, next) {
    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const sendEvent = (data) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      };

      const fetchData = async () => {
        try {
          const db = await connectToMongoDB();
          const collectionName = process.env.ENTITY_COLLECTION;

          const projection = { entityId: 1, entityName: 1, _id: 0 };
          const result = await db
            .collection(collectionName)
            .find({}, { projection })
            .toArray();
          sendEvent(result);
        } catch (err) {
          console.error("Error fetching data from MongoDB:", err);
          sendEvent({
            error: "Error fetching data from MongoDB",
            details: err.message,
          });
        }
      };

      // Fetch data periodically
      const intervalId = setInterval(fetchData, 5000); // Fetch data every 5 seconds

      req.on("close", () => {
        clearInterval(intervalId);
        res.end();
      });
    } catch (err) {
      console.error("Error setting up event stream:", err);
      return next(err);
    }
  },

  get_entity_attributeByID: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const datapointCollectionName = process.env.DATAPOINT_COLLECTION;
      const entityCollectionName = process.env.ENTITY_COLLECTION;

      const entityId = req.params.id;

      if (!ObjectId.isValid(entityId)) {
        return res.status(400).json({ error: "Invalid entityId" });
      }

      const projection = { _id: 0 };
      const entityDocuments = await db
        .collection(entityCollectionName)
        .findOne({ entityOrInstanceId: entityId }, { projection });
      const attributes = await db
        .collection(attributeCollectionName)
        .aggregate([
          {
            $match: { entityOrInstanceId: entityId },
          },
          {
            $lookup: {
              from: datapointCollectionName,
              localField: "dataPointID",
              foreignField: "dataTypeId",
              as: "datapointInfo",
            },
          },
          {
            $unwind: {
              path: "$datapointInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          //  added unique and lookup field by rangarao
          {
            $project: {
              _id: 1,
              entityOrInstanceId: 1,
              attributeId: 1,
              attributeName: 1,
              dataPointID: 1,
              minValue: 1,
              maxValue: 1,
              defaultValue: 1,
              isNull: 1,
              comments: 1,
              dataSource: 1,
              unique: 1,
              isLookup: 1,
              value: 1,
              datapointDataType: "$datapointInfo.dataType",
              displayName: "$datapointInfo.display_name",
              authorizationID: 1,
              isActive: 1,
              sensorDetails: 1,
              parentEntity: 1,
              parentEntityId: 1,
              lookupId: 1,
              defaults: 1,
              displayComponent: 1,
              lookupAttribute: 1,
              order: 1,
              alias: 1,
              collection: 1,
              timeSeries: 1,
              calculationTotal: 1,
              calculationAverage: 1,
              timeFrequency: 1,
              validationRule: 1,
              acceptedQuality: 1,
              decimalPlaces: 1
            },
          },
        ])
        .toArray();

      const attributesList = await Promise.all(
        attributes.map(async (item) => {
          if (item.isLookup && item.lookupId !== null) {
            try {
              const attrList = await db
                .collection(attributeCollectionName)
                .find(
                  { entityOrInstanceId: item.lookupId.entityId },
                  { projection: { attributeId: 1, attributeName: 1 } }
                )
                .toArray();
              return {
                ...item,
                attrList,
              };
            } catch (error) {
              console.error("Error fetching entity attributes:", error);
              return item;
            }
          }
          return item;
        })
      );

      if (attributes.length > 0) {
        return res.status(200).json({
          token: "200",
          response:
            "Successfully fetched entity attributes with datapoint information",
          entityDocuments,
          attributes: attributesList,
        });
      } else {
        return res
          .status(404)
          .json({ error: "No attributes found for this entityId" });
      }
    } catch (err) {
      console.error("Error fetching entity attributes:", err);
      return res.status(500).json({
        error: "Error fetching entity attributes",
        details: err.message,
      });
    }
  },

  get_entity_attribute: async function (req, res, next) {
    try {
      const { type } = req.body;

      if (!type || (type !== "Entity" && type !== "Instance" && type !== "full")) {
        return res.status(400).json({
          token: "400",
          response: "Invalid type provided. Valid options are 'Entity', 'Instance', or 'full'.",
        });
      }

      const appId = req.body.appId;
      const db = await connectToMongoDB();
      const collectionName = process.env.ENTITY_COLLECTION;

      let allRecords = await db.collection(collectionName).find({}).toArray();

      let records = allRecords.filter((record) => type === "full" || record.type === type);

      if (!records || records.length === 0) {
        return res.status(404).json({
          token: "404",
          response: `No records found for type '${type}'`,
        });
      }

      // Creating a lookup map for entityLookupId to entityOrInstanceName
      const entityLookupMap = {};
      allRecords.forEach((entity) => {
        entityLookupMap[entity.entityOrInstanceId] = entity.entityOrInstanceName;
      });

      if (type === "Entity") {
        let enrichedEntities = records.map((entity) => {
          const instanceCount = allRecords.filter(
            (instance) => instance.type === "Instance" && instance.entityLookupId === entity.entityOrInstanceId
          ).length;
          return {
            ...entity,
            InstanceCount: instanceCount,
          };
        });

        if (appId) {
          enrichedEntities = enrichedEntities.filter(
            (entity) => entity.entityLevel === "Application" && entity.entityLevelName.id === appId
          );
        }

        return res.json({
          token: "200",
          response: "Successfully fetched entities and counts",
          Entity_Attributes: enrichedEntities,
        });
      }

      // For Instances, enrich with entityLookupIdName
      const enrichedInstances = records.map((instance) => ({
        ...instance,
        entityLookupIdName: entityLookupMap[instance.entityLookupId] || "Unknown",
      }));

      return res.json({
        token: "200",
        response: "Successfully fetched instances",
        Instances: enrichedInstances,
      });
    } catch (err) {
      console.error("Error fetching data from MongoDB:", err);
      return res.status(500).json({
        token: "500",
        response: "Error fetching data from MongoDB",
        details: err.message,
      });
    }
  },


  // get_entity_attribute: async function (req, res, next) {
  //   try {
  //     const { type } = req.body;

  //     if (
  //       !type ||
  //       (type !== "Entity" && type !== "Instance" && type !== "full")
  //     ) {
  //       return res.status(400).json({
  //         token: "400",
  //         response:
  //           "Invalid type provided. Valid options are 'Entity' or 'Instance'.",
  //       });
  //     }

  //     const appId = req.body.appId;

  //     const db = await connectToMongoDB();
  //     const collectionName = process.env.ENTITY_COLLECTION;
  //     //added by rangarao to fetch all the reords if the type is full
  //     let records = await db
  //       .collection(collectionName)
  //       .find(type === "full" ? {} : { type })
  //       .toArray();

  //     if (!records || records.length === 0) {
  //       return res.status(404).json({
  //         token: "404",
  //         response: `No records found for type '${type}'`,
  //       });
  //     }

  //     if (type === "Entity") {
  //       let enrichedEntities;
  //       let allRecords = await db.collection(collectionName).find({}).toArray();

  //       enrichedEntities = records.map((entity) => {
  //         const instanceCount = allRecords.filter(
  //           (instance) =>
  //             instance.type === "Instance" &&
  //             instance.entityLookupId === entity.entityOrInstanceId
  //         ).length;
  //         return {
  //           ...entity,
  //           InstanceCount: instanceCount,
  //         };
  //       });

  //       if (appId) {
  //         enrichedEntities = enrichedEntities.filter(
  //           (entity) =>
  //             entity.entityLevel === "Application" &&
  //             entity.entityLevelName.id === appId
  //         );
  //       }

  //       return res.json({
  //         token: "200",
  //         response: "Successfully fetched entities and counts",
  //         Entity_Attributes: enrichedEntities,
  //       });
  //     }

  //     console.log(records);


  //     return res.json({
  //       token: "200",
  //       response: "Successfully fetched instances",
  //       Instances: records,
  //     });
  //   } catch (err) {
  //     console.error("Error fetching data from MongoDB:", err);
  //     return res.status(500).json({
  //       token: "500",
  //       response: "Error fetching data from MongoDB",
  //       details: err.message,
  //     });
  //   }
  // },

  update_entity: async function (req, res, next) {
    try {
      const {
        entityOrInstanceId,
        type,
        entityOrInstanceName,
        entityOrInstanceDesc,
        entityOrInstanceAttribute,
        entityLevel,
        entityLevelName,
        entityLookupId,
        entityFormId,
      } = req.body;

      if (!entityOrInstanceId || entityOrInstanceId.trim() === "") {
        return res.status(400).json({
          token: "400",
          response: "entityOrInstanceId is required and cannot be empty",
        });
      }

      const db = await connectToMongoDB();
      const entityCollectionName = process.env.ENTITY_COLLECTION;
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const auditCollectionName = "audit_logs";

      // Fetch the existing entity before update
      const existingEntity = await db
        .collection(entityCollectionName)
        .findOne({ entityOrInstanceId });

      if (!existingEntity) {
        return res.status(404).json({
          token: "404",
          response: "Entity not found with the provided entityOrInstanceId",
        });
      }

      const updatedEntityDetails = {
        type,
        entityOrInstanceName,
        entityOrInstanceDesc,
        entityLevel,
        entityLevelName,
        updatedOn: new Date(),
      };

      // Update the entity
      await db
        .collection(entityCollectionName)
        .updateOne({ entityOrInstanceId }, { $set: updatedEntityDetails });

      // Log the entity update in audit logs
      const entityAuditEntry = {
        entityOrInstanceId,
        collectionName: entityCollectionName,
        operation: "UPDATE",
        before: existingEntity,
        after: { ...existingEntity, ...updatedEntityDetails },
        modifiedFields: Object.keys(updatedEntityDetails),
        performedBy: req.user ? req.user.username : "system",
        timestamp: new Date(),
      };
      await db.collection(auditCollectionName).insertOne(entityAuditEntry);

      // Fetch existing attributes for audit comparison
      const existingAttributes = await db
        .collection(attributeCollectionName)
        .find({ entityOrInstanceId })
        .toArray();
      const attributePromises = entityOrInstanceAttribute.map(
        async (attribute) => {
          const filter = {
            entityOrInstanceId,
            attributeName: attribute.attributeName,
          };

          const existingAttribute = existingAttributes.find(
            (attr) => attr.attributeName === attribute.attributeName
          );

          // added lookup and unique field for update by rangarao
          const update = {
            $set: {
              // dataPointID: attribute.dataPointID,
              // authorizationID: attribute.authorizationID,
              // isLookup: attribute.isLookup,
              // unique: attribute.unique,
              // isActive: attribute.isActive,
              // lookupId: attribute.lookupId,
              // lookupAttribute: attribute.lookupAttribute,
              // order: attribute.order,
              // comments: attribute.comments,
              // dataSource: attribute.dataSource,
              // alias: attribute.alias

              attributeName: attribute.attributeName,
              dataPointID: {
                dataType: attribute.dataPointID.dataType,
                dataTypeId: attribute.dataPointID.dataTypeId,
              },
              minValue: attribute.minValue,
              maxValue: attribute.maxValue,
              defaults: attribute.defaults,
              isLookup: attribute.isLookup,
              validationRule: attribute.validationRule,
              acceptedQuality: attribute.acceptedQuality,
              unique: attribute.unique,
              isNull: attribute.isNull,
              decimalPlaces: attribute.decimalPlaces,
              engineeringUnit: attribute.engineeringUnit,
              comments: attribute.comments,
              dataSource: attribute.dataSource,
              authorizationID: attribute.authorizationID,
              value: attribute.value,
              isActive: attribute.isActive,
              lookupId: attribute.lookupId,
              collection: attribute.collection,
              timeSeries: attribute.timeSeries,
              timeSeriesValue: attribute.timeSeriesValue,
              timeFrequency: attribute.timeFrequency,
              calculationTotal: attribute.calculationTotal,
              calculationAverage: attribute.calculationAverage,
              displayComponent: attribute.displayComponent,
              lookupAttribute: attribute.lookupAttribute,
              order: attribute.order,
              alias: attribute.alias
            },
            $setOnInsert: {
              _id: new ObjectId(),
              attributeId: new ObjectId().toHexString(),
            },
          };

          const result = await db
            .collection(attributeCollectionName)
            .updateOne(filter, update, { upsert: true });

          // Log attribute updates in audit logs
          const attributeAuditEntry = {
            entityOrInstanceId,
            collectionName: attributeCollectionName,
            operation: existingAttribute ? "UPDATE" : "INSERT",
            before: existingAttribute || null,
            after: { ...existingAttribute, ...update.$set },
            modifiedFields: Object.keys(update.$set),
            performedBy: req.user ? req.user.username : "system",
            timestamp: new Date(),
          };
          return db
            .collection(auditCollectionName)
            .insertOne(attributeAuditEntry);
        }
      );

      await Promise.all(attributePromises);

      return res.json({
        token: "200",
        response: "Successfully updated entity and attributes in database",
        entityUpdateResult: updatedEntityDetails,
        attributesUpdated: entityOrInstanceAttribute,
      });
    } catch (err) {
      console.error("Error updating entity and attributes:", err);
      return res.status(500).json({
        token: "500",
        response: "Failed to update entity and attributes",
        error: err.message,
      });
    }
  },

  get_count_entity: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const Entitycollection = process.env.ENTITY_COLLECTION;
      const Eventcollection = process.env.EVENT_COLLECTION;
      const Sensorcollection = process.env.SENSOR_COLLECTION;
      const Flagcollection = process.env.FLAG_COLLECTION;
      const Idtcollection = process.env.IDT_COLLECTION;
      const Attributecollection = process.env.ATTRIBUTE_COLLECTION;

      const entityFilter = { type: "Entity" };
      const instanceFilter = { type: "Instance" };

      const entityCount = await db.collection(Entitycollection).countDocuments(entityFilter);
      const instanceCount = await db.collection(Entitycollection).countDocuments(instanceFilter);
      const sensorCount = await db.collection(Sensorcollection).countDocuments();
      const flagCount = await db.collection(Flagcollection).countDocuments();
      const attributeCount = await db.collection(Attributecollection).countDocuments();
      const eventCount = await db.collection(Eventcollection).countDocuments();
      const reportCount = await db.collection(Idtcollection).countDocuments({ templateType: "Report Design" });
      const formCount = await db.collection(Idtcollection).countDocuments({ templateType: "Form Design" });
      return res.status(200).json([
        { label: "Total Entity", count: entityCount },
        { label: "Total Instance", count: instanceCount },
        { label: "Total Attribute", count: attributeCount },
        { label: "Total Sensors", count: sensorCount },
        { label: "Total Flags", count: flagCount },
        { label: "Total Events", count: eventCount },
        { label: "Report", count: reportCount },
        { label: "Data Update Screen", count: formCount },
      ]);
    } catch (err) {
      console.error("Error fetching collection count:", err);
      return res.status(500).json({
        error: "Error fetching collection count",
        details: err.message,
      });
    }
  },

  // post_attr_value: async function (req, res, next) {
  //     try {
  //         const db = await connectToMongoDB();
  //         const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;

  //         const attributeValues = req.body.attributeValues;

  //         if (!attributeValues || Object.keys(attributeValues).length === 0) {
  //             return res.status(400).json({
  //                 token: '400',
  //                 response: 'attributeValues is required and cannot be empty'
  //             });
  //         }

  //         const attributeUpdates = Object.entries(attributeValues).map(async ([key, obj]) => {
  //             const { id, value } = obj;

  //             if (!id) {
  //                 throw new Error(`Missing id for key: ${key}`);
  //             }

  //             const objectId = new ObjectId(id);

  //             // Find and update the document in the attribute collection
  //             const result = await db.collection(attributeCollectionName).findOneAndUpdate(
  //                 { _id: objectId },
  //                 { $set: { value } },
  //                 { returnDocument: 'after' }
  //             );

  //             if (!result.value) {
  //                 throw new Error(`No document found for id: ${id}`);
  //             }

  //             return result.value;
  //         });

  //         // Wait for all updates to complete
  //         const updatedAttributes = await Promise.all(attributeUpdates);

  //         return res.json({
  //             token: '200',
  //             response: 'Successfully updated attribute values in the database',
  //             updatedAttributes
  //         });
  //     } catch (err) {
  //         console.error('Error updating attributes:', err);
  //         return res.status(500).json({
  //             token: '500',
  //             response: 'Failed to update attribute values',
  //             error: err.message
  //         });
  //     }

  // },

  //   post_attr_value: async function (req, res, next) {
  //     try {
  //       const db = await connectToMongoDB();
  //       const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
  //       const attributeLogsCollectionName = process.env.ATTRIBUTE_lOGS_COLLECTION;
  //       const attributevalueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;

  //       const attributeValues = req.body.attributeValues;
  //       const entityOrInstanceId = req.body.id;
  //       const token = req.headers["authorization"]?.split(" ")[1];
  //       const decoded = await decodeToken(token);
  //       if (!decoded) {
  //         return { error: "Invalid token" };
  //       }
  //       const userName = decoded.payload.userName;

  //       if (!attributeValues || Object.keys(attributeValues).length === 0) {
  //         return res.status(400).json({
  //           token: "400",
  //           response: "attributeValues is required and cannot be empty",
  //         });
  //       }

  //       const attributeUpdates = await Promise.all(
  //         Object.entries(attributeValues).map(async ([key, obj]) => {
  //           const { attributeId, value, required, name, frequency, date } = obj;

  //           if (!attributeId) {
  //             throw new Error(`Missing id for key: ${key}`);
  //           }

  //           if (required && (value === "" || !value)) {
  //             throw new Error(`${name} is required`);
  //           }

  //           const objectId = new ObjectId(attributeId);

  //           // Find the document using entityOrInstanceId
  //           const existingAttribute = await db
  //             .collection(attributeCollectionName)
  //             .findOne({ attributeId: attributeId });
  //           if (!existingAttribute) {
  //             throw new Error(`No document found for id: ${attributeId}`);
  //           }

  //           const attributeName = existingAttribute.attributeName;

  //           const matchingDocumentId = existingAttribute._id;

  //           if (frequency === null || frequency === undefined) {
  //             const result = await db
  //               .collection(attributeCollectionName)
  //               .findOneAndUpdate(
  //                 { _id: matchingDocumentId, dataSource: { $ne: "Sensor" } },
  //                 { $set: { value } },
  //                 { returnDocument: "after" }
  //               );
  //           } else {
  //             console.log(obj);
  //             await db.collection(attributevalueCollection).insertOne(obj);
  //           }
  //           // Attribute Logs Collection Logic

  //           const attributeLogEntry = {
  //             attributeId: attributeId,
  //             attributeName: attributeName,
  //             modifiedBy: userName,
  //             modifiedOn: new Date(),
  //             modifiedValue: value,
  //           };

  //           await db
  //             .collection(attributeLogsCollectionName)
  //             .insertOne(attributeLogEntry);
  //         })
  //       );

  //       return res.json({
  //         token: "200",
  //         response: "Successfully updated attribute values in the database",
  //         updatedAttributes: attributeUpdates,
  //       });
  //     } catch (err) {
  //       console.error("Error updating attributes:", err);
  //       return res.status(500).json({
  //         token: "500",
  //         response: err.message,
  //         error: err.message,
  //       });
  //     }
  //   },

  post_attr_value: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const attributeValues = req.body.attributeValues;
      const entityOrInstanceId = req.body.id;
      const token = req.headers["authorization"]?.split(" ")[1];
      const decoded = await decodeToken(token);
      if (!decoded) {
        return res.status(401).json({ error: "Invalid token" });
      }
      const userName = decoded.payload.userName;
      if (!attributeValues || Object.keys(attributeValues).length === 0) {
        return res.status(400).json({
          token: "400",
          response: "attributeValues is required and cannot be empty",
        });
      }
      const attributeUpdates = await Promise.all(
        Object.entries(attributeValues).map(async ([key, obj]) => {
          const { attributeId, value, required, name, frequency, date } = obj;

          if (!attributeId) {
            throw new Error(`Missing id for key: ${key}`);
          }

          if (required && (value === "" || value === undefined || value === null)) {
            throw new Error(`${name} is required`);
          }
          const objectId = new ObjectId(attributeId);
          // Find the document using attributeId
          const existingAttribute = await db
            .collection(attributeCollectionName)
            .findOne({ attributeId: attributeId });

          if (!existingAttribute) {
            throw new Error(`No document found for id: ${attributeId}`);
          }
          await postFrequencyData(attributeId, frequency, date, value, name, required, userName)

        })
      );

      return res.json({
        token: "200",
        response: "Successfully updated attribute values in the database",
        updatedAttributes: attributeUpdates,
      });
    } catch (err) {
      console.error("Error updating attributes:", err);
      return res.status(500).json({
        token: "500",
        response: err.message,
        error: err.message,
      });
    }
  },




  get_attribute_logs: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const collectionName = process.env.ATTRIBUTE_lOGS_COLLECTION;

      // const projection = { DataType: 1, _id: 0 };
      const result = await db.collection(collectionName).find({}).toArray();
      if (result) {
        return res.status(200).json({ token: "200", Attribute_logs: result });
        // return res.status(200).json(result);
      } else {
        return res.status(404).json({ error: "Attribute not found" });
      }
    } catch (err) {
      console.error("Error fetching data from MongoDB:", err);
      return res
        .status(500)
        .json({
          error: "Error fetching data from MongoDB",
          details: err.message,
        });
    }
  },

  get_attribute_logs_ID: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const CollectionName = process.env.ATTRIBUTE_lOGS_COLLECTION;

      const sensorId = req.params.id;

      if (!ObjectId.isValid(sensorId)) {
        return res.status(204).json({ error: "Invalid sensorId" });
      }

      const sensorJson = await db
        .collection(CollectionName)
        .find({ attributeId: sensorId })
        .toArray();

      if (sensorJson.length > 0) {
        return res.status(200).json({
          token: "200",
          response: "Successfully fetched attributeJson",
          sensorJson,
        });
      } else {
        return res
          .status(204)
          .json({ error: "No sensor found for this attribute Id" });
      }
    } catch (err) {
      console.error("Error fetching attributeIdJson:", err);
      return res.status(500).json({
        error: "Error fetching attributeIdJson",
        details: err.message,
      });
    }
  },

  get_attr_value: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const attributeCollection = process.env.ATTRIBUTE_COLLECTION;
      const entityCollection = process.env.ENTITY_COLLECTION;

      const { attributeId } = req.body;
      if (!attributeId) {
        return res.status(400).json({ error: "attributeId is required" });
      }

      //Find the entityId from Attribute collection
      const attribute = await db
        .collection(attributeCollection)
        .findOne({ attributeId });
      if (!attribute) {
        return res.status(404).json({ error: "Attribute not found" });
      }

      const entityId = attribute.lookupId?.entityId;
      if (!entityId) {
        return res
          .status(404)
          .json({ error: "EntityId not found in attribute" });
      }

      const values = await getLookupDatas(
        attribute.lookupId.entityId,
        attribute.lookupAttribute.attributeName
      );
      const result = values.map((item) => ({
        name: item,
      }));
      // //Find documents from Entity collection where entityLookupId = entityId
      // const entities = await db.collection(entityCollection).find({ entityLookupId: entityId }).toArray();

      // if (entities.length === 0) {
      //     return res.status(404).json({ error: "No entities found for given entityId" });
      // }

      // // Extract all entity IDs from the found entity documents
      // const entityIds = entities.map((entity) => entity.entityOrInstanceId);

      // //Query Attribute collection again to fetch value fields with attributeName == "name"
      // const attributes = await db.collection(attributeCollection).find({
      //     entityOrInstanceId: { $in: entityIds },
      //     attributeName: "Name", // Only fetch attributes where attributeName is "name"
      // }).toArray();

      // const values = attributes.map((attr) => attr.value).filter((value) => value !== null);

      return res.json({ token: "200", values: result });
    } catch (err) {
      console.error("Error fetching data from MongoDB:", err);
      return res.status(500).json({
        error: "Error fetching data from MongoDB",
        details: err.message,
      });
    }
  },

  post_entity_values: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const entityDataCollection = process.env.ENTITY_DATA_COLLECTION;
      const newEntityDataId = new ObjectId();
      const entityDataId = newEntityDataId.toHexString();

      const { entityOrInstanceId } = req.body;
      if (!entityOrInstanceId) {
        return res.status(400).json({ error: "entity Id is required" });
      }

      const entityDataSchema = {
        _id: newEntityDataId,
        entityId: entityOrInstanceId,
        entityOrInstanceDesc: req.body.entityOrInstanceDesc,
        entityLevel: req.body.entityLevel,
        entityLevelName: req.body.entityLevelName,
        entityLookupId: req.body.entityLookupId,
        entityFormId: req.body.entityFormId,
        createdOn: new Date(),
      };

      return res.json({ token: "200", values });
    } catch (err) {
      console.error("Error fetching data from MongoDB:", err);
      return res.status(500).json({
        error: "Error fetching data from MongoDB",
        details: err.message,
      });
    }
  },

  get_count_app_entity: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const Entitycollection = process.env.ENTITY_COLLECTION;
      const Eventcollection = process.env.EVENT_COLLECTION;
      const Appcollection = process.env.APPS_COLLECTION;
      const Sensorcollection = process.env.SENSOR_COLLECTION;
      const Flagcollection = process.env.FLAG_COLLECTION;
      const Attributecollection = process.env.ATTRIBUTE_COLLECTION;
      const Idtcollection = process.env.IDT_COLLECTION;
      const appId = req.body.appId;
      // const entityFilter = { type: "Entity" };

      const entityFilter = {
        type: "Entity",
        entityLevel: "Application",
      };
      const instanceFilter = { type: "Instance" };

      const appDetails = await db
        .collection(Appcollection)
        .findOne({ appId: appId });
      const orgIdArray = appDetails.orgId;

      const applicationEntities = await db
        .collection(Entitycollection)
        .find({
          type: "Entity",
          entityLevel: "Application",
        })
        .toArray();

      const applicationInstances = await db
        .collection(Entitycollection)
        .find({
          type: "Instance",
          entityLevel: "Organization",
        })
        .toArray();

      const filteredEntities = applicationEntities.filter(
        (entity) => entity.entityLevelName.id === appId
      );
      const orgIds = orgIdArray.map((org) => org.id);
      const filteredInstances = applicationInstances.filter((item) =>
        orgIds.includes(item.entityLevelName?.id)
      );
      const entityCount = filteredEntities.length;
      const instanceCount = filteredInstances.length;

      // const entityCount = await db.collection(Entitycollection).countDocuments(entityFilter);
      // const instanceCount = await db.collection(Entitycollection).countDocuments(instanceFilter);
      // const sensorCount = await db.collection(Sensorcollection).countDocuments();
      // const flagCount = await db.collection(Flagcollection).countDocuments();

      const attributes = await db
        .collection(Attributecollection)
        .aggregate([
          {
            $lookup: {
              from: Entitycollection,
              localField: "entityOrInstanceId",
              foreignField: "entityOrInstanceId",
              as: "entity",
            },
          },
          {
            $unwind: "$entity",
          },
          {
            $match: {
              "entity.entityLevel": "Application",
              "entity.entityLevelName.id": appId,
            },
          },
          {
            $count: "count",
          },
        ])
        .toArray();

      const attributeCount = attributes[0]?.count || 0;

      const eventCount = await db.collection(Eventcollection).countDocuments();

      const reportCount = await db
        .collection(Idtcollection)
        .countDocuments({ templateType: "Report Design", appId: appId });
      const formCount = await db
        .collection(Idtcollection)
        .countDocuments({ templateType: "Form Design", appId: appId });

      return res.status(200).json([
        { label: "Total Entity", count: entityCount },
        { label: "Total Instance", count: instanceCount },
        { label: "Total Attribute", count: attributeCount },
        { label: "Total Sensors", count: 0 },
        { label: "Total Flags", count: 0 },
        { label: "Total Events", count: 0 },
        { label: "Report", count: reportCount },
        { label: "Data Update Screen", count: formCount },
      ]);
    } catch (err) {
      console.error("Error fetching collection count:", err);
      return res
        .status(500)
        .json({
          error: "Error fetching collection count",
          details: err.message,
        });
    }
  },

  get_entity_logs: async function (req, res, next) {
    try {
      const entityId = req.body.entityId;
      const db = await connectToMongoDB();
      const auditCollectionName = "audit_logs";

      const records = await db
        .collection(auditCollectionName)
        .find({ entityOrInstanceId: entityId })
        .toArray();

      return res.status(200).json({ token: 200, records });
    } catch (err) {
      console.error("Error fetching collection count:", err);
      return res
        .status(500)
        .json({
          error: "Error fetching collection count",
          details: err.message,
        });
    }
  },

  get_entity_details: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const datapointCollectionName = process.env.DATAPOINT_COLLECTION;
      const entityCollectionName = process.env.ENTITY_COLLECTION;

      const entityId = req.params.id;

      if (!ObjectId.isValid(entityId)) {
        return res.status(400).json({ error: "Invalid entityId" });
      }

      const projection = { _id: 0 };
      const entityDocuments = await db
        .collection(entityCollectionName)
        .findOne({ entityOrInstanceId: entityId }, { projection });
      const attributes = await db
        .collection(attributeCollectionName)
        .aggregate([
          {
            $match: { entityOrInstanceId: entityId },
          },
          {
            $lookup: {
              from: datapointCollectionName,
              localField: "dataPointID",
              foreignField: "dataTypeId",
              as: "datapointInfo",
            },
          },
          {
            $unwind: {
              path: "$datapointInfo",
              preserveNullAndEmptyArrays: true,
            },
          },
          //  added unique and lookup field by rangarao
          {
            $project: {
              _id: 1,
              entityOrInstanceId: 1,
              attributeId: 1,
              attributeName: 1,
              dataPointID: 1,
              defaultValue: 1,
              isNull: 1,
              comments: 1,
              dataSource: 1,
              unique: 1,
              isLookup: 1,
              value: 1,
              datapointDataType: "$datapointInfo.dataType",
              displayName: "$datapointInfo.display_name",
              authorizationID: 1,
              isActive: 1,
              sensorDetails: 1,
              lookupId: 1,
              lookupAttribute: 1,
              order: 1,
              alias: 1
            },
          },
        ])
        .toArray();

      const attributesList = await Promise.all(
        attributes.map(async (item) => {
          if (item.isLookup && item.lookupId !== null) {
            try {
              const attrList = await getLookupDatas(
                item.lookupId.entityId,
                item.lookupAttribute.attributeName
              );
              return {
                ...item,
                attrList,
              };
            } catch (error) {
              console.error("Error fetching entity attributes:", error);
              return item;
            }
          }
          return item;
        })
      );

      if (attributes.length > 0) {
        return res.status(200).json({
          token: "200",
          response:
            "Successfully fetched entity attributes with datapoint information",
          entityDocuments,
          attributes: attributesList,
        });
      } else {
        return res
          .status(404)
          .json({ error: "No attributes found for this entityId" });
      }
    } catch (err) {
      console.error("Error fetching entity attributes:", err);
      return res.status(500).json({
        error: "Error fetching entity attributes",
        details: err.message,
      });
    }
  },

  get_attr_list: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const entityId = req.params.id;
      const attributeCollection = process.env.ATTRIBUTE_COLLECTION;
      const attributes = await db
        .collection(attributeCollection)
        .find(
          { entityOrInstanceId: entityId },
          { projection: { attributeId: 1, attributeName: 1 } }
        )
        .toArray();
      return res.status(200).json({ token: 200, attributes });
    } catch (err) {
      console.error("Error fetching attribute collection:", err);
      return res
        .status(500)
        .json({
          error: "Error fetching attribute collection",
          details: err.message,
        });
    }
  },

  post_monthlytarget_attr: async function (req, res, next) {
    // try {
    //   const db = await connectToMongoDB();
    //   const { attributeId, startDate, endDate, value } = req.body;


    //   if (!attributeId || !startDate || !endDate || value === undefined) {
    //     return res.status(400).json({ error: "Missing required fields" });
    //   }

    //   const attributeValueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;

    //   let currentDate = moment(startDate);
    //   const end = moment(endDate);
    //   const documents = [];

    //   while (currentDate.isSameOrBefore(end, "day")) {
    //     documents.push({
    //       attributeId: attributeId,
    //       date: currentDate.toDate(),
    //       value,
    //       createdOn: new Date(),
    //     });
    //     currentDate.add(1, "day");
    //   }

    //   await db
    //     .collection(attributeValueCollection)
    //     .insertMany(documents);
    //   return res.json({
    //     status: "200",
    //     message: "Data inserted successfully",
    //     count: documents.length,
    //   });
    try {
      const db = await connectToMongoDB();
      const { attributeId, startDate, endDate, value, frequency, attrName } = req.body;

      if (!attributeId || !startDate || !endDate || !value || (value === undefined || value === ' ') || !frequency || !attrName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const attributeValueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;
      let currentDate = moment(startDate);
      const end = moment(endDate);
      let upsertCount = 0;

      while (currentDate.isSameOrBefore(end, "day")) {
        const date = currentDate.toDate();
        const existingRecord = await db.collection(attributeValueCollection).findOne({
          attributeId: attributeId,
          date: date,
        });

        if (existingRecord) {
          await db.collection(attributeValueCollection).updateOne(
            { attributeId: attributeId, date: date },
            { $set: { value, frequency: frequency, name: attrName, updatedOn: new Date() } }
          );
        } else {
          await db.collection(attributeValueCollection).insertOne({
            attributeId: attributeId,
            date: date,
            value,
            frequency: frequency,
            name: attrName,
            createdOn: new Date(),
          });
        }
        upsertCount++;
        currentDate.add(1, "day");
      }

      return res.json({
        status: "200",
        message: "Data inserted/updated successfully",
        count: upsertCount,
      });

    } catch (err) {
      console.error("Error fetching data from MongoDB:", err);
      return res.status(500).json({
        error: "Error fetching data from MongoDB",
        details: err.message,
      });
    }
  },

  get_freq_value_by_date: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const CollectionName = process.env.ATTRIBUTE_VALUE_COLLECTION;

      const { attributeId, startDate, endDate } = req.body;

      if (!ObjectId.isValid(attributeId)) {
        return res.status(204).json({ error: 'Invalid attrbuteId' });
      }

      const attributeJson = await db.collection(CollectionName).find({
        attributeId: attributeId,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }).toArray();

      return res.status(200).json({
        token: '200',
        response: 'Successfully fetched freq values',
        attributeJson
      });
    } catch (err) {
      console.error('Error fetching attrbuteId:', err);
      return res.status(500).json({
        error: 'Error fetching attrbuteId',
        details: err.message
      });
    }
  },

  get_freq_value_for_graph: async function (req, res, next) {
    try {
      const { startDate, endDate, attributeId } = req.body;

      if (!startDate || !endDate || !attributeId) {
        return res.status(400).json({
          success: false,
          message: 'startDate, endDate, and attributeId are required'
        });
      }

      const db = await connectToMongoDB();
      const attributeValueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);


      const query = {
        attributeId: attributeId,
        date: {
          $gte: startDateObj,
          $lte: endDateObj
        }
      };

      const documents = await db.collection(attributeValueCollection).find(query).toArray();

      const labels = [];
      const data = [];
      const dateMap = {};

      documents.forEach(doc => {
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        dateMap[dateStr] = doc.value;
      });

      let currentDate = new Date(startDateObj);
      while (currentDate <= endDateObj) {
        labels.push(await formatDateToDisplay(currentDate));
        const dateKey = currentDate.toISOString().split('T')[0];
        data.push(dateMap[dateKey] ? parseInt(dateMap[dateKey]) : 0);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return res.status(200).json({
        success: true,
        labels,
        data
      });

    } catch (error) {
      console.error('Error fetching attribute data:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching attribute data',
        error: error.message
      });
    }
  },


  get_freq_value_for_excel: async function (req, res, next) {
    try {
      const { attributeName, startDate, endDate, attributeId } = req.body;

      if (!startDate || !endDate || !attributeId) {
        return res.status(400).json({
          success: false,
          message: 'startDate, endDate, and attributeId are required'
        });
      }

      const db = await connectToMongoDB();
      const attributeValueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);


      const query = {
        attributeId: attributeId,
        date: {
          $gte: startDateObj,
          $lte: endDateObj
        }
      };

      const documents = await db.collection(attributeValueCollection).find(query).toArray();

      const labels = [];
      const data = [];
      const dateMap = {};

      documents.forEach(doc => {
        const dateStr = new Date(doc.date).toISOString().split('T')[0];
        dateMap[dateStr] = doc.value;
      });

      let currentDate = new Date(startDateObj);
      while (currentDate <= endDateObj) {
        labels.push(await formatDateToDisplay(currentDate));
        const dateKey = currentDate.toISOString().split('T')[0];
        data.push(dateMap[dateKey] ? parseInt(dateMap[dateKey]) : 0);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Generate CSV content
      let csvContent = `Date,${attributeName}\n`;
      labels.forEach((label, index) => {
        csvContent += `${label},${data[index]}\n`;
      });

      // Set response headers
      res.setHeader('Content-Disposition', 'attachment; filename="attribute_data.csv"');
      res.setHeader('Content-Type', 'text/csv');

      // Send CSV data as response
      res.send(csvContent);


    } catch (error) {
      console.error('Error fetching attribute data:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching attribute data',
        error: error.message
      });
    }
  },

  get_freq_multi_value_for_graph: async function (req, res) {
    try {
      const { startDate, endDate, attributes } = req.body;

      if (!startDate || !endDate || !attributes || !Array.isArray(attributes) || attributes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'startDate, endDate, and attributes array are required'
        });
      }
      const attributeIds = attributes.map(attr => attr.attributeId);

      const attributeNames = {};
      attributes.forEach(attr => {
        if (attr.attributeId && attr.name) {
          attributeNames[attr.attributeId] = attr.name;
        }
      });

      const db = await connectToMongoDB();
      const attributeValueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;


      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);


      const query = {
        attributeId: { $in: attributeIds },
        date: {
          $gte: startDateObj,
          $lte: endDateObj
        }
      };

      const documents = await db.collection(attributeValueCollection).find(query).toArray();


      const labels = [];
      let currentDate = new Date(startDateObj);
      while (currentDate <= endDateObj) {
        labels.push(await formatDateToDisplay(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }


      const dataSets = [];

      // Processing each attribute
      for (const attribute of attributes) {
        const attributeId = attribute.attributeId;

        // Filterin documents for this attributeId
        const attributeDocs = documents.filter(doc => doc.attributeId === attributeId);

        // map of dates to values for this attribute
        const dateMap = {};
        attributeDocs.forEach(doc => {
          const dateStr = new Date(doc.date).toISOString().split('T')[0];
          dateMap[dateStr] = doc.value;
        });

        // Generatin data array for this attribute
        const attributeData = [];
        currentDate = new Date(startDateObj);
        while (currentDate <= endDateObj) {
          const dateKey = currentDate.toISOString().split('T')[0];
          attributeData.push(dateMap[dateKey] ? parseInt(dateMap[dateKey]) : 0);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Adding dataset for this attribute
        dataSets.push({
          label: attribute.name || `Attribute ${attributeId.substring(0, 8)}...`,
          data: attributeData,
          attributeId: attributeId
        });
      }

      return res.status(200).json({
        success: true,
        labels,
        dataSets
      });

    } catch (error) {
      console.error('Error fetching multiple attribute data:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while fetching attribute data',
        error: error.message
      });
    }
  },


  get_freq_multi_value_for_excel: async function (req, res) {
    try {
      const { startDate, endDate, attributes } = req.body;

      if (!startDate || !endDate || !attributes || !Array.isArray(attributes) || attributes.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'startDate, endDate, and attributes array are required'
        });
      }

      const attributeIds = attributes.map(attr => attr.attributeId);
      const attributeNames = {};

      // Mapping the attributes' IDs to their names
      attributes.forEach(attr => {
        if (attr.attributeId && attr.name) {
          attributeNames[attr.attributeId] = attr.name;
        }
      });

      const db = await connectToMongoDB();
      const attributeValueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      // MongoDB query to fetch data
      const query = {
        attributeId: { $in: attributeIds },
        date: {
          $gte: startDateObj,
          $lte: endDateObj
        }
      };

      const documents = await db.collection(attributeValueCollection).find(query).toArray();

      // Generate labels (dates)
      const labels = [];
      let currentDate = new Date(startDateObj);
      while (currentDate <= endDateObj) {
        labels.push(currentDate.toISOString().split('T')[0]); // Format as YYYY-MM-DD
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Prepare the data sets for each attribute
      const dataSets = {};

      for (const attribute of attributes) {
        const attributeId = attribute.attributeId;
        const dateMap = {};

        // Filter documents for the current attributeId
        documents
          .filter(doc => doc.attributeId === attributeId)
          .forEach(doc => {
            const dateStr = new Date(doc.date).toISOString().split('T')[0]; // Format date as YYYY-MM-DD
            dateMap[dateStr] = doc.value;
          });

        // Generate data array for the current attribute
        const attributeData = labels.map(dateKey => (dateMap[dateKey] ? parseInt(dateMap[dateKey]) : 0));

        // Add the data for the current attribute to the dataset
        dataSets[attribute.name] = attributeData;
      }

      // Generate CSV content
      let csvContent = `Date,${attributes.map(attr => attr.name).join(',')}\n`;

      labels.forEach((date, index) => {
        const row = [date, ...attributes.map(attr => dataSets[attr.name][index])].join(',');
        csvContent += `${row}\n`;
      });

      // Set response headers to indicate a file download
      res.setHeader('Content-Disposition', 'attachment; filename="attribute_data.csv"');
      res.setHeader('Content-Type', 'text/csv');

      // Send the generated CSV content as the response
      res.send(csvContent);

    } catch (error) {
      console.error('Error generating CSV file:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while generating CSV file',
        error: error.message,
      });
    }
  },



  update_freq_value_by_id: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const CollectionName = process.env.ATTRIBUTE_VALUE_COLLECTION;

      const attributeId = req.body.attributeId;
      const value = req.body.value;

      if (!ObjectId.isValid(attributeId)) {
        return res.status(204).json({ error: 'Invalid attrbuteId' });
      }


      const attributeJson = await db.collection(CollectionName).findOneAndUpdate({ _id: new ObjectId(attributeId) }, { $set: { value: value } });

      if (attributeJson.length > 0) {
        return res.status(200).json({
          token: '200',
          response: 'Updated Successfully',
        });
      } else {
        return res.status(204).json({ error: 'No sensor found for this attrbute Id' });
      }
    } catch (err) {
      console.error('Error updating value:', err);
      return res.status(500).json({
        error: 'Error updating value',
        details: err.message
      });
    }
  },


  get_monthlytarget_attr_ID: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const CollectionName = process.env.ATTRIBUTE_VALUE_COLLECTION;

      const attrbuteId = req.params.id;

      if (!ObjectId.isValid(attrbuteId)) {
        return res.status(204).json({ error: 'Invalid attrbuteId' });
      }

      const attributeJson = await db.collection(CollectionName).find({ attributeId: attrbuteId }).toArray();

      if (attributeJson.length > 0) {
        return res.status(200).json({
          token: '200',
          response: 'Successfully fetched attrbuteId',
          attributeJson
        });
      } else {
        return res.status(204).json({ error: 'No sensor found for this attrbute Id' });
      }
    } catch (err) {
      console.error('Error fetching attrbuteId:', err);
      return res.status(500).json({
        error: 'Error fetching attrbuteId',
        details: err.message
      });
    }
  },

  // added by rangarao on 13-02-2025
  get_attr_by_id: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const Attributecollection = process.env.ATTRIBUTE_COLLECTION;
      const attrbuteId = req.body?.attributeId;
      if (!attrbuteId) {
        return res
          .status(500)
          .json({
            error: "Attribute Id is required",
            details: "Please provide the attribute Id",
          });
      }
      console.log(attrbuteId);
      const attribute = await db
        .collection(Attributecollection)
        .findOne({ attributeId: attrbuteId });
      return res.status(200).json({ token: 200, attribute: attribute });
    } catch (err) {
      console.error("Error fetching collection count:", err);
      return res
        .status(500)
        .json({
          error: "Error fetching attributes list",
          details: err.message,
        });
    }
  },

  // added by rangarao on 13-02-2025
  get_attribute_list: async function (req, res, next) {
    try {
      const appId = req.body?.appId;
      const db = await connectToMongoDB();
      const Attributecollection = process.env.ATTRIBUTE_COLLECTION;
      const Entitycollection = process.env.ENTITY_COLLECTION;
      let attributes;
      if (appId) {
        attributes = await db
          .collection(Attributecollection)
          .aggregate([
            {
              $lookup: {
                from: Entitycollection,
                localField: "entityOrInstanceId",
                foreignField: "entityOrInstanceId",
                as: "entity",
              },
            },
            {
              $unwind: "$entity",
            },
            {
              $match: {
                "entity.entityLevel": "Application",
                "entity.entityLevelName.id": appId,
              },
            },

          ])
          .toArray();
      } else {
        // attributes = await db.collection(Attributecollection).find().toArray();
        attributes = await db
          .collection(Attributecollection)
          .aggregate([
            {
              $lookup: {
                from: Entitycollection,
                localField: "entityOrInstanceId",
                foreignField: "entityOrInstanceId",
                as: "entity"
              }
            },
            { $unwind: "$entity" },
            {
              $addFields: {
                entityOrInstanceName: "$entity.entityOrInstanceName"
              }
            },
            {
              $project: {
                entity: 0
              }
            }
          ])
          .toArray();
      }

      return res.status(200).json([{ token: 200, attributes: attributes }]);
    } catch (err) {
      console.error("Error fetching collection count:", err);
      return res
        .status(500)
        .json({
          error: "Error fetching attributes list",
          details: err.message,
        });
    }
  },

  // added by rangarao on 13-02-2025
  create_attribute: async function (req, res, next) {
    try {
      const attribute = req.body;
      const db = await connectToMongoDB();
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const newAttributeObjectId = new ObjectId();
      const attributeDocument = {
        _id: newAttributeObjectId,
        entityOrInstanceId: attribute.entityId,
        attributeId: newAttributeObjectId.toHexString(),
        attributeName: attribute.attributeName,
        dataPointID: {
          dataType: attribute.dataType.dataType,
          dataTypeId: attribute.dataType.dataTypeId,
        },
        minValue: attribute.minValue,
        maxValue: attribute.maxValue,
        defaults: attribute.defaults,
        isLookup: attribute.isLookup,
        validationRule: attribute.validationRule,
        acceptedQuality: attribute.acceptedQuality,
        unique: attribute.unique,
        isNull: attribute.nullable,
        decimalPlaces: attribute.decimalPlaces,
        engineeringUnit: attribute.engineeringUnit,
        comments: attribute.comments,
        dataSource: attribute.dataSource,
        authorizationID: attribute.authorizationID,
        value: attribute.value,
        isActive: attribute.isActive,
        lookupId: attribute.lookupId,
        collection: attribute.collection,
        timeSeries: attribute.timeSeries,
        timeFrequency: attribute.timeFrequency,
        calculationTotal: attribute.calculationTotal,
        calculationAverage: attribute.calculationAverage,
        displayComponent: attribute.displayComponent,
        lookupAttribute: attribute.lookupAttribute,
        alias: attribute.alias,
        createdOn: new Date(),
        order: 0,
      };
      await db.collection(attributeCollectionName).insertOne(attributeDocument);
      return res.json({
        token: "200",
        response: "Successfully created attribute in database",
        attributes: req.body,
      });
    } catch (err) {
      console.error("Error creating attribute:", err);
      return res.status(500).json({
        token: "500",
        response: "Failed to create attribute",
        error: err.message,
      });
    }
  },

  update_attribute: async function (req, res, next) {
    try {
      const db = await connectToMongoDB();
      const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
      const attribute = req.body.attribute;
      const attributeId = req.body.attributeId;
      const result = await db.collection(attributeCollectionName).updateOne(
        { attributeId: attributeId },
        {
          $set: {
            attributeName: attribute.attributeName,
            dataPointID: {
              dataType: attribute.dataType.dataType,
              dataTypeId: attribute.dataType.dataTypeId,
            },
            minValue: attribute.minValue,
            maxValue: attribute.maxValue,
            defaults: attribute.defaults,
            isLookup: attribute.isLookup,
            validationRule: attribute.validationRule,
            acceptedQuality: attribute.acceptedQuality,
            unique: attribute.unique,
            isNull: attribute.nullable,
            decimalPlaces: attribute.decimalPlaces,
            engineeringUnit: attribute.engineeringUnit,
            comments: attribute.comments,
            dataSource: attribute.dataSource,
            authorizationID: attribute.authorizationID,
            isActive: attribute.isActive,
            lookupId: attribute.lookupId,
            collection: attribute.collection,
            timeSeries: attribute.timeSeries,
            timeFrequency: attribute.timeFrequency,
            calculationTotal: attribute.calculationTotal,
            calculationAverage: attribute.calculationAverage,
            displayComponent: attribute.displayComponent,
            lookupAttribute: attribute.lookupAttribute,
            alias: attribute.alias
          },
        }
      );
      console.log(result);
      return res.json({
        token: "200",
        response: "Successfully updated attributes in database",
      });
    } catch (err) {
      console.error("Error updating attribute:", err);
      return res.status(500).json({
        token: "500",
        response: "Failed to update attribute",
        error: err.message,
      });
    }
  },
};

// Added by rangarao

async function getLookupDatas(entityId, attributeName) {
  try {
    const entityCollectionName = process.env.ENTITY_DATA_COLLECTION;
    const db = await connectToMongoDB();
    const results = await db
      .collection(entityCollectionName)
      .find({ entityOrInstanceId: entityId })
      .project({ [`data.${attributeName}`]: 1, _id: 0 })
      .toArray();
    const values = results
      .map((item) => item.data[attributeName])
      .filter((value) => value !== undefined);
    return values;
  } catch (error) {
    console.error(error);
    return [];
  }
}

// Added by rangarao to post the frequency data
async function postFrequencyData(attributeId, frequency, date, value, name, required, userName) {
  const attributeLogsCollectionName = process.env.ATTRIBUTE_lOGS_COLLECTION;
  const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;
  const attributevalueCollection = process.env.ATTRIBUTE_VALUE_COLLECTION;
  const db = await connectToMongoDB();
  const inputDate = new Date(date);
  const year = inputDate.getFullYear();
  const month = inputDate.getMonth();
  const day = inputDate.getDate();
  const hour = inputDate.getHours();

  // Helper function for inserting logs
  const insertLog = async (modifiedValue) => {
    await db.collection(attributeLogsCollectionName).insertOne({
      attributeId,
      attributeName: name,
      modifiedBy: userName,
      modifiedOn: new Date(),
      modifiedValue,
    });
  };

  if (frequency === null || frequency === undefined) {
    const result = await db.collection(attributeCollectionName).findOneAndUpdate(
      { attributeId: attributeId, dataSource: { $ne: "Sensor" }, value: { $ne: value } },
      { $set: { value } }
    );
    if (result)
      await insertLog(value);
    return;
  }
  else {
    /**
     * Determines the date range for different frequency types.
     * Supports Hourly, Daily, Weekly, Monthly, Quarterly, Semi-Annual, and Yearly.
     */
    const getDateRange = (frequency, inputDate) => {
      switch (frequency) {
        case "Hour":
          return {
            date: {
              $gte: new Date(year, month, day, hour, 0, 0),
              $lt: new Date(year, month, day, hour + 1, 0, 0),
            },
          };
        case "Day":
          return {
            date: {
              $gte: new Date(year, month, day),
              $lt: new Date(year, month, day + 1),
            },
          };
        case "Week":
          const startOfWeek = new Date(inputDate);
          startOfWeek.setDate(day - inputDate.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
          return { date: { $gte: startOfWeek, $lt: endOfWeek } };
        case "Month":
          return {
            date: {
              $gte: new Date(year, month, 1),
              $lt: new Date(year, month + 1, 1),
            },
          };
        case "Quarter":
          const quarterStartMonth = Math.floor(month / 3) * 3;
          return {
            date: {
              $gte: new Date(year, quarterStartMonth, 1),
              $lt: new Date(year, quarterStartMonth + 3, 1),
            },
          };
        case "Semi-Annual":
          return {
            date: {
              $gte: new Date(year, month < 6 ? 0 : 6, 1),
              $lt: new Date(year, month < 6 ? 6 : 12, 1),
            },
          };
        case "Year":
          return {
            date: {
              $gte: new Date(year, 0, 1),
              $lt: new Date(year + 1, 0, 1),
            },
          };
        default:
          return { date: inputDate };
      }
    };

    const query = { attributeId, frequency, ...getDateRange(frequency, inputDate) };

    const existingEntry = await db.collection(attributevalueCollection).findOne(query);

    if (existingEntry && value !== existingEntry?.value) {

      await db.collection(attributevalueCollection).updateOne(
        { _id: existingEntry._id },
        { $set: { value } }
      );
      await insertLog(value);
    } else {
      await db.collection(attributevalueCollection).insertOne({
        attributeId,
        value,
        required,
        name,
        frequency,
        date: inputDate,
        createdBy: userName,
        createdOn: new Date(),
      });
      await insertLog(value);
    }
  }
}

async function formatDateToDisplay(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}