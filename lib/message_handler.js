/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const watsonDiscovery = require('./watson_discovery').watsonDiscoveryResponse;
const config = require('./../config/config');

//This is the entry point of all the messages from the user
const processMessage = (req, res) => {
    console.log('**** Inside processMessage **** \n', req.body.context, req.body.input);
    let context = req.body.context || {};

    //This the User Object which will contain the user information like Username and access details
    //TODO: Need to use this to restrict the data shown to the user
    let userObj = req.body.user || {};

    let payload = {
        workspace_id: config.watsonCoversation.workspaceId,
        context: context,
        input: req.body.input || {}
    };

    //TODO: Add the context from Watson Conversation Service and Take user properties as API payload input - Surya

    let collection = config.watsonDiscovery.defaultCollection; // Default collection for Watson Discovery Service
    //TODO : Need to write the logic here whether to get the data from Discovery or Cloudant after the response from Conversation service
    watsonConversation(payload)
        .then(data => {
            console.log('*** Conversation Service data ***\n\n', JSON.stringify(data, 0, 2));
            context = data.context || {};
            //Based on the intent we get the data from Cloudant or Watson Discovery Service
            // anything - Watson Discovery Service
            // cloudant - Cloudant
            if (data && data.intents && data.intents[0] && data.intents[0].intent === 'anything') {
                if (data.entities && data.entities[0] && data.entities[0].entity) {
                    collection = data.entities[0].entity;
                }
                return watsonDiscovery({
                    environment_id: config.watsonDiscovery.environment_id,
                    collection_id: config.watsonDiscovery.collection_id[collection],
                    query: data.input.text
                })
            } else {
                res.json({
                    text: data.output.text[0],
                    context: context
                });
            }
        })
        .then(discoveryData => {
            console.log('***** Discovery Service data ****** \n\n', JSON.stringify(discoveryData, 0, 2));
            if (discoveryData && discoveryData.results && discoveryData.results.length > 0) {
                let outputArray = [];
                discoveryData.results.forEach(dR => {
                    if (dR.score > 0) {
                        outputArray.push(dR);
                    }
                });
                res.json({
                    count: outputArray.length,
                    results: outputArray,
                    context: context
                });
            } else {
                res.json({
                    text: discoveryData,
                    context: context
                });
            }
        })
        .catch(err => res.status(err.code || 500).json(err));
};

module.exports = {
    processMessage: processMessage
};