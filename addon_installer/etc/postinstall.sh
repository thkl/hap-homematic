#!/bin/sh

ADDONNAME=hap-homematic
CONFIG_DIR=/usr/local/etc/config
ADDON_DIR=/usr/local/addons/${ADDONNAME}
ADDONWWW_DIR=/usr/local/etc/config/addons/www
NPMCACHE_DIR=/tmp/${ADDONNAME}-cache
RCD_DIR=${CONFIG_DIR}/rc.d
LOGFILE=/var/log/${ADDONNAME}_install.log
echo "[Installer]Check existency of the daemon" >>${LOGFILE}
#check if we have our core module; if not go ahead and call the installer stuff
if [ ! -f ${ADDON_DIR}/node_modules/${ADDONNAME}/index.js ]; then
echo "[Installer]Looks like the daemon is not here so start installer" >>${LOGFILE}
echo "[Installer]Running on node version:" >>${LOGFILE}
node --version >>${LOGFILE}
echo "[Installer]NPM is :" >>${LOGFILE}
npm --version >>${LOGFILE}

echo "[Installer]Program Dir is ${ADDON_DIR}" >>${LOGFILE}

echo "[Installer]installing ${ADDONNAME} ...">>${LOGFILE}
#create a cache in /tmp
mkdir ${NPMCACHE_DIR}
cd ${ADDON_DIR}
npm i --cache ${NPMCACHE_DIR} ${ADDONNAME}
#remove the cache
rm -R ${NPMCACHE_DIR} 

#create the button in system control
echo "[Installer]creating HomeKit Button ...">>${LOGFILE}
node ${ADDON_DIR}/node_modules/${ADDONNAME}/etc/hm_addon.js hap ${ADDON_DIR}/node_modules/${ADDONNAME}/etc/hap_addon.cfg
#create the .nobackup file into the plugin directory to prevent backing up all the node depencities
echo "[Installer]Adding .nobackup to addon dir ...">>${LOGFILE}
touch ${ADDON_DIR}/.nobackup
echo "[Installer]link webui ...">>${LOGFILE}
ln -s ${ADDON_DIR}/node_modules/hap-homematic/lib/configurationsrv/client ${ADDONNAME}
echo "[Installer]we are done ...">>${LOGFILE}
else
echo "[Installer]daemon exists lets light this candle" >>${LOGFILE}
fi