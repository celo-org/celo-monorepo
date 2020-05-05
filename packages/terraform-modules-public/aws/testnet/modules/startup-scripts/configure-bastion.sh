#! /bin/bash

SSH_CONFIG=/etc/ssh/sshd_config

sed -i 's/^AllowAgentForwarding no/AllowAgentForwarding yes/' $SSH_CONFIG
systemctl restart ssh
