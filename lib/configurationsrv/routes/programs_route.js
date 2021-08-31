const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    Handles Program API
    // @route   /api programs

    router.get('/programs', SessionCheck, async (req, res) => {
        res.json({programs:core.pluginPrograms});
    });

    return router;
};