This is work in progress
========================

1. install nodejs:
```
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
```

2. create a folder for hap in your home 

```
cd ~
mkdir hap-homematic
cd hap-homematic
npm install hap-homematic
```

3. create a data folder in your home
```
mkdir ~/.hap-homematic
```

4. (just for the current version)
test run hap as root (so it's able to write into /var/log)

```
sudo node /home/pi/hap-homematic/node_modules/hap-homematic/index -C /home/pi/.hap-homematic/
```

Note : you have to change /home/pi in the command above into the home path of your user 

5. browse to http://ipofyourdebmatic:9874 to check your installation

if all runs well its time to create a service for hap

create a file in your $home/hap-homematic folder named hap-homematic.service

```
nano hap-homematic.service
```

paste this content

```
[Unit]
Description=Hap_Homematic
After=debmatic-rega.target
[Service]
Type=simple
User=root
ExecStart=/usr/bin/node /home/pi/hap-homematic/node_modules/hap-homematic/index -C /home/pi/.hap-homematic/
Restart=on-failure
RestartSec=10
KillMode=process
[Install]
WantedBy=multi-user.target
```



make the file runable

```
chmod +x ~/hap-homematic/hap-homematic.service
```

link this to the systemd and enable the service

```
sudo systemctl link /home/pi/hap-homematic/hap-homematic.service
sudo systemctl enable hap-homematic.service
```



Note here: you have to adjust path names according to your installation


Run it
```
sudo service hap-homematic start
```

