/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const express = require('express'); // app server
const multer  = require('multer');
const http = require('http');
const WebSocket = require('ws');
const bodyParser = require('body-parser'); // parser for post requests
const messageHandler = require('./lib/message_handler');
const bwl = require('./lib/blueworkslive');
const discovery = require('./lib/watson_discovery');
const conversation = require('./lib/watson_conversation');
const rank = require('./lib/rank');
const upload = require('./lib/upload');
const userManagement = require('./lib/user_management');

const fs = require('fs');
const dir = './discoveryUploads';

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

const app = express();
const server = http.createServer(app);
const multerUpload = multer({ dest: 'discoveryUploads/' });
const wss = new WebSocket.Server({server});


wss.on('connection', ws => ws.on('message', msg => messageHandler.processMessage(msg, ws)));

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({limit: "50mb", extended: true, parameterLimit: 50000}));

app.get('/image/:imageName', bwl.imageFromBWL);
app.post('/rank', rank.setRank);
app.post('/discovery', discovery.watsonQuery);
app.post('/entityValue', conversation.addNewAppNameEntity);
app.post('/user',userManagement.checkUser);
app.post('/activationCode', userManagement.verifyActivationCode);
app.post('/activate', userManagement.activateUser);
app.post('/upload', multerUpload.single('file'), upload.uploadToDiscovery);


module.exports = server;
