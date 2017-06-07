/**
 * Created by iSmile on 4/2/2017.
 */
'use strict';
const config = require('./../config/config');
const {cloudant, commonUtil} = require('ihelp');

/* * This method sets the Rank of the answer and saves it in Cloudant
 * It ranks the answer as Good or Bad for a specific question along with the number of votes
 * @method - POST
 * @payload - {Array}
 * Sample payload :
 * {
 *   "email" : "surya.vaigundth@in.ibm.com" //Email Id of the user
 *   "payload": [
 *        {
 *           "id": "00ae37ed-13d4-451c-b03d-4e84c0fb650etest", //Answer ID
 *           "question": "what is tess?", //Qeustion,
 *           "keyword" : "tess" //Keywords from Alchemy
 *           "rank": "bad" //Rank - (good | bad)
 *      }
 *  ]
 *}
 * */
const setRank = (req, res) => {
    console.log("setRank params", req.body);
    let email = req.body.email;
    let answers = req.body.payload;
    if (req.body && answers && answers.length > 0 && email) {
        cloudant.searchBySelector(config.cloudant.userHistoryDB, {email: email})
            .then(document => {
                let doc = document[0];
                if (doc && doc.ranked) {
                    answers.forEach(answer => {
                        let isQ = false;
                        let rankedArray = doc.ranked;
                        let answerId = rankedArray[answer.id];
                        let question = answer.keyword;
                        if (answerId) {
                            if (answerId[answer.rank] && answerId[answer.rank].length > 0) {
                                answerId[answer.rank].forEach(ans => {
                                    if (ans.q.trim() === question.trim()) {
                                        ans.votes = parseInt(ans.votes) + 1;
                                        isQ = true;
                                    }
                                });
                                if (!isQ) {
                                    answerId[answer.rank].push({
                                        q: question,
                                        votes: 1
                                    })
                                }
                            } else {
                                answerId[answer.rank] = [{
                                    q: question,
                                    votes: 1
                                }];
                            }
                        } else {
                            rankedArray[answer.id] = {};
                            rankedArray[answer.id][answer.rank] = [{
                                q: question,
                                votes: 1
                            }];
                        }
                    });
                    return cloudant.createDoc(config.cloudant.userHistoryDB, doc);
                }
            })
            .then(data => res.status(200).send('Ranking successfully done.'))
            .catch(err => res.status(500).send('Error in ranking the results'));
    } else {
        res.status(500).send('Error in ranking the results');
    }



    /*function saveRankinRedis(res) {
        var id = res.id;
        var question = res.question.toLowerCase();
        var rank = res.rank;
        let isQ = false;
        return redis.get(id)
            .then(data => {
                if (data) {
                    if (data[rank]) {
                        data[rank].forEach(d => {
                            if (d.q === question) {
                                d.votes = parseInt(d.votes) + 1;
                                isQ = true;
                            }
                        });
                        if (!isQ) {
                            data[rank].push({
                                q: question,
                                votes: 1
                            })
                        }
                    } else {
                        data[rank] = [];
                        data[rank].push({
                            q: question,
                            votes: 1
                        })
                    }
                    return Promise.resolve(data);
                } else {
                    let rankObj = {};
                    if (rank === "good") {
                        rankObj = {
                            "good": [{
                                q: question,
                                votes: 1
                            }]
                        };
                    } else {
                        rankObj = {
                            "bad": [{
                                q: question,
                                votes: 1
                            }]
                        };
                    }
                    return Promise.resolve(rankObj);
                }
            })
            .then(finalData => redis.set(id, finalData))
    }

    if (req.body && req.body.payload && req.body.payload.length > 0 && req.body.userId) {
        return Promise.all(req.body.payload.map(saveRankinRedis))
            .then(response => res.status(200).send('Ranking successfully done.'))
            .catch(err => res.status(500).send('Error in ranking the results'));
    } else {
        res.status(500).send('Error in ranking the results')
    }*/
};

/*
 * This method ranks the results
 * @param results {Array} - Array of answers
 * @param question {String} - Question
 *
 * @return Ranked array
 * */
