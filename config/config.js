/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const watsonCoversation = {
    url: 'https://gateway.watsonplatform.net/conversation/api',
    version_date: '2016-10-21',
    version: 'v1',
    workspaceId: '16d61bf4-f78a-4b62-a848-6cc6d808609b',
    workspaceUserName: '6e9dac24-0778-4b58-9a5e-e19d8589e989',
    workspacePassword: 'dQ1QR7W26I3Y'
};

const watsonDiscovery = {
    username: 'cce8943a-25a5-4cdf-bb87-053ed95b3214',
    password: 'y0oMfqx6vRo3',
    version: 'v1',
    version_date: '2016-12-01',
    environment_id: '36eee3d4-fa56-4712-85d7-a0e1b34e93c3',
    collection_id: {
        'customerDB-UK' : '9a53f68c-22ab-4cff-9708-d0887247dedf',
        'cars' : '52e46aeb-3d4a-4d0d-8a5f-69485a3285da'
    }
};

module.exports = {
    watsonCoversation: watsonCoversation,
    watsonDiscovery: watsonDiscovery
};