/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const Discovery = require('watson-developer-cloud/discovery/v1');
const config = require('./../config/config');

const discovery = new Discovery({
    username: config.watsonDiscovery.username,
    password: config.watsonDiscovery.password,
    version: config.watsonDiscovery.version,
    version_date: config.watsonDiscovery.version_date
});

// This method hits the Watson Discovery service
const watsonDiscoveryResponse = payload => {
    return new Promise((resolve, reject) => {
        discovery.query(payload, ((err, data) => {
            if (err) {
                reject({
                    callbackURL: payload.callbackURL,
                    error: err
                });
            }
            if (data && parseInt(data.matching_results) === 0) {
                resolve({
                    callbackURL: payload.callbackURL,
                    result: 'Sorry, no results were found. Please rephrase your search.'
                });
            }
            //TODO: Need to decide what we need to return back to user
            data.callbackURL = payload.callbackURL;
            resolve(data);
        }));
    });
};

module.exports = {
    watsonDiscoveryResponse: watsonDiscoveryResponse
};