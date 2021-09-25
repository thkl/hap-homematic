const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
module.exports = function (core) {

    // @desc    This is the template
    // @route   /log

    router.get('/log', SessionCheck, async (req, res) => {
        const file = process.env.LOGFILE;
        core.log.debug('Sending Logfile %s', file);
        res.sendFile(file);
    });


    router.patch('/debug/:enable', SessionCheck, (req, res) => {
        const isEnable = req.params.enable
        core.toggleDebug(isEnable);
        core.log.debug('debugging is %s', isEnable)
        res.json({ result: isEnable })
        //          this.heartBeat() // trigger a new websocks push so the UI will change
    })
    return router;
};