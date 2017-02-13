/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const config = require('./../config/config');


const processMessage = (req, res) => {
    let payload = {
        workspace_id: config.watsonCoversation.workspaceId,
        context: req.body.context || {},
        input: req.body.input || {}
    };

    watsonConversation(payload)
        .then(data => res.json(data))
        .catch(err => res.status(err.code || 500).json(err));
};

module.exports = {
    processMessage: processMessage
};