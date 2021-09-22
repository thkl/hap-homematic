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
            const channel = req.params.channel;
            if (channel) {
                let dps = await CCU.ccuGetDatapoints(channel);
                res.json(dps);
            } else {
                res.status(500).send("missing parameter channel")
            }
        } catch (e) {
            res.sendStatus(500);
        }
    });

    return router;
};