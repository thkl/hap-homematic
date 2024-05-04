const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    Initates a Refresh inside the daemon
    // @route   /api/refreshcache

    router.get('/refreshcache', SessionCheck, async (req, res) => {
        core.process.send({
            topic: 'refreshCache'
        });
        res.json({ result: 'initiated' });
    });

    return router;
};