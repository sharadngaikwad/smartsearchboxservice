/**
 * Created by iSmile on 3/23/2017.
 */
'use strict';
const Alchemy = require('watson-developer-cloud/alchemy-language/v1');
const config = require('./../config/config');

//Initialising the Alchemy Service
const alchemy = new Alchemy(config.alchemy);

/*
* This method hits Alchemy API to get the Keywords from the text provided
*
* @param text {String} - The text from which keywords needs to be extracted
*
* @return {String} - List of keywords separated by comma
* */
const getKeywords = text => {
    return new Promise((resolve, reject) => {
        alchemy.keywords({
            text: text
        }, (err, data) => {
            if (err) {
                reject();
            } else {
                let keywordsArray = [];
                if (data && data.keywords && data.keywords.length > 0) {
                    let keywords = data.keywords;
                    keywords.forEach(key => {
                        keywordsArray.push(key.text);
                    });
                    resolve(keywordsArray.join(','));
                } else {
                    resolve();
                }
            }
        });
    });
};

module.exports = {
    getKeywords: getKeywords
};