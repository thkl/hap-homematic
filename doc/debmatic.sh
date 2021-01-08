#!/bin/bash

curl -sL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt install -y nodejs
mkdir $HOME/hap-homematic
mkdir $HOME/.hap-homematic
cd $HOME/hap-homematic
npm install hap-homematic
bash -c 'cat << EOT >> $HOME/hap-homematic/hap-homematic.service
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
EOT'

chmod +x $HOME/hap-homematic/hap-homematic.service
sudo systemctl link $HOME/hap-homematic/hap-homematic.service
sudo systemctl enable hap-homematic.service
