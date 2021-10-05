const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const fs = require('fs');
const path = require('path');
module.exports = function (core) {

    // @desc    Returns Localizations
    // @route   /localizations/:lang

    router.get('/localizations/:lang?', async (req, res) => {
        const lang = req.params.lang || 'en';
        const fileName = path.join(__dirname, '..', 'html', 'assets', lang + '.json');
        if (fs.existsSync(fileName)) {
            try {
                res.json(JSON.parse(fs.readFileSync(fileName)));
            } catch (e) {
                res.status(500).send(e);
            }
        } else {
            res.status(404).send(`${lang} not found`);
        }
    });

    return router;
};