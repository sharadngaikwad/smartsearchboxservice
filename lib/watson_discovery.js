/**
 * Created by s_rya on 2/13/2017.
 */
'use strict';
const Discovery = require('watson-developer-cloud/discovery/v1');
const rank = require('./rank');
const config = require('./../config/config');

// Regular expression for removing Style and Font attributes from the HTML text
const styleRegEx = /style=\".*?"/gi;
const fontRegEx = /font .*?">/gi;
const imageUrlRegEx = /https:\/\/ibm\.blueworkslive\.com\/scr\/download/gi;

const discovery = new Discovery({
    username: config.watsonDiscovery.username,
    password: config.watsonDiscovery.password,
    version: config.watsonDiscovery.version,
    version_date: config.watsonDiscovery.version_date
});

// This method hits the Watson Discovery service
const watsonDiscoveryResponse = (payload, q) => {
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
                    return rank.rankResults(outputArray, q).then(rankedArray => {
                        resolve({
                            type: 'discovery',
                            count: rankedArray.length,
                            result: rankedArray
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

module.exports = {
    watsonDiscoveryResponse: watsonDiscoveryResponse
};