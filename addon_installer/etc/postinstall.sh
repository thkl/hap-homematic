#!/bin/sh

ADDONNAME=hap-homematic
CONFIG_DIR=/usr/local/etc/config
ADDON_DIR=/usr/local/addons/${ADDONNAME}
ADDONWWW_DIR=/usr/local/etc/config/addons/www
RCD_DIR=${CONFIG_DIR}/rc.d
LOGFILE=/var/log/hmhap.log

#check if we have our core module; if not go ahead and call the installer stuff
if [ ! -f ${ADDON_DIR}/node_modules/hap-homematic/index.js ]; then

echo "[Installer]Start installer" >>${LOGFILE}
echo "[Installer]Program Dir is ${ADDON_DIR}" >>${LOGFILE}

echo "[Installer]updating npm paths ...">>${LOGFILE}
mount -o remount,rw /
mkdir -p /usr/local/addons/npm/
npm config set cache /usr/local/addons/npm/.npm
npm config set path /usr/local/addons/npm/.npm
npm config set userconfig /usr/local/addons/npm/.npmrc
npm config set init-module /usr/local/addons/npm/.npm-init.js

echo "[Installer]installing HAP-Homematic ...">>${LOGFILE}

cd ${ADDON_DIR}
npm install ${ADDONNAME}

#create the button in system control
echo "[Installer]creating HomeKit Button ...">>${LOGFILE}
node ${ADDON_DIR}/node_modules/${ADDONNAME}/etc/hm_addon.js hap ${ADDON_DIR}/node_modules/${ADDONNAME}/etc/hap_addon.cfg
mount -o remount,ro /

fi