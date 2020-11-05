#! /bin/bash

apt-get update
apt-get --assume-yes install \
    python \
    apt-show-versions \
    libpam-cracklib \
    fail2ban \
    unzip

SSH_CONFIG=/etc/ssh/sshd_config

sed -i 's/^#AllowAgentForwarding yes/AllowAgentForwarding no/' $SSH_CONFIG
sed -i 's/^#AllowTcpForwarding yes/AllowTcpForwarding no/' $SSH_CONFIG
sed -i '/UsePAM yes/a AllowUsers ubuntu' $SSH_CONFIG
sed -i 's/^#ClientAliveCountMax [0-9]*/ClientAliveCountMax 2/' $SSH_CONFIG
sed -i 's/^#Compression [a-zA-Z]*/Compression no/' $SSH_CONFIG
sed -i 's/^#TCPKeepAlive [a-zA-Z]*/TCPKeepAlive no/' $SSH_CONFIG
sed -i 's/^X11Forwarding yes/X11Forwarding no/' $SSH_CONFIG
sed -i 's/^#MaxSessions [0-9]*/MaxSessions 2/' $SSH_CONFIG
sed -i 's/^#MaxAuthTries [0-9]*/MaxAuthTries 3/' $SSH_CONFIG
sed -i 's/^#LogLevel [a-zA-Z]*/LogLevel VERBOSE/' $SSH_CONFIG

systemctl restart ssh
