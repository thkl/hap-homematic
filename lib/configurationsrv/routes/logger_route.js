const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const fs = require("fs");
module.exports = function (core) {

    // @desc    This is the template
    // @route   /log

    router.get('/log/:download?', SessionCheck, async (req, res) => {
        const file = process.env.UIX_LOGFILE;
        if (req.params.download) {
            res.set({ "Content-Disposition": "attachment; filename=\"haphomematic.log.txt\"" })
        }
        core.log.debug('Sending Logfile %s', file);
        if (fs.existsSync(file)) {
            res.sendFile(file);
        } else {
            console.log(file);
            res.status(404).send("Nothing found");
        }
    });


    router.patch('/debug/:enable', SessionCheck, async (req, res) => {
        const isEnable = req.params.enable
        core.toggleDebug(isEnable);
        setTimeout(async () => { //Switching Debugging takes a while
            let sysData = await core.getSystemInfo();
            res.json(sysData);
        }, 500);
        //          this.heartBeat() // trigger a new websocks push so the UI will change
    })
    return router;
};