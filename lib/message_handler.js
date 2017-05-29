/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const watsonDiscovery = require('./watson_discovery').watsonDiscoveryResponse;
const snow = require('./snow');
const alchemy = require('./alchemy');
const nlu = require('./natural_language_understanding');
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

        let alchemyKeywords = '';
        watsonConversation(payload)
            .then(data => {
                console.log('*** Conversation Service data ***\n\n', JSON.stringify(data));
                context = data.context || {};
                //Based on the intent from Conversation service, we get the data from SNOW or Watson Discovery Service
                // anything - Watson Discovery Service
                // cloudant - SNOW

                if (data && data.intents && data.intents[0] && data.intents[0].intent === 'anything') {
                    if (data.input.text.length < 3) {
                        ws.send(JSON.stringify({
                            result: 'Sorry, I didn\'t get you. Please rephrase your search.',
                            context: context
                        }));
                        return Promise.reject();
                    } else {
                        if (data.output && data.output.text && data.output.text[0]) {
                            ws.send(JSON.stringify({
                                result: data.output.text[0],
                                context: context
                            }));
                        }

                        let appName = '';
                        let entities = data.entities;
                        if(entities && entities.length > 0){
                            entities.forEach(ent => {
                                if (ent.entity === 'app-name') {
                                    appName = ent.value;
                                }
                            });
                        }
                        return nlu.getKeywords(data.input.text)
                            .then(keyword => {
                                if (keyword) {
                                    alchemyKeywords = keyword;
                                    console.log('Natural language understanding keywords::::::: enriched_Documentation.keywords.text:', keyword);
                                    return watsonDiscovery({
                                        environment_id: config.watsonDiscovery.environment_id,
                                        collection_id: config.watsonDiscovery.collection_id,
                                        query: 'enriched_Documentation.keywords.text:' + keyword
                                    }, msg.input.text, appName, userObj.email, keyword)
                                } else {
                                    return watsonDiscovery({
                                        environment_id: config.watsonDiscovery.environment_id,
                                        collection_id: config.watsonDiscovery.collection_id,
                                        query: data.input.text
                                    },msg.input.text, appName, userObj.email)
                                }
                            })
                            .catch(err => watsonDiscovery({
                                    environment_id: config.watsonDiscovery.environment_id,
                                    collection_id: config.watsonDiscovery.collection_id,
                                    query: data.input.text
                                },msg.input.text, appName, userObj.email));
                    }
                } else if (data && data.intents && data.intents[0] && data.intents[0].intent === 'cloudant') {
                    if (data.output && data.output.text && data.output.text[0]) {
                        ws.send(JSON.stringify({
                            result: data.output.text[0],
                            context: context
                        }));
                    }
                    let ent = data.entities;

                    let snowQuery = snowQueryGenerator(ent);
                    let snowUrlQuery = '';
                    let userName = encodeURIComponent(userObj.fname + " " + userObj.lname);
                    if (snowQuery) {
                        if (snowQuery.priorityNo || snowQuery.incidentNo) {
                            if (snowQuery.priorityNo) {
                                if (snowQuery.issue) {
                                    snowUrlQuery = 'sysparm_query=' + snowQuery.priorityNo + '^active=true^' + snowQuery.issue;
                                } else {
                                    snowUrlQuery = 'sysparm_query=' + snowQuery.priorityNo + '^active=true^assigned_toLIKE' + userName;
                                }
                            }
                            if (snowQuery.incidentNo) {
                                snowUrlQuery = 'sysparm_query=' + snowQuery.incidentNo;
                            }
                        } else if (snowQuery.issue) {
                            snowUrlQuery = 'sysparm_query=active=true^' + snowQuery.issue;
                        } else {
                            snowUrlQuery = 'sysparm_query=active=true^assigned_toLIKE' + userName;
                        }
                        return snow.getSnowIncidentDetails(snowUrlQuery);
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
                    if (data && data.intents && data.intents[0] && data.intents[0].intent === 'bye') {
                        response.event = 'closeWindow';
                    }

                    ws.send(JSON.stringify(response));
                    return Promise.reject();
                }
            })
            .then(finalData => {
                finalData.keyword = alchemyKeywords;
                finalData.question = msg.input.text;
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

//This method builds the Query URL based on the entities reciever from Conversation Service
const snowQueryGenerator = entity => {
    let incidentLocationEnd = '';
    let caseType = '';
    let priority = '';
    let incident = '';
    let issue = '';
    let group = '';
    let isManyGroup = false;

    entity.forEach(e => {
        if (e.entity === 'incident') {
            if (e.value === 'incident') {
                caseType = 'INC';
            } else if (e.value === 'task') {
                caseType = 'TASK'
            }
            incidentLocationEnd = parseInt(e.location[1]);
        }
        if (e.entity === 'priority') {
            priority = 'priority= ' + e.value;
        }
        if (e.entity === 'group-names') {
            if(!isManyGroup){
                group = 'assignment_groupLIKE' + e.value;
                isManyGroup = true;
            } else {
                group = group + '^ORassignment_groupLIKE' + e.value;
            }
        }
        if (e.entity === 'users') {
            issue = 'assigned_toLIKE' + encodeURIComponent(e.value);
        }
    });
    if(issue){
        issue = issue + '^' + group;
    } else {
        issue = group;
    }


    if (incidentLocationEnd || priority || issue) {
        entity.forEach(e => {
            if (e.entity === 'sys-number' && incidentLocationEnd && !priority) {
                incident = 'numberLIKE' + caseType + e.value;
            }
        });
        return {
            incidentNo: incident,
            priorityNo: priority,
            issue: issue,
            caseType: caseType
        }
    } else {
        return '';
    }
};


module.exports = {
    processMessage: processMessage
};