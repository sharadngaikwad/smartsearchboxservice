/**
 * Created by iSmile on 4/2/2017.
 */
'use strict';
const redis = require('./redis');

/*
 * This method sets the Rank of the answer and saves it in Redis
 * It ranks the answer as Good or Bad for a specific question along with the number of votes
 * @method - POST
 * @payload - {Array}
 * Sample payload :
 * {
 *   "payload": [
 *        {
 *           "id": "00ae37ed-13d4-451c-b03d-4e84c0fb650etest", //Answer ID
 *           "question": "what is tess?", //Qeustion
 *            "rank": "bad" //Rank - (good | bad)
 *      }
 *  ]
 *}
 * */
const setRank = (req, res) => {
    console.log("setRank params", req.body);
    function saveRankinRedis(res) {
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

    if (req.body && req.body.payload && req.body.payload.length > 0) {
        return Promise.all(req.body.payload.map(saveRankinRedis))
            .then(response => res.status(200).send('Ranking successfully done.'))
            .catch(err => res.status(500).send('Error in ranking the results'));
    } else {
        res.status(500).send('Error in ranking the results')
    }
};

/*
 * This method ranks the results
 * @param results {Array} - Array of answers
 * @param question {String} - Question
 *
 * @return Ranked array
 * */
const rankResults = (results, question, userPreference) => {
    let votedResults = [];
    let badResults = [];
    let finalArray = [];
    question = question.toLowerCase();

    function manipulateRank(res) {
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
                            fA.up = pos;
                        } else {
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
        });
};

module.exports = {
    setRank: setRank,
    rankResults: rankResults
};