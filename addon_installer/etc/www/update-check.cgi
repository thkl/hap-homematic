#!/bin/tclsh

set version_url "https://raw.githubusercontent.com/thkl/hap-homematic/master/addon_installer/VERSION"
set package_url "https://github.com/thkl/hap-homematic/releases/latest"

set cmd ""
if {[info exists env(QUERY_STRING)]} {
	regexp {cmd=([^&]+)} $env(QUERY_STRING) match cmd
}
if {$cmd == "download"} {
	puts "<html><head><meta http-equiv=\"refresh\" content=\"0; url=${package_url}\" /></head><body><a href=\"${package_url}\">${package_url}</a></body></html>"
} else {
	puts [exec /usr/bin/wget -q --no-check-certificate -O- "${version_url}"]
}