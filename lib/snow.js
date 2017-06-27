/**
 * Created by iSmile on 3/17/2017.
 */
'use strict';
const config = require('./../config/config');
const rp = require('request-promise');

/* This method hits the SNOW API to get the tickets from SNOW based on the Ticket number or User or Assignment Group */
const getSnowIncidentDetails = (queryParams, appName) => {
    // To search in WorkNotes the query will be ?sysparm_display_value=all&sysparm_limit=10&sysparm_query=work_notesLIKE
    //let url = config.snow.url + '?sysparm_display_value=all&' + queryParams;
    let url = `${config.snow.tableAPIUrl}${config.snow.incidentTable}?sysparm_display_value=all&${queryParams}`
    let errorMsg = 'Sorry no incidents were found.';
    if (appName) errorMsg = `Sorry no incidents were found for ${appName}.`;
    console.log('URL ::::::::::::::', url);
    let options = {
        headers: {
            Authorization: `Basic ${config.snow.authToken}`
        }
    };

    return rp.get(url, options)
        .then(data => {
            if (data && JSON.parse(data).result && JSON.parse(data).result.length > 0) {
                let result = JSON.parse(data).result;
                let resArray = [];
                result.forEach(res => {
                    resArray.push({
                        incidentId: res.number.display_value,
                        workNotes: res.comments_and_work_notes.display_value,
                        priority: res.priority.display_value,
                        incidentDesc: res.description.display_value,
                        status: res.state.display_value,
                        assignedTo: res.assigned_to.display_value,
                        assignmentGroup: res.assignment_group.display_value,
                        applicationName: res.subcategory.display_value
                    })
                });
                return Promise.resolve({
                    type: 'cloudant',
                    count: resArray.length,
                    result: resArray
                });
            } else {
                return Promise.resolve({
                    result: errorMsg
                })
            }
        }).catch(err => {
            if (err && err.statusCode === 404) {
                return Promise.resolve({
                    result: errorMsg
                })
            } else {
                Promise.reject({error: err});
            }
        });
};

const getSnowGroups = email => {
    let options = {
        method: 'GET',
        url: `${config.snow.tableAPIUrl}${config.snow.groupsTable}?sysparm_fields=group.name&sysparm_query=user.user_name=${email}`,
        headers: {
            Authorization: `Basic ${config.snow.authToken}`
        },
        json: true
    };
    let groupsArray = [];
    return rp(options)
        .then(data => {
            if(data && data.result && data.result.length > 0) {
                data.result.forEach(group => groupsArray.push(group["group.name"]));
            }
            return Promise.resolve(groupsArray);
        })
        .catch(err => Promise.resolve(groupsArray));
};


module.exports = {
    getSnowIncidentDetails: getSnowIncidentDetails,
    getSnowGroups: getSnowGroups
};