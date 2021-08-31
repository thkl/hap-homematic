const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    Returns the room list
    // @route   /api/rooms

    router.get('/rooms', SessionCheck, async (req, res) => {
        res.json({ rooms: core.pluginRooms });
    });

    return router;
};