# hap-homematic
[![Build Status](https://travis-ci.org/thkl/hap-homematic.svg?branch=master)](https://travis-ci.org/thkl/hap-homematic)
[![npm version](https://badge.fury.io/js/hap-homematic.svg)](https://badge.fury.io/js/hap-homematic)

<p align="center">
    <img src="doc/hap_homematic_ui1.png">
</p>


a Raspberrymatic / CCU3 addon


This RaspberryMatic / CCU3 addon will allow you to access your HomeMatic devices from HomeKit. Its much like https://github.com/thkl/homebridge-homematic but without homebridge.
All this runs on your RaspberryMatic / CCU3. You will not need any extra hardware.

# Installation
Download the addon: https://github.com/thkl/hap-homematic/raw/master/addon_installer/hap-homematic-0.0.6.tar.gz and install it via system preferences.

A little bit later (the addon will install all other needed software) you will have a HomeKit button in your ccu system preference page.

This will not run on a older CCU2 model.

Used Ports : 
* 9874 -> Config WebUI
* 9875 -> RPC event server
* 9876 -> RPC event server CuxD (optional)
* 9877..n HAP Instance 0 .. n

make sure your ccu firewall does not block ports 9874,9877 ... n

# HTTPS
If you are using the https version of your ccu WebUI page, you have to enable https for the hap-homematic configuration page also.
hap-homematic will use the same self signed tls certificate as your ccu.

# Authentication
You can use your ccu user management as an optional authentication for hap-homematic. If you turn on this feature, you have to call the configuration page from your ccu webUI system preference page to use a valid session. Only ccu admins are alowed to use the hap-homematic configuration page if authentication was turned on.

# Concept of rooms
HAP the homekit accessory protocol does not know a room concept. So when you add one or more devices to a bridge the will appear at the same room as the bridge in your homekit client application. Therefore hap-homematic is able to fire up multiple bridges (hap instances). During the installation wizzard you may add a instance for each of your rooms, add theese instances to homekit and put them into rooms. From this time on adding a new device to an instance will place this device into the same room as your brigde.

# FakeGato History
All generated homekit devices will support fakegato history (if there is a history option in eve). 
Please note: History is only available if u are using the eve app as a homekit controller.

# Issues and not supported devices
Please open an issue [here](https://github.com/thkl/hap-homematic/issues/new) for all what went wrong.

# Icon
the icon was made by @roe1974