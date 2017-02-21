/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const watsonDiscovery = require('./watson_discovery').watsonDiscoveryResponse;
const rp = require('request-promise');
const config = require('./../config/config');

//This is the entry point of all the messages from the user
const processMessage = (req, res) => {
    console.log('**** Inside processMessage **** \n', req.body);
    console.log('**** Inside processMessage **** \n', req.body.context, req.body.input);

    if (!req.body.user || !req.body.input || !req.body.callbackURL) {
        res.status(500).json('User properties, input and callbackURL is required');
    } else {
        res.status(200).send('Ok');


        //This the User Object which will contain the user information like Username and access details
        //TODO: Need to use this to restrict the data shown to the user
        let userObj = req.body.user || {};
        let context = req.body.context || {};
        let payload = {
            workspace_id: config.watsonCoversation.workspaceId,
            context: context,
            input: req.body.input || {},
            callbackURL: req.body.callbackURL
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
                        query: data.input.text,
                        callbackURL: data.callbackURL
                    })
                } else {

                    let options = {
                        method: 'POST',
                        uri: data.callbackURL,
                        body: {
                            result: data.output.text[0],
                            context: context
                        },
                        json: true
                    };
                    rp(options);
                    return Promise.reject();
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

                    let options = {
                        method: 'POST',
                        uri: discoveryData.callbackURL,
                        body: {
                            count: outputArray.length,
                            result: outputArray,
                            context: context
                        },
                        json: true
                    };
                    rp(options);

                } else {
                    let options = {
                        method: 'POST',
                        uri: discoveryData.callbackURL,
                        body: {
                            result: discoveryData.result,
                            context: context
                        },
                        json: true
                    };
                    rp(options);
                }
                return Promise.reject();
            })
            .catch(err => {
                if (err) {
                    let options = {
                        method: 'POST',
                        uri: err.callbackURL,
                        body: {
                            result: 'Sorry something went wrong. Please try again after sometime.',
                            context: context
                        },
                        json: true
                    };
                    rp(options);
                }
            });
    }
};

module.exports = {
    processMessage: processMessage
};