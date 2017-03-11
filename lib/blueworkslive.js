/**
 * Created by iSmile on 3/6/2017.
 */

const request = require('request');
const config = require('./../config/config');

const imageFromBWL = (req, res) =>{
    var options = {
        url: config.bwl.url + req.query.fileItemId,
        headers: {
            'Authorization': 'Basic ' + config.bwl.authToken
        }
    };
    request.get(options).pipe(res);
};

module.exports = {
    imageFromBWL: imageFromBWL
};