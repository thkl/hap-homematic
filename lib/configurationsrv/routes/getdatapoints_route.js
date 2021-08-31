const router = require('express').Router();
const CCU = require('../ccu');
const SessionCheck = require('../middleware/sessioncheck');

module.exports = function (core) {


    /**
    * @desc    Send the list of Datapoints back
    * @route   /ccudatapoints
    */

    router.get('/ccudatapoints/:channel?', SessionCheck, async (req, res) => {
        try {
            let dps = await CCU.ccuGetDatapoints(req.params.channel);
            res.json(dps);
        } catch (e) {
            res.sendStatus(500);
        }
    });

    return router;
};