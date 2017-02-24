/**
 * Created by s_rya on 2/23/2017.
 */
'use strict';
const Cloudant = require('cloudant');
const config = require('./../config/config');

const cloudant = Cloudant({
    account: config.cloudant.username,
    password: config.cloudant.password,
    plugin: 'promises'
});
const mydb = cloudant.db.use(config.cloudant.dbName);

//https://www.npmjs.com/package/cloudant#cloudant-search
//Use this method to search by index

const getIncidentDetails = key => {
    return mydb.find({selector: {PRIMARY_EMAIL: key}})
        .then(data => {
            let docs = data.docs;
            if (docs && docs.length > 0) {
                let outputArray = [];
                docs.forEach(d => {
                    outputArray.push({
                        _id: d._id,
                        _rev: d._rev,
                        incidentId: d.INCIDENT_ID,
                        incidentDesc: d.INCIDENT_DESC,
                        priority: d.PRIORITY,
                        primaryEmail: d.PRIMARY_EMAIL,
                        displayName: d.DISPLAY_NAME
                    })
                });
                return Promise.resolve({
                    type: 'cloudant',
                    count: outputArray.length,
                    result: outputArray
                })
            } else {
                return Promise.resolve({
                    result: 'Sorry no results were found.'
                })
            }
        }).catch(err => Promise.reject({error: err}));
};

module.exports = {
    getIncidentDetails: getIncidentDetails
};