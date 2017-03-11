/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const watsonDiscovery = require('./watson_discovery').watsonDiscoveryResponse;
const cloudant = require('./cloudant');
const config = require('./../config/config');


//This is the entry point of all the messages from the user
const processMessage = (message, ws) => {
    console.log('**** Inside processMessage **** \n', message);
    let msg = JSON.parse(message);
    if (!msg.user || !msg.input) {
        //If user object or the input object is not available, sending error.
        ws.send(JSON.stringify({
            error: 'User properties and input is required'
        }));
    } else {
        //This the User Object which will contain the user information like Username and access details
        //TODO: Need to use this to restrict the data shown to the user
        let userObj = msg.user || {};
        let context = msg.context || {};
        let payload = {
            workspace_id: config.watsonCoversation.workspaceId,
            context: context,
            input: msg.input || {}
        };

        let collection = config.watsonDiscovery.defaultCollection; // Default collection for Watson Discovery Service
        watsonConversation(payload)
            .then(data => {
                console.log('*** Conversation Service data ***\n\n', JSON.stringify(data, 0, 2));
                context = data.context || {};
                //Based on the value of the 'flow' attribute in context from Conversation service, we get the data from Cloudant or Watson Discovery Service
                // discovery - Watson Discovery Service
                // cloudant - Cloudant




                /*if (data && data.intents && data.intents[0] && data.intents[0].intent === 'anything') {
                    if (data.entities && data.entities[0] && data.entities[0].entity) {
                        collection = data.entities[0].entity;
                    }
                    if(data.output && data.output.text && data.output.text[0]){
                        ws.send(JSON.stringify({
                            result: data.output.text[0],
                            context: context
                        }));
                    }
                    return watsonDiscovery({
                        environment_id: config.watsonDiscovery.environment_id,
                        collection_id: config.watsonDiscovery.collection_id[collection],
                        query: data.input.text
                    })
                } else if (data && data.intents && data.intents[0] && data.intents[0].intent === 'cloudant') {
                    if(data.output && data.output.text && data.output.text[0]){
                        ws.send(JSON.stringify({
                            result: data.output.text[0],
                            context: context
                        }));
                    }
                    let ent = data.entities;
                    let isIncidentNumber = false;
                    let INCIDENT_ID = '';
                    let isIncident = false;
                    if (ent && ent.length > 0) {
                        ent.forEach(e => {
                            if(e.entity === 'sys-number'){
                                isIncidentNumber = true;
                                INCIDENT_ID = e.value;
                            }
                            if(e.entity === 'incident'){
                                isIncident = true;
                            }
                        })
                    }

                    if(isIncident){
                        if(isIncidentNumber){
                            return cloudant.getIncidentDetails('',INCIDENT_ID);
                        } else {
                            return cloudant.getIncidentDetails('PRIMARY_EMAIL','krishnakchoudhury@in.ibm.com');
                        }
                    } else {
                        ws.send(JSON.stringify({
                            result: 'Sorry I dont have any data.',
                            context: context
                        }));
                        return Promise.reject();
                    }
                } else {
                    ws.send(JSON.stringify({
                        result: data.output.text[0],
                        context: context
                    }));
                    return Promise.reject();
                }*/








                if (data && data.intents && data.intents[0] && data.intents[0].intent === 'anything' && context.flow === "discovery") {
                    delete context.flow;
                    if (data.entities && data.entities[0] && data.entities[0].entity) {
                        collection = data.entities[0].entity;
                    }
                    if(data.output && data.output.text && data.output.text[0]){
                        ws.send(JSON.stringify({
                            result: data.output.text[0],
                            context: context
                        }));
                    }
                    return watsonDiscovery({
                        environment_id: config.watsonDiscovery.environment_id,
                        collection_id: config.watsonDiscovery.collection_id[collection],
                        query: data.input.text
                    })
                } else if (data && data.intents && data.intents[0] && data.intents[0].intent === 'anything' && context.flow === "cloudant") {
                    delete context.flow;
                    let ent = data.entities;
                    let isIncidentNumber = false;
                    let INCIDENT_ID = '';
                    let isIncident = true;
                    if (ent && ent.length > 0) {
                        ent.forEach(e => {
                            if(e.entity === 'sys-number'){
                                isIncidentNumber = true;
                                INCIDENT_ID = e.value;
                            }
                        })
                    }
                    if(isIncident){
                        if(isIncidentNumber){
                            return cloudant.getIncidentDetails('',INCIDENT_ID);
                        } else {
                            return cloudant.getIncidentDetails('PRIMARY_EMAIL','krishnakchoudhury@in.ibm.com');
                        }
                    } else {
                        ws.send(JSON.stringify({
                            result: 'Sorry I dont have any data.',
                            context: context
                        }));
                        return Promise.reject();
                    }

                } else {
                    let response = {
                        result: data.output.text[0],
                        context: context
                    };
                    if(data && data.intents && data.intents[0] && data.intents[0].intent === 'bye'){
                        response.event = 'closeWindoow';
                    }

                    ws.send(JSON.stringify(response));
                    return Promise.reject();
                }
            })
            .then(finalData => {
                finalData.context = context;
                ws.send(JSON.stringify(finalData));
                return Promise.reject();
            })
            .catch(err => {
                if (err) {
                    console.log('Error in message handler --- \n\n', err);
                    ws.send(JSON.stringify({
                        result: 'Sorry something went wrong. Please try again after sometime.',
                        context: context
                    }));
                }
            });
    }
};

module.exports = {
    processMessage: processMessage
};