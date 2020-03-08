ADDONNAME=hap-homematic
ADDON_DIR=/usr/local/addons/${ADDONNAME}
CONFIG_DIR=/usr/local/etc/config
WWW_DIR=${CONFIG_DIR}/addons/www/${ADDONNAME}

#check if we have our core module; if not go ahead and call the installer stuff
if [ ! -f ${ADDON_DIR}/index.js ]; then

mkdir -p ${WWW_DIR}
chmod 755 ${WWW_DIR}

echo "[Installer]Start installer" >>/var/log/hap-homematic.log
echo "[Installer]Program Dir is ${ADDON_DIR}" >>/var/log/hap-homematic.log

#install node and fetch the core module
cd ${ADDON_DIR}


echo "[Installer]Switch Root FS to RW" >>/var/log/hap-homematic.log

# since the settingsfile of npm is located in /root/.npm we need rw on the root filesystem
mount -o remount,rw /

echo "[Installer]mk cache dir ${ADDON_DIR}/.npm" >>/var/log/hap-homematic.log
cd ${ADDON_DIR}
mkdir ${ADDON_DIR}/.npm

echo "cache=/usr/local/addons/hap-homematic/.npm" > /root/.npmrc
echo "init-module=/usr/local/addons/hap-homematic/.npm-init.js" >> /root/.npmrc
echo "userconfig=/usr/local/addons/hap-homematic/.npmrc" >> /root/.npmrc
echo "path=/usr/local/addons/hap-homematic/.npm" >> /root/.npmrc



#install log rotator
echo "[Installer]Add logrotator" >>/var/log/hap-homematic.log
cp ${ADDON_DIR}/etc/hap-homematic.conf /etc/logrotate.d/hap-homematic.conf


#make .npm
echo "[Installer]Build cache " >>/var/log/hap-homematic.log
npm config set cache ${ADDON_DIR}/.npm >>/var/log/hap-homematic.log

echo "[Installer]Check cache " >>/var/log/hap-homematic.log
npm config get cache >>/var/log/hap-homematic.log

#install the core system
echo "[Installer]Install Core system" >>/var/log/hap-homematic.log
cd ${ADDON_DIR}
npm install hap-homematic >>/var/log/hap-homematic.log

echo "[Installer]Switch Root FS back to RO" >>/var/log/hap-homematic.log

echo "[Installer]Add Menu Buttons" >>/var/log/hap-homematic.log
#add the menu button
cd /usr/local/addons/hap-homematic/etc/
chmod +x update_addon
#touch /usr/local/etc/config/hm_addons.cfg
node /usr/local/addons/hap-homematic/etc/hm_addon.js hap /usr/local/addons/hap-homematic/etc/hap_addon.cfg


#link redirector
ln ${ADDON_DIR}/etc/www/index.html ${WWW_DIR}/index.html

#Setup config.json
if [ ! -f ${CONFIG_DIR}/hap-homematic/config.json ]; then
	cp ${ADDON_DIR}/etc/config.json.default ${CONFIG_DIR}/hap-homematic/config.json
fi

# end check install needed
fi

#switch back to read only
mount -o remount,ro /
