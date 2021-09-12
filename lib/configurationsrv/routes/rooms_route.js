const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    Returns the room list
    // @route   /api/ccurooms

    router.get('/ccurooms', SessionCheck, async (req, res) => {
        res.json({ rooms: core.pluginRooms });
    });

    return router;
};