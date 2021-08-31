const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    return the list of bridges
    // @route   /api/bridges

    router.get('/bridges', SessionCheck, async (req, res) => {
        res.json({instances:core.bridges});
    });

    // @desc    publish all bridges
    // @route   /api/bridges/ListOfIDs

    router.post('/bridges/:idlist', SessionCheck, async (req, res) => {
        // Save PublishDevices Infos
        let bridgesToPublish = req.params.idlist
        if (bridgesToPublish) {
            core.log.debug('[Config] setPublish flag for %s', bridgesToPublish)
            core.savePublishingFlag(JSON.parse(bridgesToPublish))
        }

        core.process.send({
            topic: 'reloadApplicances'
        })

        res.json({ result: 'initiated' });
    });


    return router;
};