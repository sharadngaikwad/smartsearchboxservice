/**
 * Created by iSmile on 3/17/2017.
 */
'use strict';
const config = require('./../config/config');
const rp = require('request-promise');

const getSnowIncidentDetails = queryParams => {
    let url = config.snow.url + '?sysparm_display_value=all&' + queryParams;
    console.log('URL ::::::::::::::',url);
    let options = {
        headers: {
            Authorization: 'Basic ' + config.snow.authToken
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
                    result: 'Sorry no results were found.'
                })
            }
        }).catch(err => {
            if(err && err.statusCode === 404){
                return Promise.resolve({
                    result: 'Sorry no results were found.'
                })
            } else{
                Promise.reject({error: err});
            }
        });
};


const searchInWorkNotes = queryParams => {
    let url = config.snow.url + '?sysparm_display_value=all&sysparm_limit=10&sysparm_query=work_notesLIKE' + queryParams;
    console.log('URL ::::::::::::::',url);
    let options = {
        headers: {
            Authorization: 'Basic ' + config.snow.authToken
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
                    result: 'Sorry no results were found.'
                })
            }
        }).catch(err => {
            if(err && err.statusCode === 404){
                return Promise.resolve({
                    result: 'Sorry no results were found.'
                })
            } else{
                Promise.reject({error: err});
            }
        });
};

module.exports = {
    getSnowIncidentDetails: getSnowIncidentDetails,
    searchInWorkNotes: searchInWorkNotes
};