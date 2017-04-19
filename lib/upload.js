/**
 * Created by iSmile on 4/7/2017.
 */
'use strict';
const config = require('./../config/config');
const nodeUtil = require('util');
const rp = require('request-promise');
const fs = require('fs');
const mammoth = require('mammoth');
const striptags = require('striptags');


/*
* This method adds documents to Watson Discovery Collection
*
* @method - POST
* @sample-paylod:
*   {
*       file: {ReaderStream} The document which needs to the added to discovery collection
*   }
* */
//TODO: Need to handle more error cases
const uploadToDiscovery = (req, res) => {
    console.log(req.file);
    var tmp_path = req.file.path;
    var filename = req.file.originalname;
    // The original name of the uploaded file stored in the variable "originalname".
    var target_path = tmp_path + '-' + req.file.originalname;
    var src = fs.createReadStream(tmp_path);
    src.pipe(fs.createWriteStream(target_path));
    src.on('end', (() => {
        fs.unlinkSync(tmp_path);
        mammoth.convertToHtml({path: target_path})
            .then((result) => {
                fs.unlinkSync(target_path);
                let obj = {
                    "Item Name": filename.split(".")[0],
                    "Documentation with HTML": result.value,
                    "Documentation": striptags(result.value, [], ' ')
                };
                const writerStream = fs.createWriteStream(target_path.split(".")[0] + '.json');
                writerStream.write(JSON.stringify(obj, 0, 2), 'UTF8');
                writerStream.end();
                writerStream.on('finish', function () {
                    rp({
                        method: 'POST',
                        url: nodeUtil.format(config.watsonDiscovery.addDocUrl, config.watsonDiscovery.environment_id, config.watsonDiscovery.collection_id),
                        headers: {
                            authorization: 'Basic ' + config.watsonDiscovery.auth,
                            'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'
                        },
                        formData: {
                            file: {
                                value: fs.createReadStream(target_path.split(".")[0] + '.json'),
                                options: {
                                    filename: target_path.split(".")[0] + '.json',
                                    contentType: null
                                }
                            }
                        }
                    }).then(data => {
                        console.log(data);
                        res.status(200).json({success: true})
                    }).catch(err => {
                        console.log(err);
                        res.status(400).json({success: false})
                    });
                    fs.unlinkSync(target_path.split(".")[0] + '.json');
                });
                writerStream.on('error', function (err) {
                    console.log(err.stack);
                });
            })
            .done();
    }));
    src.on('error', ((err) => {
        res.status(400).json({success: false})
    }));

};

module.exports = {
    uploadToDiscovery: uploadToDiscovery
};