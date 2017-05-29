/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const Conversation = require('watson-developer-cloud/conversation/v1');
const config = require('./../config/config');
const rp = require('request-promise');

//Initialising the Watson Conversation Service
const conversation = new Conversation({
    url: config.watsonCoversation.url,
    version_date: config.watsonCoversation.version_date,
    version: config.watsonCoversation.version
});

//This method hits the Watson Conversation service
const watsonConversationResponse = (payload) => {
    return new Promise((resolve, reject) => {
        conversation.message(payload, function (err, data) {
            if (err) {
                reject({
                    error: err
                });
            }
            console.log('ZXXXXXXXXXXXXXX \n\n',err);
            console.log('$$$$$$$$$$$$$ \n\n',JSON.stringify(data, 0 ,2));
            resolve(updateMessage(data));
        });
    });
};

const updateMessage = response => {
    let responseText = null;
    if (!response.output) {
        response.output = {};
    } else {
        return response;
    }
    if (response.intents && response.intents[0]) {
        let intent = response.intents[0];
        // Depending on the confidence of the response the app can return different messages.
        // The confidence will vary depending on how well the system is trained. The service will always try to assign
        // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
        // user's intent . In these cases it is usually best to return a disambiguation message
        // ('I did not understand your intent, please rephrase your question', etc..)
        if (intent.confidence >= 0.75) {
            responseText = 'I understood your intent was ' + intent.intent;
        } else if (intent.confidence >= 0.5) {
            responseText = 'I think your intent was ' + intent.intent;
        } else {
            responseText = 'I did not understand your intent';
        }
    }
    response.output.text = responseText;
    return response;
};

/*
* This method adds new Value in the app-name entity.
*
* @METHOD: POST
* @payload: {Object}
* @sample-paylod:
* {
*   "value" : "Honda MDM" //The value of the entity to be created
*   "synonyms" : ["mdm"] //Synonyms for the value mentioned above
* }
* */
const addNewAppNameEntity = (req, res) => {
    console.log('********* Inside addNewAppNameEntity *********');
    console.log('Payload ::: \n', req.body);
    rp({
        method: 'POST',
        url : config.watsonCoversation.url + `/v1/workspaces/${config.watsonCoversation.workspaceId}/entities/app-name/values?version=${config.watsonCoversation.version_date}`,
        headers: {
            authorization: `Basic ${config.watsonCoversation.authToken}`,
            'content-type': 'application/json'
        },
        body: JSON.stringify(req.body)
    }).then(data => {
        if(data && JSON.parse(data).value){
            res.status(200).json({success: true});
        } else {
            res.status(400).json({success: false});
        }
    }).catch(err => res.status(400).json({success: false}))
};


module.exports = {
    watsonConversationResponse: watsonConversationResponse,
    addNewAppNameEntity: addNewAppNameEntity
};