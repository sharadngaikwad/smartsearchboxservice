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
    let payload = {
        workspace_id: config.watsonCoversation.workspaceId,
        context: req.body.context || {},
        input: req.body.input || {}
    };
    let collection = 'customerDB-UK';
    //TODO : Need to write the logic here whether to get the data from Discovery or Cloudant after the response from Conversation service
    watsonConversation(payload)
        .then(data => {
            console.log('*** Conversation Service data ***\n\n', JSON.stringify(data, 0, 2));
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
                    text: data.output.text[0]
                });
            }
        })
        .then(discoveryData => {
            console.log('***** Discovery Service data ****** \n\n',JSON.stringify(discoveryData,0,2));
            if (discoveryData && discoveryData.results && discoveryData.results.length > 0) {
                let outputArray = [];
                discoveryData.results.forEach(dR => {
                    if (dR.score > 0) {
                        outputArray.push(dR.html);
                    }
                });
                res.json({
                    count: outputArray.length,
                    results: outputArray
                });
            } else {
                res.json({
                    text: discoveryData
                });
            }
        })
        .catch(err => res.status(err.code || 500).json(err));
};

module.exports = {
    processMessage: processMessage
};