const functions = require('firebase-functions');
const firebaseAdmin = require('firebase-admin');
const env = require('./environment.js');
const XMLHttpRequest = require('xhr2');

firebaseAdmin.initializeApp(functions.config().firebase);
const db = firebaseAdmin.database().ref('tweets');

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
    getJSON(url, token, (error, data) => {
        if (error !== null) {
            return console.error(error)
        }
        tweets = data.statuses;
        let tweetIds = tweets.map(tweet => tweet.id_str);
        db.push(tweetIds);
        return response.send(data)
    });
});