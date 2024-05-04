const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    sends a fresh devicelist to the client via Sockets
    // @route   /api/refresh

    router.get('/refresh', SessionCheck, async (req, res) => {
        core.sendObjects();
        res.json({ result: 'ok' });
    });

    return router;
};