/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';

//Config values for Watson Conversation Service running in Bluemix
const watsonCoversation = {
    url: 'https://gateway.watsonplatform.net/conversation/api',
    version_date: '2016-10-21',
    version: 'v1',
    workspaceId: 'c0c41ffa-30d8-42d1-a681-02a004f41d0c',
    workspaceUserName: 'c715a3d3-4510-4fca-9a1e-73b29e018291',
    workspacePassword: 'gseiGfBJ5CNI'
};

//Config values for Watson Discovery Service running in Bluemix
const watsonDiscovery = {
    username: 'cce8943a-25a5-4cdf-bb87-053ed95b3214',
    password: 'y0oMfqx6vRo3',
    version: 'v1',
    version_date: '2016-12-01',
    environment_id: '36eee3d4-fa56-4712-85d7-a0e1b34e93c3',
    defaultCollection: 'customerDB-UK',
    collection_id: {
        'customerDB-UK': 'a4b412e5-194c-49bc-9055-926f11e0db37',
        'cars': '52e46aeb-3d4a-4d0d-8a5f-69485a3285da'
    }
};

module.exports = {
    watsonCoversation: watsonCoversation,
    watsonDiscovery: watsonDiscovery
};