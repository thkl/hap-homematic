/*
 * **************************************************************
 * File: settings.js
 * Project: hap-homematic
 * File Created: Monday, 4th October 2021 2:32:12 pm
 * Author: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Last Modified: Sunday, 10th October 2021 4:23:31 pm
 * Modified By: Thomas Kluge (th.kluge@me.com>)
 * -----
 * Copyright 2020 - 2021 @thkl / github.com/thkl
 * -----
 * **************************************************************
 * MIT License
 * 
 * Copyright (c) 2021 github.com/thkl
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * **************************************************************
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class Settings {

    setLogger(log) {
        this.log = log;
    }

    getConfigPath() {
        return process.env.UIX_CONFIG_PATH;
    }

    loadSettings() {
        let configFile = path.join(this.getConfigPath(), 'config.json')
        if (fs.existsSync(configFile)) {
            return JSON.parse(fs.readFileSync(configFile))
        }
        return {}
    }

    saveSettings(configData) {
        let configFile = path.join(this.getConfigPath(), 'config.json')
        fs.writeFileSync(configFile, JSON.stringify(configData, ' ', 1))
    }

    getTempFolder() {
        return os.tmpdir();
    }

    generateBackup() {
        let self = this
        return new Promise((resolve, reject) => {
            self.log.info('creating backup')
            let backupFile = `${self.getTempFolder()}/hap_homematic_backup.tar.gz`
            // remove the old backup if there is one
            if (fs.existsSync(backupFile)) {
                self.log.warn('old backup found. will remove this')
                fs.unlinkSync(backupFile)
            }
            let backupCommand = `tar -C ${this.getConfigPath()} -czvf ${backupFile} --exclude="*persist.json" --exclude="hap-autobackup_*.*" .`
            self.log.info('running %s', backupCommand)
            const childprocess = require('child_process')
            childprocess.exec(backupCommand, (error, stdout, stderr) => {
                self.log.info('creating backup done will return %s', stdout)
                if (error) {
                    reject(error)
                }
                resolve(backupFile)
            })
        })
    }

    deleteFolderRecursive(pathRemove) {
        let self = this
        if (fs.existsSync(pathRemove)) {
            fs.readdirSync(pathRemove).forEach((file, index) => {
                const curPath = path.join(pathRemove, file)
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    self.deleteFolderRecursive(curPath)
                } else { // delete file
                    fs.unlinkSync(curPath)
                }
            })
            fs.rmdirSync(pathRemove)
        }
    }

    checkAndExtractUploadedConfig(tmpFile) {

        // create a tmp directory and extract the file
        let tmpDir = path.join(this.getTempFolder(), 'haptmp')
        if (fs.existsSync(tmpDir)) {
            // clean up by removing old stuff
            this.deleteFolderRecursive(tmpDir)
        }
        fs.mkdirSync(tmpDir)
        // extract the files there
        const childprocess = require('child_process')
        const command = `tar -xzf ${tmpFile} -C ${tmpDir}`;
        try {
            childprocess.execSync(command)
        } catch (e) {
            this.log.error('[Config] error while extracting the upload %s', command)
            return false
        }

        // check config.json
        try {
            let tmpConfig = JSON.parse(fs.readFileSync(path.join(tmpDir, 'config.json')))
            if (tmpConfig) {
                // move the config to my folder
                let myConfigFile = path.join(this.getConfigPath(), 'config.json')
                if (fs.existsSync(myConfigFile)) {
                    fs.unlinkSync(myConfigFile)
                }
                fs.copyFileSync(path.join(tmpDir, 'config.json'), path.join(this.getConfigPath(), 'config.json'))
                // copy the persistent files
                let rgx1 = new RegExp(os.hostname + '_.*.pstore')
                let rgx2 = new RegExp(os.hostname + '_.*_persist.json')
                fs.readdir(tmpDir, (err, files) => {
                    if (!err) {
                        files.forEach(file => {
                            if ((file.match(rgx1)) || (file.match(rgx2))) {
                                fs.copyFileSync(path.join(tmpDir, file), path.join(this.getConfigPath(), file))
                            }
                        })
                    }
                })
                // create the new persist folder
                let persistFolder = path.join(this.getConfigPath(), 'persist')

                if (!fs.existsSync(persistFolder)) {
                    fs.mkdirSync(persistFolder)
                    // copy all persist data to the config path
                    fs.readdir(path.join(tmpDir, 'persist'), (err, files) => {
                        if (!err) {
                            files.forEach(file => {
                                fs.copyFileSync(path.join(tmpDir, 'persist', file), path.join(persistFolder, file))
                            })
                        }
                    })
                }
                // remove the uploaded file
                fs.unlinkSync(tmpFile)
                return true
            } else {
                return false
            }
        } catch (e) {
            return false
        }
    }
}


exports = module.exports = new Settings();