/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const Discovery = require('watson-developer-cloud/discovery/v1');
const rank = require('./rank');
const nlu = require('./natural_language_understanding');
const userHistory = require('./user_history');
const config = require('./../config/config');

// Regular expression for finding Style and Font attributes from the HTML text
const styleRegEx = /style=\".*?"/gi;
const fontRegEx = /font .*?">/gi;
//Regular expression for finding BWL image URLs
const imageUrlRegEx = /https:\/\/ibm\.blueworkslive\.com\/scr\/download/gi;

//Initialising the Watson Discovery Service
const discovery = new Discovery({
    username: config.watsonDiscovery.username,
    password: config.watsonDiscovery.password,
    version: config.watsonDiscovery.version,
    version_date: config.watsonDiscovery.version_date
});

/*
 * This method hits the Watson Discovery service
 *
 * @param payload {Object} - Object containing the collection id and the text
 * @param q {String} - Question which is asked by the user
 * @param appName {String} - Application name
 * @param email {String} - Email of the user
 *
 * @return {Array} - Array of sorted answers according to rating and user history
 * */
const watsonDiscoveryResponse = (payload, q, appName, email, keyword) => {
    return new Promise((resolve, reject) => {
        discovery.query(payload, ((err, discoveryData) => {
            if (err) {
                reject({
                    error: err
                });
            } else {
                if (discoveryData && discoveryData.results && discoveryData.results.length > 0) {
                    let outputArray = [];
                    discoveryData.results.forEach(dR => {
                        if (dR.score > 0) {
                            let htmlContent = dR['Documentation with HTML'];
                            //To remove the Style and Font attributes from the HTML content
                            if (styleRegEx.test(htmlContent)) {
                                htmlContent = htmlContent.replace(styleRegEx, '');
                            }
                            if (fontRegEx.test(htmlContent)) {
                                htmlContent = htmlContent.replace(fontRegEx, 'font>');
                            }
                            if (imageUrlRegEx.test(htmlContent)) {
                                htmlContent = htmlContent.replace(imageUrlRegEx, config.hostUrl + '/image')
                            }
                            dR['Documentation with HTML'] = htmlContent;
                            outputArray.push(dR);
                        }
                    });
                    return userHistory.setApplicationTrendForUser(email, appName, q, keyword || q)
                        .then(userPreference => rank.rankResults(outputArray, q, userPreference, keyword || q, email))
                        .then(rankedArray => {
                            resolve({
                                type: 'discovery',
                                count: rankedArray.length,
                                result: rankedArray
                            });
                        })
                        .catch(err => {
                            resolve({
                                type: 'discovery',
                                count: outputArray.length,
                                result: outputArray
                            });
                        })
                } else {
                    resolve({
                        result: 'Sorry, no results were found. Please rephrase your search.'
                    });
                }
            }
        }));
    });
};

const watsonQuery = (req, res) => {

    let email = req.body.email;
    let question = req.body.question;
    let appName = req.body.appName;
    console.log('SSSSSSSSSSSSSSSSSS',email, question, appName);
    let alchemyKeyword = '';
    nlu.getKeywords(question)
        .then(keyword => {
            if (keyword) {
                alchemyKeyword = keyword;
                console.log('alchemyQuery keywords::::::: enriched_Documentation.keywords.text:', keyword);
                return watsonDiscoveryResponse({
                    environment_id: config.watsonDiscovery.environment_id,
                    collection_id: config.watsonDiscovery.collection_id,
                    query: 'enriched_Documentation.keywords.text:' + keyword
                }, question, appName, email, keyword)
            } else {
                return watsonDiscoveryResponse({
                    environment_id: config.watsonDiscovery.environment_id,
                    collection_id: config.watsonDiscovery.collection_id,
                    query: question
                }, question, appName, email)
            }
        })
        .catch(err => watsonDiscoveryResponse({
            environment_id: config.watsonDiscovery.environment_id,
            collection_id: config.watsonDiscovery.collection_id,
            query: question
        }, question, appName, email))
        .then(data => {
            data.keyword = alchemyKeyword;
            data.question = question;
            res.status(200).json(data);
        });
};

module.exports = {
    watsonDiscoveryResponse: watsonDiscoveryResponse,
    watsonQuery: watsonQuery
};