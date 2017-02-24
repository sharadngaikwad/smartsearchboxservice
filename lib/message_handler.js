/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const watsonDiscovery = require('./watson_discovery').watsonDiscoveryResponse;
const config = require('./../config/config');

const styleRegEx = /style=\".*?"/gi;
const fontRegEx = /font .*?">/gi;

//This is the entry point of all the messages from the user
const processMessage = (message, ws) => {
    console.log('**** Inside processMessage **** \n', message);
    let msg = JSON.parse(message);
    if (!msg.user || !msg.input) {
        ws.send(JSON.stringify({
            error : 'User properties and input is required'
        }));
        // res.status(500).json('User properties and input is required');
    } else {
        //res.status(200).send('Ok');


        //This the User Object which will contain the user information like Username and access details
        //TODO: Need to use this to restrict the data shown to the user
        let userObj = msg.user || {};
        let context = msg.context || {};
        let payload = {
            workspace_id: config.watsonCoversation.workspaceId,
            context: context,
            input: msg.input || {}
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
                    ws.send(JSON.stringify({
                        result: data.output.text[0],
                        context: context
                    }));
                    return Promise.reject();
                }
            })
            .then(discoveryData => {
                console.log('***** Discovery Service data ****** \n\n', JSON.stringify(discoveryData, 0, 2));
                if (discoveryData && discoveryData.results && discoveryData.results.length > 0) {
                    let outputArray = [];
                    discoveryData.results.forEach(dR => {
                        if (dR.score > 0) {
                            let htmlContent = dR['Documentation with HTML'];
                            //To remove the Style and Font attributes from the HTML content
                            if(styleRegEx.test(htmlContent)){
                                htmlContent = htmlContent.replace(styleRegEx,'');
                            }
                            if(fontRegEx.test(htmlContent)){
                                htmlContent = htmlContent.replace(fontRegEx,'font>');
                            }
                            dR['Documentation with HTML'] = htmlContent;
                            outputArray.push(dR);
                        }
                    });

                    ws.send(JSON.stringify({
                        count: outputArray.length,
                        result: outputArray,
                        context: context
                    }));

                } else {
                    ws.send(JSON.stringify({
                        result: discoveryData.result,
                        context: context
                    }));
                }
                return Promise.reject();
            })
            .catch(err => {
                if (err) {
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