const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const https = require('https');

const changelogRequest = () => {
    return new Promise((resolve, reject) => {
        https.get('https://raw.githubusercontent.com/thkl/hap-homematic/NewUI/CHANGELOG.json', (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('close', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });

        })
    })
}


module.exports = function (core) {

    // @desc    Returns the current changelog
    // @route   /changelog

    router.get('/changelog', SessionCheck, async (req, res) => {
        changelogRequest().then((cl) => {
            res.send(cl);
        }).catch((e) => {
            res.status(500).send(e);
        })
    });

    return router;
};