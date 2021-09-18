const router = require('express').Router();
const path = require('path');

module.exports = function (core) {

    // @desc    Send the list of all API Methods
    // @route   /

    router.get('/', async (req, res) => {
        res.sendFile(path.join(__dirname, 'routes.html'));
    });

    return router;
};