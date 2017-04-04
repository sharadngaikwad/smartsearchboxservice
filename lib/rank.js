/**
 * Created by iSmile on 4/2/2017.
 */
'use strict';
const redis = require('./redis');

const setRank = (req, res) => {
    console.log("setRank params", req.body);
    function saveRankinRedis(res) {
        var id = res.id;
        var question = res.question;
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
    if(req.body && req.body.payload && req.body.payload.length > 0){
        return Promise.all(req.body.payload.map(saveRankinRedis))
            .then(response => res.status(200).send('Ranking successfully done.'))
            .catch(err => res.status(500).send('Error in ranking the results'));
    } else {
        res.status(500).send('Error in ranking the results')
    }
};

const rankResults = (results, question) => {
    let votedResults = [];
    let badResults = [];
    let finalArray = [];

    function manipulateRank(res) {
        let isQGood = false;
        let isQBad = false;
        let goodVotes = 0;
        let badVotes = 0;
        return redis.get(res.id + "test")
            .then(data => {
                if (data) {
                    if (data.good) {
                        data.good.forEach(d => {
                            if (d.q === question) {
                                isQGood = true;
                                goodVotes = d.votes;
                            }
                        });
                    }
                    if (data.bad) {
                        data.bad.forEach(d => {
                            if (d.q === question) {
                                isQBad = true;
                                badVotes = d.votes;
                            }
                        });
                    }
                    if (isQBad && isQGood) {
                        votedResults.unshift({
                            r: res,
                            v: goodVotes - badVotes
                        });

                    }
                    if (isQBad && !isQGood) {
                        badResults.unshift(res);
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
                return Promise.resolve();
            })
    }

    return Promise.all(results.map(manipulateRank))
        .then(() => {
            votedResults.sort((a, b) => a.v - b.v);
            badResults.sort((a, b) => b.v - a.v);
            votedResults.forEach(vR => {
                finalArray.unshift(vR.r);
            });
            return Promise.resolve(finalArray.concat(badResults));
        });
};

module.exports = {
    setRank: setRank,
    rankResults: rankResults
};