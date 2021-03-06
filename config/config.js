/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';

//Config values for Watson Conversation Service running in Bluemix
const watsonCoversation = {
    url: 'https://gateway.watsonplatform.net/conversation/api',
    version_date: '2016-10-21',
    version: 'v1',
    workspaceId: '8dd2e891-2b13-41b7-9737-009a9d9e382b',
    workspaceUserName: 'c715a3d3-4510-4fca-9a1e-73b29e018291',
    workspacePassword: 'gseiGfBJ5CNI'
};

//Config values for Watson Discovery Service running in Bluemix
const watsonDiscovery = {
    username: 'b11da645-d521-45a4-876b-45ba7c05ebc5',
    password: 'j8xR2DS3Uj5H',
    version: 'v1',
    version_date: '2016-12-01',
    environment_id: 'ac74cff0-5b41-4f53-8bdb-0a9c6e188093',
    defaultCollection: 'customerDB-UK',
    collection_id: {
        'customerDB-UK': 'd69e34e5-0187-4795-8ce0-bc7b8adc73dd',
        'cars': '52e46aeb-3d4a-4d0d-8a5f-69485a3285da'
    }
};

//Config values for Cloudant Service
const cloudant = {
    username: "844d8c57-58b6-4391-8b52-50492bc81db2-bluemix",
    password: "acbb0d4c8c5a251db060d3890fc929afbb732c80ff7af948db5d4db512f327ea",
    dbName: 'incident'
};

//TODO: Need to get token of a user who has access through all workspaces in BWL
//Config values for BlueWorksLive
const bwl = {
    url: 'https://ibm.blueworkslive.com/scr/api/FileDownload?fileItemId=',
    authToken: 'c3VyeW1yMDFAaW4uaWJtLmNvbTpzbWFydGVrQDEyMw=='
};

//Config values for ServiceNOW
const snow = {
    url: 'https://hclmt.service-now.com/api/now/v1/table/incident',
    authToken: 'S3VsZGlwLkt1bWFyQGhvbmRhLWV1LmNvbTpIb25kYUAzMjE='
};

const hostUrl = 'https://smartsearchboxservice.mybluemix.net';

module.exports = {
    watsonCoversation: watsonCoversation,
    watsonDiscovery: watsonDiscovery,
    cloudant: cloudant,
    bwl: bwl,
    snow: snow,
    hostUrl: hostUrl
};