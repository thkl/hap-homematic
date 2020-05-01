Changelog for 0.0.34:
=====================

* Fix for Instances/Settings

Changelog for 0.0.33:
=====================

* some tweeks for the webUI

Changelog for 0.0.32:
=====================

* added sorting for webui lists
* implemented a nicer update button
.. tbc

Changelog for 0.0.31:
=====================

* only setup the monitor if system is not in debug and there was a pid file created by the launcher

Changelog for 0.0.30:
=====================

* hap-homematic will install a config for the raspberrymatic monitoring service (if there is one)
* added variable based thermometers
* new special device which will show the ccu core temperature

Changelog for 0.0.29:
=====================

* WebUI Fixed Internals in left menu
* Fixed AlarmSystem (internal vs night mode)

Changelog for 0.0.28:
=====================

* prevent the system from crash on invalid GarageDoorSensors configuration
* changed State() to Value() for fetching data from ccu
* added JALOUSIE channel to blind accessories
* removed fault characteristics from leak sensor (there is no such datapoint)

Changelog for 0.0.27:
=====================

* changed a https client call - for backwards compatibility to old node8 version on ccu3 devices

Changelog for 0.0.26:
=====================

* added special devices
* fixed CCU startup bug
* added optional ccu authentication for configuration page
* added optional https transport for configuration page

Changelog for 0.0.25:
=====================

* Added IP Blinds

Changelog for 0.0.24:
=====================

* Added WinMatic
* Changed Plugin installer to prevent backing up all the stuff (RaspberryMatic Only)

Changelog for 0.0.23:
=====================

* Bugfix for devices with service configuration like devtype:channeltype
* added a testmode

Changelog for 0.0.22:
=====================

* the webUI is now able to show the changelog
* more interal logging


Changelog for 0.0.21:
=====================

* fixed a bug, which prevents the plugin from knowing about some smoke detectors
* added a listener, to "newDevice" event on the interface, so the plugin will query the ccu for new devices, as the are teached in the ccu
