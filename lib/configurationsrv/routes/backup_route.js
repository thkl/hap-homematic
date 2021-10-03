const router = require('express').Router();
const SessionCheck = require('../middleware/sessioncheck');
const fs = require('fs');
const path = require('path');
const Settings = require('../settings');
var multer = require('multer');

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



    const upload = multer({ dest: Settings.getTempFolder() });

    router.post('/restore', [SessionCheck, upload.single('backupdata')], async (req, res) => {
        console.log(req.file)
        if (req.file) {
            const fileData = req.file;
            core.log.info('restore file is %s', fileData.path);

            if ((fileData.fieldname === 'backupdata') && (fileData.mimetype === 'application/x-gzip')) {
                const restoreResult = Settings.checkAndExtractUploadedConfig(fileData.path);
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