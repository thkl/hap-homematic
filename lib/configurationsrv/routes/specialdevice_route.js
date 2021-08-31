const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');

module.exports = function (core) {

    // @desc    Returns the list of special devices
    // @route   /api/special

    router.get('/special', SessionCheck, async (req, res) => {
        res.json({ special: core.pluginSpecial });
    });

    return router;
};