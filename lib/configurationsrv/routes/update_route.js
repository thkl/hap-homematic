const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const httpClient = require('../httpclient');

const GITHUBCHANGELOGURL = 'https://raw.githubusercontent.com/thkl/hap-homematic/NewUI/CHANGELOG.json';

module.exports = function (core) {

    // @desc    Returns the current changelog
    // @route   /changelog

    router.get('/changelog', SessionCheck, async (req, res) => {
        httpClient.getJSON(GITHUBCHANGELOGURL).then(
            (cl) => {
                res.send(cl);
            }).catch((e) => {
                res.status(500).send(e);
            })
    });

    return router;
};