/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonConversation = require('./watson_conversation').watsonConversationResponse;
const watsonDiscovery = require('./watson_discovery').watsonDiscoveryResponse;
const cloudant = require('./cloudant');
const snow = require('./snow');
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
                console.log('*** Conversation Service data ***\n\n', JSON.stringify(data));
                context = data.context || {};
                //Based on the value of the 'flow' attribute in context from Conversation service, we get the data from Cloudant or Watson Discovery Service
                // discovery - Watson Discovery Service
                // cloudant - Cloudant

                if (data && data.intents && data.intents[0] && data.intents[0].intent === 'anything') {
                    /*if (data.entities && data.entities[0] && data.entities[0].entity) {
                        collection = data.entities[0].entity;
                    }*/
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

                    let snowQuery = snowQueryGenerator(ent);
                    let snowUrlQuery = '';
                    if(snowQuery){
                        if(snowQuery.priorityNo || snowQuery.incidentNo) {
                            if(snowQuery.priorityNo){
                                if(snowQuery.issue) {
                                    snowUrlQuery = 'sysparm_query='+snowQuery.priorityNo+ '^active=true^'+snowQuery.issue;
                                } else {
                                    snowUrlQuery = 'sysparm_query='+snowQuery.priorityNo+ '^active=true^assigned_toLIKE' + encodeURIComponent('Vineet Singh');
                                }
                            }
                            if(snowQuery.incidentNo){
                                snowUrlQuery = 'sysparm_query='+snowQuery.incidentNo;
                            }

                        } else if(snowQuery.issue){
                            snowUrlQuery = 'sysparm_query=active=true^'+snowQuery.issue;
                        } else {
                            snowUrlQuery = 'sysparm_query=active=true^assigned_toLIKE' + encodeURIComponent('Vineet Singh');
                        }
                        return snow.getSnowIncidentDetails(snowUrlQuery);
                    } else {
                        ws.send(JSON.stringify({
                            result: 'Sorry I dont have any data.',
                            context: context
                        }));
                        return Promise.reject();
                    }








                    /*let query = entityIdentifier(ent);
                    console.log('query --------- \n\n',JSON.stringify(query));
                    let querySelector = {};
                    if(query){
                        if(query.priorityNo || query.incidentNo) {
                            if(query.priorityNo){
                                if(query.issue) {
                                    querySelector = {
                                        $and: [
                                            query.priorityNo,
                                            query.issue
                                        ]
                                    };
                                } else {
                                    querySelector = {
                                        $and: [
                                            query.priorityNo,
                                            {"Assigned To": 'Achin Saxena'}
                                        ]
                                    };
                                }
                            }
                            if(query.incidentNo){
                                querySelector = {
                                    $and: [
                                        {"Case Type": query.caseType},
                                        query.incidentNo
                                    ]
                                };
                            }

                        } else if(query.issue){
                            querySelector = {
                                $and: [
                                    query.issue
                                ]
                            };
                        } else {
                            querySelector = {
                                $and: [
                                    {"Assigned To": 'Achin Saxena'}
                                ]
                            };
                        }
                        return cloudant.getIncidentDetails(querySelector);
                    } else {
                        ws.send(JSON.stringify({
                            result: 'Sorry I dont have any data.',
                            context: context
                        }));
                        return Promise.reject();
                    }*/
                } else {
                    let response = {
                        result: data.output.text[0],
                        context: context
                    };
                    if(data && data.intents && data.intents[0] && data.intents[0].intent === 'bye'){
                        response.event = 'closeWindow';
                    }

                    ws.send(JSON.stringify(response));
                    return Promise.reject();
                }
            })
            .then(finalData => {
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


const entityIdentifier = entity => {

    let priorityLocationEnd = '';
    let incidentLocationEnd = '';
    let caseType = '';
    let priority = '';
    let incident = '';
    let issue = '';

    entity.forEach(e => {
        if(e.entity === 'incident') {
            if(e.value === 'incident'){
                caseType = 'Incident';
            } else if(e.value === 'task'){
                caseType = 'Catalog Task'
            }
            incidentLocationEnd = parseInt(e.location[1]);
        }
        if(e.entity === 'priority') {
            priorityLocationEnd = parseInt(e.location[1]);
        }
        if(e.entity === 'issue-names') {
            issue = {
                "Case Description": {
                    '$regex': '(?i)'+e.value
                }
            };
        }
    });

    if(incidentLocationEnd || priorityLocationEnd || issue){
        entity.forEach(e => {
            if(e.entity === 'sys-number'){
                if(incidentLocationEnd && priorityLocationEnd){
                    if((incidentLocationEnd - parseInt(e.location[0])) > (priorityLocationEnd - parseInt(e.location[0]))){
                        priority = {
                            "Priority": {
                                '$regex': e.value
                            }
                        };
                    } else {
                        incident = {
                            "Assignment": {
                                '$regex': e.value
                            }
                        };
                    }
                } else if(!incidentLocationEnd && priorityLocationEnd){
                    priority = {
                        "Priority": {
                            '$regex': e.value
                        }
                    };
                } else if(incidentLocationEnd && !priorityLocationEnd){
                    incident = {
                        "Assignment": {
                            '$regex': e.value
                        }
                    };
                }
            }
        });
        return {
            incidentNo : incident,
            priorityNo : priority,
            issue: issue,
            caseType: caseType
        }
    } else {
        return '';
    }
};

const snowQueryGenerator = entity => {

    let priorityLocationEnd = '';
    let incidentLocationEnd = '';
    let caseType = '';
    let priority = '';
    let incident = '';
    let issue = '';

    entity.forEach(e => {
        if(e.entity === 'incident') {
            if(e.value === 'incident'){
                caseType = 'INC';
            } else if(e.value === 'task'){
                caseType = 'TASK'
            }
            incidentLocationEnd = parseInt(e.location[1]);
        }
        if(e.entity === 'priority') {
            priority = 'priority= ' + e.value;
        }
        if(e.entity === 'group-names') {
            issue = 'assignment_groupLIKE' + e.value;
        }
        if(e.entity === 'users') {
            issue = 'assigned_toLIKE' + encodeURIComponent(e.value);
        }
    });

    if(incidentLocationEnd || priorityLocationEnd || issue){
        entity.forEach(e => {
            if(e.entity === 'sys-number' && incidentLocationEnd && !priority){
                incident = 'numberLIKE' + caseType + e.value;
                /*if(incidentLocationEnd && priorityLocationEnd){
                    if((incidentLocationEnd - parseInt(e.location[0])) > (priorityLocationEnd - parseInt(e.location[0]))){
                        priority = 'priorityLIKEPriority ' + e.value;
                    } else {
                        incident = 'numberLIKE' + caseType + e.value;
                    }
                } else if(!incidentLocationEnd && priorityLocationEnd){
                    priority = 'priorityLIKEPriority ' + e.value;
                } else if(incidentLocationEnd && !priorityLocationEnd){
                    incident = 'numberLIKE' + caseType + e.value;
                }*/
            }
        });
        return {
            incidentNo : incident,
            priorityNo : priority,
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