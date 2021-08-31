const router = require('express').Router();

module.exports = function (core) {

    // @desc    Send the list of all API Methods
    // @route   /

    router.get('/', async (req, res) => {
        res.send('List of Api :');

    });

    return router;
};