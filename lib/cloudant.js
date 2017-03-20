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

//This method get the incident docs from Cloudant based on the PRIMARY_EMAIL
//TODO: Need to make this method generic so that it can used to retrieve docs on different criteria
const getIncidentDetails = (key, value) => {
    /*let selector = {};
    if(key) {
        selector[key] = value;
    } else {
        selector = {
            $or: [
                {"INCIDENT_ID": parseInt(value)},
                {"INCIDENT_REF": {'$regex': value}}
            ]
        };
    }*/
    console.log(JSON.stringify(key, 0, 2));
    // selector[key] = value;
    return mydb.find({selector: key})
        .then(data => {
            console.log(data);
            let docs = data.docs;
            if (docs && docs.length > 0) {
                let outputArray = [];
                docs.forEach(d => {
                    outputArray.push({
                        _id: d._id,
                        _rev: d._rev,
                        incidentId: d.Assignment,
                        assignmentGroup: d['Assignment Group'],
                        applicationModule: d['Application Module'],
                        incidentDesc: d['Case Description'],
                        priority: d.Priority,
                        assignedTo: d['Assigned To'],
                        status: d['Latest Status'],
                        caseType: d['Case Type']
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