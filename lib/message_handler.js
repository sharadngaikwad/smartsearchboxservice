/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const config = require('./../config/config');

//This is the entry point of all the messages from the user
const processMessage = (req, res) => {
    console.log('**** Inside processMessage **** \n', req.body.context, req.body.input);
    let payload = {
        workspace_id: config.watsonCoversation.workspaceId,
        context: req.body.context || {},
        input: req.body.input || {}
    };

    //TODO : Need to write the logic here to get the data from Discovery or Cloudant after the response from Conversation service
    watsonConversation(payload)
        .then(data => res.json(data))
        .catch(err => res.status(err.code || 500).json(err));

    //Sample payload for Watson Discovery service
    /*let payload = {
        environment_id: config.watsonDiscovery.environment_id,
        collection_id: config.watsonDiscovery.collection_id,
        query: 'CSK'
    };*/
};

module.exports = {
    processMessage: processMessage
};