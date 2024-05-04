const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const fs = require('fs');
const os = require("os");
const path = require('path');
const Settings = require('../settings');
const fileUpload = require('express-fileupload');
module.exports = function (core) {

    // @desc    This is the backup route
    // @route   /

    router.get('/backup', SessionCheck, async (req, res) => {
        core.log.info('backup Command')
        let backupFile = await Settings.generateBackup()
        if (fs.existsSync(backupFile)) {
            let statBf = fs.statSync(backupFile)
            let d = new Date();
            readStream = fs.createReadStream(backupFile)
            const headers = {
                'Content-Disposition': `attachment; filename=hap-homematic-backup-${d.getDate()}_${d.getMonth() + 1}_${d.getFullYear()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.tar.gz`,
            }
            res.sendFile(backupFile, { headers })
        } else {
            res.send({ error: 'backup file not found', path: backupFile })
        }
    });




    router.post('/restore', SessionCheck, fileUpload(), async (req, res) => {
        if (req.files) {
            const fileData = req.files["backupdata"];
            core.log.info('restore file is %s', fileData.name);

            if (fileData.mimetype === 'application/x-gzip') {
                const destTmp = path.join(os.tmpdir(), 'tmp_import');
                await fileData.mv(destTmp)
                const restoreResult = Settings.checkAndExtractUploadedConfig(destTmp);
                if (restoreResult === true) {
                    core.log.info('restore successfull');
                    core.log.info('performing restart');
                    core.restartSystem();
                    res.send({ result: 'ok' });
                }
            } else {
                core.log.info('filename is %s mimetype is %s', fileData.fieldname, fileData.mimetype)
                res.status(500).send('Wrong FileData')
            }
        } else {
            core.log.info('restore missing file in %s', req.file);
            res.status(500).send('Missing File');
        }

    })

    return router;
};