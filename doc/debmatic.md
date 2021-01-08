This is work in progress
========================

0. you can use the 1 Step install script:

```
curl -sL https://raw.githubusercontent.com/thkl/hap-homematic/master/doc/debmatic.sh | bash -
````

or do the steps by yourself 

1. install nodejs:
```
curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
```

2. create a folder for hap in your home 

```
mkdir $HOME/hap-homematic
cd $HOME/hap-homematic
npm install hap-homematic
```

3. create a data folder in your home
```
mkdir $HOME/.hap-homematic
```

4. create a file in your $home/hap-homematic folder named hap-homematic.service

```
nano $HOME/hap-homematic.service
```

paste this content

```
[Unit]
Description=Hap_Homematic
After=debmatic-rega.target
[Service]
Type=simple
User=root
ExecStart=/usr/bin/node $HOME/hap-homematic/node_modules/hap-homematic/index -C $HOME/.hap-homematic/
Restart=on-failure
RestartSec=10
KillMode=process
[Install]
WantedBy=multi-user.target
```



make the file runable

```
chmod +x $HOME/hap-homematic/hap-homematic.service
```

link this to the systemd and enable the service

```
sudo systemctl link $HOME/hap-homematic/hap-homematic.service
sudo systemctl enable hap-homematic.service
```



Note here: you have to adjust path names according to your installation


Run it
```
sudo service hap-homematic start
```

