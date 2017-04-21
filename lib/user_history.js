/**
 * Created by iSmile on 4/13/2017.
 */
'use strict';
const config = require('./../config/config');
const cloudant = require('./cloudant').cloudantConnection;
const db = cloudant.db.use('user-history');

/*
* This method is used to save the user history based on the Application Name in Cloudant
*
* @param email {String} - The email of the user
* @param appName {String} - The application name
*
* */
const setApplicationTrendForUser = (email, appName) => {
    return db.find({selector: {email: email}})
        .then(data => {
            let document = data.docs;
            let userPreference = [];
            if (data && document && document.length > 0) {
                let doc = document[0];
                if (appName) {
                    if (doc.search_history[appName]) {
                        doc.search_history[appName].count += 1;
                    } else {
                        doc.search_history[appName] = {};
                        doc.search_history[appName].count = 1;
                    }
                    doc.search_history[appName].lastSearched = Date.now();
                    return Promise.resolve(doc);
                } else {
                    console.log(doc.search_history);
                    Object.keys(doc.search_history).forEach(key => {
                        if (doc.search_history[key].count > 7) {
                            console.log(key);
                            userPreference.push({
                                appName: key,
                                count: doc.search_history[key].count
                            });
                        }
                    });
                    return Promise.reject({
                        array: userPreference.sort((a, b) => b.count - a.count)
                    });
                }
            } else {
                let obj = {
                    email: email,
                    search_history: {}
                };
                obj.search_history[appName] = {};
                obj.search_history[appName].count = 1;
                obj.search_history[appName].lastSearched = Date.now();
                return Promise.resolve(obj);

            }
        })
        .then(obj => db.insert(obj))
        .then(res => Promise.resolve())
        .catch(err => {
            if (err && err.array) {
                return Promise.resolve(err.array)
            } else {
                return Promise.resolve()
            }
        }); //NOT rejecting when error is encountered because we don't want the application to crash. Instead sending blank response
};

module.exports = {
    setApplicationTrendForUser: setApplicationTrendForUser
};