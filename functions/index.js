const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const env = require('./environment.js');
const XMLHttpRequest = require('xhr2');

firebaseAdmin.initializeApp(functions.config().firebase);
const tweetDb = firebaseAdmin.database().ref('tweets');
const metaDb = firebaseAdmin.database().ref('meta');

const getJSON = (url, token, callback) => {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader("Authorization", "Bearer " + token);
    xhr.responseType = 'json';
    xhr.onload = function () {
        let status = xhr.status;
        if (status === 200) {
            return callback(null, xhr.response);
        } else {
            return callback(status, xhr.response);
        }
    }
    xhr.send();
}

var url = env.api_base_url + env.api_search_url + env.api_search_query;
var token = env.api_token;

exports.countTweets = functions.https.onRequest((request, response) => {
    const checkForTweetsAndUpdate = (error, data) => {
        if (error !== null) {
            return console.error(error);
        }
        let tweets = data.statuses;
        let mostRecentTweet = 0;
        metaDb.child("mostRecentTweet").once("value", data => mostRecentTweet = parseInt(data));
        console.log(mostRecentTweet);
        if (! tweets.length) {
            return console.log("All Tweets Searched");
        }
        if (parseInt(mostRecentTweet) < parseInt(tweets[0].id_str) ) {
            console.log("Check Performed");
            metaDb.child("mostRecentTweet").set(tweets[0].id_str);
        }
        let tweetIds = {};
        tweets.forEach(tweet => tweetIds[tweet.id_str] = tweet.text);
        tweetDb.update(tweetIds);

        return getJSON(env.api_base_url + env.api_search_url + data.search_metadata.next_results, token, checkForTweetsAndUpdate);
    }
    getJSON(url, token, checkForTweetsAndUpdate);
    return response.send({success: true});
});