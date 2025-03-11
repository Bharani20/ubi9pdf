const express = require('express');
const connectToMongoDB = require('../../../config/connection');
const utils = require('../../../utils');
const { ObjectId } = require('mongodb');

require('dotenv').config();

module.exports = {

    post_Idt: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.IDT_COLLECTION;
            const odt_collectionName = process.env.ODT_COLLECTION;

            const newObjectId = new ObjectId();
            const templateId = newObjectId.toHexString();

            const templateName = req.body.templateName;

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

            const templateObjjson = {
                handle: req.body.templateObj.handle,
                margin: req.body.templateObj.margin,
                float: req.body.templateObj.float,
                minRow: req.body.templateObj.minRow,
                cellHeight: req.body.templateObj.cellHeight,
                draggable: {
                    handle: req.body.templateObj.draggable.handle,
                },
            };

            const idtSchema = {
                _id: newObjectId,
                templateId,
                templateName: req.body.templateName,
                templateType: req.body.templateType,
                templateWidth: req.body.templateWidth,
                templateHeight: req.body.templateHeight,
                templateObj: templateObjjson
            };

            const result = await db.collection(collectionName).insertOne(idtSchema);


            const attributePromises = req.body.templateObj.children.map(async (attribute) => {
                const newAttributeObjectId = new ObjectId();

                const attributeDocument = {
                    _id: newAttributeObjectId,
                    OdtId: newAttributeObjectId.toHexString(),
                    templateId,
                    idtId: templateId,
                    ...attribute
                };

                return db.collection(odt_collectionName).insertOne(attributeDocument);
            });

            await Promise.all(attributePromises);

            return res.json({ token: '200', response: 'Successfully created in database', idtJson: idtSchema });
        } catch (err) {
            console.error('Error creating idt json:', err);
            return res.status(500).json({ token: '500', response: 'Failed to create json', error: err.message });
        }
    },

    get_Idt: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const collectionName = process.env.IDT_COLLECTION;
            const projection = { idtId: 1, templateId: 1, templateName: 1, templateType: 1, templateWidth: 1, templateHeight: 1, _id: 0 };

            const result = await db.collection(collectionName).find({}, { projection }).toArray();
            if (result) {
                return res.json({ token: '200', idtJson: result });
            } else {
                return res.status(404).json({ error: 'idtJson not found' });
            }
        } catch (err) {
            console.error('Error fetching data from MongoDB:', err);
            return res.status(500).json({ error: 'Error fetching data from MongoDB', details: err.message });
        }
    },

    get_Idt_ID: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const CollectionName = process.env.IDT_COLLECTION;

            const templateId = req.params.id;

            if (!ObjectId.isValid(templateId)) {
                return res.status(400).json({ error: 'Invalid templateId' });
            }

            const idtJson = await db.collection(CollectionName).find({ idtId: templateId }).toArray();

            if (idtJson.length > 0) {
                return res.status(200).json({
                    token: '200',
                    response: 'Successfully fetched idtJson',
                    idtJson
                });
            } else {
                return res.status(404).json({ error: 'No idtJson found for this templateId' });
            }
        } catch (err) {
            console.error('Error fetching idtJson:', err);
            return res.status(500).json({
                error: 'Error fetching idtJson',
                details: err.message
            });
        }
    },

    get_Idt_ID_lookUp: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const odtCollectionName = process.env.ODT_COLLECTION;
            const attributeCollectionName = process.env.ATTRIBUTE_COLLECTION;

            const templateId = req.params.id;

            if (!ObjectId.isValid(templateId)) {
                return res.status(400).json({ error: 'Invalid templateId' });
            }

            const idtJson = await db.collection(odtCollectionName).findOne({ templateId: templateId });

            const data = idtJson.value;
            const json1 = await db.collection(attributeCollectionName).findOne({ value: data });

            if (json1) {
                return res.json({ token: '200', result: json1 });
            } else {
                return res.status(404).json({ error: 'attribute not found' });
            }
        } catch (err) {
            console.error('Error fetching idtJson:', err);
            return res.status(500).json({
                error: 'Error fetching idtJson',
                details: err.message
            });
        }
    },

    // get_Idt_Odt_Mapping: async function (req, res, next) {
    //     try {
    //         const db = await connectToMongoDB();
    //         const idtCollectionName = process.env.IDT_COLLECTION;
    //         const odtCollectionName = process.env.ODT_COLLECTION;

    //         const templateId = req.params.id;

    //         if (!ObjectId.isValid(templateId)) {
    //             return res.status(400).json({ error: 'Invalid templateId' });
    //         }

    //         // Fetch Data From IDT Collection
    //         const idtJson = await db.collection(idtCollectionName).findOne({ idtId: templateId });
    //         // Validate input IDT JSONs
    //         if (!idtJson) {
    //             return res.status(400).json({ error: 'IDT Template data is Empty' });
    //         }
    //         // Fetch Data From ODT Collection
    //         const odtJson = await db.collection(odtCollectionName).find({ idtId: templateId }).toArray();

    //         // Validate input ODT JSONs
    //         if (!odtJson) {
    //             return res.status(400).json({ error: 'ODT Template data is Empty' });
    //         }
    //         // Clone IDTjson to prevent mutations
    //         const responseJSON = { ...idtJson };

    //         // Add children to templateObj
    //         if (!responseJSON.templateObj.children) {
    //             responseJSON.templateObj.children = [];
    //         }
    //         // Add elements from odtJson to the children array
    //         odtJson.forEach((odtItem) => {
    //             responseJSON.templateObj.children.push({
    //                 id: odtItem.id,
    //                 OdtId: odtItem.odtId,
    //                 w: odtItem.w,
    //                 h: odtItem.h || 1, // Default height to 1 if not specified
    //                 selector: odtItem.selector,
    //                 input: odtItem.input,
    //                 inputOdt: odtItem.inputOdt,
    //                 x: odtItem.x,
    //                 y: odtItem.y,
    //             });
    //         });
    //         if (responseJSON) {
    //             return res.json({ token: '200', responseJSON });
    //         } else {
    //             return res.status(404).json({ error: 'Data not found' });
    //         }
    //     } catch (err) {
    //         console.error('Error fetching idtJson:', err);
    //         return res.status(500).json({
    //             error: 'Error fetching idtJson',
    //             details: err.message
    //         });
    //     }
    // },


    get_Idt_Odt_Mapping: async function (req, res, next) {
        try {
            const db = await connectToMongoDB();
            const idtCollectionName = process.env.IDT_COLLECTION;
            const odtCollectionName = process.env.ODT_COLLECTION;
    
            const templateId = req.params.id;
    
            if (!ObjectId.isValid(templateId)) {
                return res.status(400).json({ error: 'Invalid templateId' });
            }
    
            const idtJson = await db.collection(idtCollectionName).findOne({ idtId: templateId });
            if (!idtJson) {
                return res.status(400).json({ error: 'IDT Template data is Empty' });
            }
    
            const odtJson = await db.collection(odtCollectionName).find({ idtId: templateId }).toArray();
            if (!odtJson) {
                return res.status(400).json({ error: 'ODT Template data is Empty' });
            }
    
            // Clone IDTjson to prevent mutations
            const responseJSON = { ...idtJson };
    
            // Add children to templateObj
            if (!responseJSON.templateObj.children) {
                responseJSON.templateObj.children = [];
            }
    
            // finding whether it is static or attribute
            const findStyleType = (obj) => {
                if (typeof obj !== "object" || obj === null) return null;
            
                for (const key in obj) {
                    if (key === "type" && (obj[key] === "Static" || obj[key] === "Attribute")) {
                        return obj[key];
                    }
            
                    if (typeof obj[key] === "object") {
                        const result = findStyleType(obj[key]);
                        if (result) return result;
                    }
                }
                return null; 
            };
            
    
            // Add elements from odtJson to the children array
            odtJson.forEach((odtItem) => {
                const styleType = findStyleType(odtItem.inputOdt);
            
                const isStaticStyle = styleType === "Static";
                const isMatchingSelector = ["app-primeng-sbar", "app-primeng-shbar", "app-primeng-line"].includes(odtItem.selector);
            
                if (isStaticStyle || isMatchingSelector) {

                    let updatedInput = { ...odtItem.input };
                    let updateOdtInput = { ...odtItem.inputOdt};                    

                    // If input.label exists, replace it with content
                    if (updatedInput.label) {
                        updatedInput.label = updateOdtInput.label.content;
                    }
                    else if(updateOdtInput.content){
                        updatedInput.content = updateOdtInput.content.content;
                    }
                    
                    responseJSON.templateObj.children.push({
                        id: odtItem.id,
                        OdtId: odtItem.odtId,
                        w: odtItem.w,
                        h: odtItem.h || 1,
                        selector: odtItem.selector,
                        input: updatedInput,
                        inputOdt: odtItem.inputOdt,
                        x: odtItem.x,
                        y: odtItem.y,
                    });
                } else if (styleType === "Attribute") {
                    let newValue = odtItem.inputOdt?.value;
                    if (!odtItem.input?.value || odtItem.input.value === "") {
                        newValue = odtItem.inputOdt?.value?.name || "";
                    }
            
            
                    responseJSON.templateObj.children.push({
                        id: odtItem.id,
                        OdtId: odtItem.odtId,
                        w: odtItem.w,
                        h: odtItem.h || 1,
                        selector: odtItem.selector,
                        input: { ...odtItem.input, value: newValue },
                        inputOdt: odtItem.inputOdt,
                        x: odtItem.x,
                        y: odtItem.y,
                    });
                } else {
                    responseJSON.templateObj.children.push({
                        id: odtItem.id,
                        OdtId: odtItem.odtId,
                        w: odtItem.w,
                        h: odtItem.h || 1,
                        selector: odtItem.selector,
                        input: odtItem.input,
                        inputOdt: odtItem.inputOdt,
                        x: odtItem.x,
                        y: odtItem.y,
                    });
                }
            });
            
    
            if (responseJSON) {
                return res.json({ token: '200', responseJSON });
            } else {
                return res.status(404).json({ error: 'Data not found' });
            }
        } catch (err) {
            console.log(err)
            return res.status(500).json({
                error: 'Error fetching idtJson',
                details: err.message
            });
        }
    },
    
        
    get_idt_list: async function (req, res, next) {
        try {
            let filters = {}
            const db = await connectToMongoDB();
            const idtCollectionName = process.env.IDT_COLLECTION;
            const appId = req.body.appId;
            const templateType = req.body.templateType;
            if (appId) {
                filters = {
                    appId: appId,
                    templateType: templateType
                }
            }
            else {
                filters = {
                    templateType: templateType
                }
            }
            const idtList = await db.collection(idtCollectionName).find(filters).toArray();
            return res.json({ token: '200', idtList: idtList });

        } catch (err) {
            console.error('Error fetching Idt List:', err);
            return res.status(500).json({
                error: 'Error fetching Idt List',
                details: err.message
            });
        }
    }


};
