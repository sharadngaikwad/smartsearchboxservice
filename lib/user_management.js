/**
 * Created by iSmile on 6/14/2017.
 */
'use strict';
const config = require('./../config/config');
const redis = require('./redis');
const {cloudant, commonUtil, mailer} = require('ihelp');
const uuidV1 = require('uuid/v1');

const checkUser = (req, res) => {
    console.log('***** checkUser ****** \n', req.body);
    let email = req.body.email;
    let macAddress = req.body.macAddress;
    let doc = {
        email: email,
        newUser: true,
        keys: {}
    };
    let newUser = false;
    let activationKey = uuidV1();
    let emailSubject = 'OmniBot Activation Key';
    let emailText = `Hi, \n\nYour activation code for OmniBot is ${activationKey}. Please do not share this key with any one. \n\n Thanks,\n OmniBot Team`
    cloudant.searchBySelector(config.cloudant.usersDB, {email: email})
        .then(docs => {
            if (docs) {
                let userObj = docs[0];
                newUser = userObj.newUser;
                if (userObj.keys[commonUtil.createHMac('sha1', `${email}:${macAddress}`, config.secretKey)]) {
                    //If the user is already registered and using the app from the same machine
                    return Promise.reject({canUse: true});
                } else {
                    //If the user is already registered but trying to access the app from different machine
                    return Promise.resolve({doc: userObj});
                }
            } else {
                //First time user
                newUser = true;
                return Promise.resolve({});
            }
        })
        .then(result => {
            console.log('111111111111111', result);
            console.log('111111111111111', commonUtil);
            let newKey = commonUtil.createHMac('sha1', `${email}:${macAddress}`, config.secretKey);
            if (result.doc) {
                doc = result.doc
            }
            doc.keys[newKey] = false;
            return redis.setX(newKey, 900, activationKey);
        })
        .then(activationKey => {
            console.log('22222222222222222', activationKey);
            return cloudant.createDoc('users', doc)
        })
        .then(savedDoc => {
            console.log('333333333333333333', savedDoc);
            if (!newUser) {
                return mailer.sendMail(email, emailSubject, emailText);
            } else {
                return Promise.reject({canUse: false, reason: 'new-user'});
            }
        })
        .then(mailSent => Promise.reject({canUse: false, reason: 'new-machine'}))
        .catch(err => {
            console.log(err);
            if (err && (err.canUse || !err.canUse)) {
                res.json(err);
            } else {
                res.json({error: err});
            }
        })
};

const activateUser = (req, res) => {
    console.log('***** activateUser ****** \n', req.body);
    let user = req.body;
    cloudant.createDoc(config.cloudant.usersDB, user)
        .then(result => cloudant.getAllDocuments(config.cloudant.usersDB))
        .then(usersList => {
            res.json({
                success: true,
                result: usersList
            });
        })
        .catch(error => {
            console.log(error);
            res.json({
                success: false
            })
        });
};

const verifyActivationCode = (req, res) => {
    console.log('***** verifyActivationCode ****** \n', req.body);
    let email = req.body.email;
    let macAddress = req.body.macAddress;
    let activationKey = req.body.activationKey;
    let key = commonUtil.createHMac('sha1', `${email}:${macAddress}`, config.secretKey);
    redis.get(key)
        .then(key => {
            console.log(`Saved key :::: ${key}`);
            if (activationKey === key) {
                return cloudant.searchBySelector(config.cloudant.usersDB, {email: email});
            } else {
                return Promise.rejct({canUse: false});
            }
        })
        .then(docs => {
            let doc = docs[0];
            doc.keys[key] = true;
            return cloudant.createDoc(config.cloudant.usersDB, doc);
        })
        .then(result => res.json({canUse: true}))
        .catch(err => res.json(err)); //TODO: Check corner cases for error handling
};

module.exports = {
    checkUser: checkUser,
    activateUser: activateUser,
    verifyActivationCode: verifyActivationCode
};