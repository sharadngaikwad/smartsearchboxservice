/**
 * Created by s_rya on 2/23/2017.
 */
'use strict';
const config = require('./../config/config');
const {cloudant, commonUtil} = require('ihelp');


//https://www.npmjs.com/package/cloudant#cloudant-search
//Use this method to search by index

//This method get the incident docs from Cloudant based on the PRIMARY_EMAIL
//TODO: Need to make this method generic so that it can used to retrieve docs on different criteria
const getListOfUsers = (req, res) => {
    cloudant.getAllDocuments(config.cloudant.usersDB)
        .then(usersList => {
            res.json({
                success: true,
                result: usersList
            });
        })
        .catch(error => res.json({
            success: false
        }));
};

module.exports = {
    getListOfUsers: getListOfUsers
};