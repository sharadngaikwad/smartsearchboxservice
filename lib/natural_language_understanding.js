/**
 * Created by iSmile on 5/9/2017.
 */
'use strict';
const NLU = require('watson-developer-cloud/natural-language-understanding/v1');
const config = require('./../config/config');

//Initialising the Natural Language Understanding Service
const nlu = new NLU(config.naturalLanguageUnderstanding);

/*
 * This method hits Natural Language Understanding API to get the Keywords from the text provided
 *
 * @param text {String} - The text from which keywords needs to be extracted
 *
 * @return {String} - List of keywords separated by comma
 * */
const getKeywords = text => {
    return new Promise((resolve, reject) => {
        nlu.analyze({
            text: text,
            features: {
                keywords: {}
            }
        }, (err, data) => {
            if (err) {
                console.log('getKeywords error ::::',err);
                reject();
            } else {
                console.log('getKeywords data ::::',data);
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