const rankResults = (results, question, userPreference, keyword, email) => {
    let votedResults = [];
    let badResults = [];
    let finalArray = [];

    console.log("rank results :::::", question, userPreference, keyword, email);
    return cloudant.searchBySelector(config.cloudant.userHistoryDB, {email: email})
        .then(document => {
            let doc = document[0];
            console.log('is ::::',results.length);
            results.forEach(r => console.log("^^^^^^^",r.score));
            if (doc && doc.ranked && Object.keys(doc.ranked).length > 0) {
                results.forEach(res => {
                    let answerId = res.id + "test";
                    let isQGood = false;
                    let isQBad = false;
                    let goodVotes = 0;
                    let badVotes = 0;
                    if (Object.keys(doc.ranked).includes(answerId)) {
                        if (doc.ranked[answerId].good) {
                            doc.ranked[answerId].good.forEach(g => {
                                console.log("questions::::-----",keyword);
                                console.log("questions::::-----",g.q);
                                if (g.q === keyword) {
                                    isQGood = true;
                                    goodVotes = g.votes;
                                }
                            });
                        }
                        if (doc.ranked[answerId].bad) {
                            doc.ranked[answerId].bad.forEach(b => {
                                if (b.q === keyword) {
                                    isQBad = true;
                                    badVotes = b.votes;
                                }
                            });
                        }
                        if (isQBad && isQGood) {
                            votedResults.unshift({
                                r: res,
                                v: goodVotes - badVotes
                            });

                        } else if (isQBad && !isQGood) {
                            badResults.unshift({
                                r: res,
                                v: badVotes
                            });
                        } else if ((isQGood && !isQBad) || (!isQBad && !isQGood && res.score > 1.2)) {
                            votedResults.unshift({
                                r: res,
                                v: goodVotes
                            });
                        } else {
                            finalArray.push(res);
                        }
                    } else {
                        finalArray.push(res);
                    }
                });
                votedResults.sort((a, b) => a.v - b.v);
                badResults.sort((a, b) => b.v - a.v);
                votedResults.forEach(vR => {
                    finalArray.unshift(vR.r);
                });
                badResults.forEach(bR => {
                    finalArray.push(bR.r);
                });
                finalArray.forEach(f => console.log("%%%%%%%%%%%", f.score));
                return Promise.resolve(finalArray);
            } else {
                return Promise.resolve(results);
            }
        })
        .then(finalResults => {
            if(userPreference && userPreference.lastSearchedApp){
                let assignmentGroups = userPreference.groups;
                if(assignmentGroups.length <= 0) assignmentGroups = [userPreference.lastSearchedApp];
                let lastSearchedIndex = assignmentGroups.indexOf(userPreference.lastSearchedApp);
                if(assignmentGroups.includes(userPreference.lastSearchedApp)){
                    let temp = assignmentGroups[lastSearchedIndex];
                    assignmentGroups[lastSearchedIndex] = assignmentGroups[0];
                    assignmentGroups[0] = temp;
                }
                assignmentGroups.forEach((up,pos) => {
                    finalResults.forEach(fA => {
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',fA.metadata);
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',up);
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',pos);

                        if(up === fA.metadata.applicationName){
                            fA.isTagged = true;
                            fA.up = pos;
                        } else if(!fA.isTagged){
                            fA.up = 200;
                        }
                    })
                });
                return Promise.resolve(finalResults.sort((a, b) => a.up - b.up));
            } else {
                return Promise.resolve(finalResults);
            }
        })
        .catch(err => {
            return Promise.resolve(results);
        });





    /*function manipulateRank(res) {
        let isQGood = false;
        let isQBad = false;
        let goodVotes = 0;
        let badVotes = 0;
        return redis.get(res.id + "test")
            .then(data => {
                console.log('rank ::::', res.id);
                console.log('rank :::: score :: ', res.score);
                if (data) {
                    if (data.good) {
                        data.good.forEach(d => {
                            if (d.q === question) {
                                isQGood = true;
                                goodVotes = d.votes;
                                console.log('rank :::: good :: ', goodVotes);
                                console.log('rank ::::', d.q);
                            }
                        });
                    }
                    if (data.bad) {
                        data.bad.forEach(d => {
                            if (d.q === question) {
                                isQBad = true;
                                badVotes = d.votes;
                                console.log('rank :::: bad :: ', badVotes);
                                console.log('rank ::::', d.q);
                            }
                        });
                    }
                    if (isQBad && isQGood) {
                        votedResults.unshift({
                            r: res,
                            v: goodVotes - badVotes
                        });

                    } else if (isQBad && !isQGood) {
                        badResults.unshift({
                            r: res,
                            v: badVotes
                        });
                    } else if ((isQGood && !isQBad) || (!isQBad && !isQGood && res.score > 1.2)) {
                        votedResults.unshift({
                            r: res,
                            v: goodVotes
                        });
                    } else {
                        finalArray.push(res);
                    }
                } else if(res.score > 1.2){
                    votedResults.push({
                        r: res,
                        v: 0
                    });
                } else {
                    finalArray.push(res);
                }
                return Promise.resolve();
            })
            .catch(err => Promise.reject());
    }

    return Promise.all(results.map(manipulateRank))
        .then(() => {
            votedResults.sort((a, b) => a.v - b.v);
            badResults.sort((a, b) => b.v - a.v);
            votedResults.forEach(vR => {
                finalArray.unshift(vR.r);
            });
            badResults.forEach(bR => {
                finalArray.push(bR.r);
            });
            console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',userPreference);
            if(userPreference && userPreference.length > 0){
                userPreference.forEach((up,pos) => {
                    finalArray.forEach(fA => {
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',fA.metadata);
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',up.appName);
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$',pos);

                        if(up.appName === fA.metadata.applicationName){
                            fA.isTagged = true;
                            fA.up = pos;
                        } else if(!fA.isTagged){
                            fA.up = 200;
                        }
                    })

                });
                return Promise.resolve(finalArray.sort((a, b) => a.up - b.up));
            } else {
                return Promise.resolve(finalArray);
            }
        })
        .catch(err => {
            console.log(err);
            return Promise.resolve(results)
        });*/
};

module.exports = {
    setRank: setRank,
    rankResults: rankResults
};