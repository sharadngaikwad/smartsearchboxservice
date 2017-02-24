/**
 * Created by s_rya on 2/23/2017.
 */
'use strict';
const Cloudant = require('cloudant');
const config = require('./../config/config');

const cloudant = Cloudant({
    account: config.cloudant.username,
    password: config.cloudant.password,
    plugin:'promises'
});
const mydb = cloudant.db.use('cmdb');

//https://www.npmjs.com/package/cloudant#cloudant-search
//Use this method to search by index

mydb.list().then(data => {
    console.log(data);
}).catch(err => console.log(err));

/*
cloudant.db.list(function (err, allDbs) {
    console.log('All my databases: %s', allDbs.join(', '))
});*/
