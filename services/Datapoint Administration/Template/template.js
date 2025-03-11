const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {
    // post_template: async function (req, res, next) {    
    //     try {
    //         const db = await connectToMongoDB();
    //         const collectionName = process.env.TEMPLATE_COLLECTION;
    //         const idtCollectionName = process.env.IDT_COLLECTION;
    //         const odtCollectionName = process.env.ODT_COLLECTION;

    //         const newObjectId = new ObjectId();
    //         const templateId = newObjectId.toHexString();

    //         const templateName = req.body.templateName;

    //         if (!templateName || templateName.trim() === "") {
    //             return res.status(400).json({
    //                 token: '400',
    //                 response: 'templateName is required and cannot be empty'
    //             });
    //         }

    //         const existingName = await db.collection(collectionName).findOne({ templateName });

    //         if (existingName) {
    //             return res.status(400).json({
    //                 token: '400',
    //                 response: 'Name with the provided templateName already exists'
    //             });
    //         }

    //         const templateType = req.body.templateType;
    //         const templateSchema = {
    //             _id: newObjectId,
    //             templateId,
    //             templateName: req.body.templateName,
    //             templateType: req.body.templateType,
    //             templateWidth: req.body.templateWidth,
    //             templateHeight: req.body.templateHeight,
    //             templateObj: req.body.templateObj,
    //             createdOn: new Date()
    //         };

    //         const result = await db.collection(collectionName).insertOne(templateSchema);

    //         if(templateType === 'Form Design')
    //         {

    //             const eventCardTemplate = templateSchema;
    //             console.log(eventCardTemplate);

    //             const eventCardTemplate_IDT = (() => {
    //                 if (eventCardTemplate.length > 0) {
    //                   const { children, ...restTemplateObj } =
    //                     eventCardTemplate[0].templateObj;
    //                   return {
    //                     ...eventCardTemplate[0],
    //                     templateObj: restTemplateObj,
    //                   };
    //                 }
    //                 return {};
    //               })();

    //               const eventCardTemplate_ODT =
    //               eventCardTemplate[0]?.templateObj?.children || [];

    //               const eventCardTemplate_IDTID = new ObjectId();
    //               console.log(eventCardTemplate_IDT, eventCardTemplate_IDT);


    //               const eventCardTemplate_idtSchema = {
    //                 _id: eventCardTemplate_IDTID,
    //                 idtId: eventCardTemplate_IDTID.toHexString(),
    //                 ...eventCardTemplate_IDT,
    //               };

    //               const eventCardTemplate_idtSchema_result = await db
    //               .collection(idtCollectionName)
    //               .insertOne(eventCardTemplate_idtSchema);

    //               const eventCardTemplate_ODT_promise = eventCardTemplate_ODT.map(
    //                 async (attribute) => {
    //                   const eventCardTemplate_ODTID = new ObjectId();

    //                   const eventCardTemplate_odtSchema = {
    //                     _id: eventCardTemplate_ODTID,
    //                     odtId: eventCardTemplate_ODTID.toHexString(),
    //                     idtId: eventCardTemplate_IDTID.toHexString(),
    //                     templateId: templateId,
    //                     ...attribute,
    //                   };
    //                   return db
    //                     .collection(odtCollectionName)
    //                     .insertOne(eventCardTemplate_odtSchema);
    //                 }
    //               );

    //               await Promise.all(eventCardTemplate_ODT_promise);

    //         }
    //         return res.json({ token: '200', response: 'Successfully created in database', template: templateSchema });
    //     } catch (err) {
    //         console.error('Error creating instance:', err);
    //         return res.status(500).json({ token: '500', response: 'Failed to create entity', error: err.message });
    //     }
    // },

    post_template: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.TEMPLATE_COLLECTION;
            const idtCollectionName = process.env.IDT_COLLECTION;
            const odtCollectionName = process.env.ODT_COLLECTION;
            const entityCollectionName = process.env.ENTITY_COLLECTION;
            const appCollectionName = process.env.APPS_COLLECTION;

            const newObjectId = new ObjectId();
            const templateId = newObjectId.toHexString();

            const templateName = req.body.templateName;
            const entityId = req.body.entityId;
            const appId = req.body.appId;

            if (!templateName || templateName.trim() === "") {
                return res.status(400).json({
                    token: '400',
                    response: 'templateName is required and cannot be empty'
                });
            }

            const existingName = await db.collection(collectionName).findOne({ templateName });

            if (existingName) {
                return res.status(400).json({
                    token: '400',
                    response: 'Name with the provided templateName already exists'
                });
            }

            const templateType = req.body.templateType;
            const templateSchema = {
                _id: newObjectId,
                templateId,
                templateName: req.body.templateName,
                targetForm: req.body?.targetForm,
                templateType: req.body.templateType,
                templateWidth: req.body.templateWidth,
                templateHeight: req.body.templateHeight,
                templateObj: req.body.templateObj,
                createdOn: new Date()
            };

            const result = await db.collection(collectionName).insertOne(templateSchema);

            // if (templateType === 'Form Design') {
            //     const eventCardTemplate = templateSchema;
            //     const eventCardTemplate_IDT = (() => {
            //         if (eventCardTemplate.templateObj && Object.keys(eventCardTemplate.templateObj).length > 0) {
            //             const { children, ...restTemplateObj } = eventCardTemplate.templateObj;
            //             return {
            //                 ...eventCardTemplate,
            //                 templateObj: restTemplateObj
            //             };
            //         }
            //         return {};
            //     })();

            //     const eventCardTemplate_ODT = eventCardTemplate.templateObj?.children || [];

            //     const eventCardTemplate_IDTID = new ObjectId();
            //     const entityFormId = eventCardTemplate_IDTID.toHexString()

            //     const eventCardTemplate_idtSchema = {
            //         _id: eventCardTemplate_IDTID,
            //         idtId: eventCardTemplate_IDTID.toHexString(),
            //         templateId: eventCardTemplate.templateId,
            //         templateName: eventCardTemplate.templateName,
            //         templateType: eventCardTemplate.templateType,
            //         templateWidth: eventCardTemplate.templateWidth,
            //         templateHeight: eventCardTemplate.templateHeight,
            //         templateObj: eventCardTemplate_IDT.templateObj
            //     };

            //     await db.collection(idtCollectionName).insertOne(eventCardTemplate_idtSchema);
            //     const eventCardTemplate_ODT_promise = eventCardTemplate_ODT.map(async (attribute) => {
            //         const eventCardTemplate_ODTID = new ObjectId();
            //         const eventCardTemplate_odtSchema = {
            //             _id: eventCardTemplate_ODTID,
            //             odtId: eventCardTemplate_ODTID.toHexString(),
            //             idtId: eventCardTemplate_IDTID.toHexString(),
            //             templateId: templateId,
            //             ...attribute
            //         };
            //         return db.collection(odtCollectionName).insertOne(eventCardTemplate_odtSchema);
            //     });

            //     await Promise.all(eventCardTemplate_ODT_promise);

            //     //  Code Snippet to update the entity with Form Id
            //     const result = await db.collection(entityCollectionName).updateOne(
            //         { entityOrInstanceId: entityId.id },
            //         { $set: { entityFormId } }
            //     );
            //     return res.json({ token: '200', response: 'Successfully created in database', template: templateSchema, formId: entityFormId });
            // }
            if (templateType === 'Report Design' || templateType === 'Form Design') {
                const eventCardTemplate = templateSchema;

                const eventCardTemplate_IDT = (() => {
                    if (eventCardTemplate.templateObj && Object.keys(eventCardTemplate.templateObj).length > 0) {
                        const { children, ...restTemplateObj } = eventCardTemplate.templateObj;
                        return {
                            ...eventCardTemplate,
                            templateObj: restTemplateObj
                        };
                    }
                    return {};
                })();

                const eventCardTemplate_ODT = eventCardTemplate.templateObj?.children || [];

                const eventCardTemplate_IDTID = new ObjectId();
                const appFormId = eventCardTemplate_IDTID.toHexString()

                const eventCardTemplate_idtSchema = {
                    _id: eventCardTemplate_IDTID,
                    idtId: eventCardTemplate_IDTID.toHexString(),
                    templateId: eventCardTemplate.templateId,
                    templateName: eventCardTemplate.templateName,
                    appId: appId.id,
                    templateType: eventCardTemplate.templateType,
                    targetForm: req.body?.targetForm,
                    templateWidth: eventCardTemplate.templateWidth,
                    templateHeight: eventCardTemplate.templateHeight,
                    templateObj: eventCardTemplate_IDT.templateObj
                };

                await db.collection(idtCollectionName).insertOne(eventCardTemplate_idtSchema);

                const eventCardTemplate_ODT_promise = eventCardTemplate_ODT.map(async (attribute) => {
                    const eventCardTemplate_ODTID = new ObjectId();

                    const eventCardTemplate_odtSchema = {
                        _id: eventCardTemplate_ODTID,
                        odtId: eventCardTemplate_ODTID.toHexString(),
                        idtId: eventCardTemplate_IDTID.toHexString(),
                        templateId: templateId,
                        ...attribute
                    };
                    return db.collection(odtCollectionName).insertOne(eventCardTemplate_odtSchema);
                });

                await Promise.all(eventCardTemplate_ODT_promise);

                //  Code Snippet to update the entity with Form Id
                // const appForms = [{
                //     "reportName": eventCardTemplate.templateName,
                //     "reportId": appFormId
                // }]
                // const result = await db.collection(appCollectionName).updateOne(
                //     { appId: appId.id },
                //     { $set: { appForms } }
                // );
                return res.json({ token: '200', response: 'Successfully created in database', template: templateSchema, formId: appFormId });
            }
            return res.json({ token: '200', response: 'Successfully created in database', template: templateSchema });
        } catch (err) {
            console.error('Error creating instance:', err);
            return res.status(500).json({ token: '500', response: 'Failed to create entity', error: err.message });
        }
    },

    get_template: async function (req, res, next) {
        try {
            let filters = {}
            const templateType = req.body.templateType;
            if (templateType) {
                filters = {
                    templateType: templateType
                }
            }
            const db = await connectToMongoDB();
            const collectionName = process.env.TEMPLATE_COLLECTION;

            const projection = { templateId: 1, templateName: 1, _id: 0 };
            const result = await db.collection(collectionName).find(filters, { projection }).toArray();
            if (result) {
                return res.json({ token: '200', template: result });
            } else {
                return res.status(404).json({ error: 'template not found' });
            }
        } catch (err) {
            console.error('Error fetching data from MongoDB:', err);
            return res.status(500).json({ error: 'Error fetching data from MongoDB', details: err.message });
        }
    },

    get_template_ID: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const CollectionName = process.env.TEMPLATE_COLLECTION;

            const templateId = req.params.id;

            if (!ObjectId.isValid(templateId)) {
                return res.status(400).json({ error: 'Invalid templateId' });
            }

            const idtJson = await db.collection(CollectionName).find({ templateId: templateId }).toArray();

            if (idtJson.length > 0) {
                return res.status(200).json({
                    token: '200',
                    response: 'Successfully fetched idtJson',
                    idtJson
                });
            } else {
                return res.status(404).json({ error: 'No template found for this template Id' });
            }
        } catch (err) {
            console.error('Error fetching idtJson:', err);
            return res.status(500).json({
                error: 'Error fetching idtJson',
                details: err.message
            });
        }
    },
};