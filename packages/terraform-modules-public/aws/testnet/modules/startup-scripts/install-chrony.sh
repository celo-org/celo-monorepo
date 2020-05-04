#! /bin/bash
apt-get update
apt-get --assume-yes remove ntp*
apt-get --assume-yes install chrony

# This configures chrony on the instance to use the Amazon Time Sync Service
# See https://aws.amazon.com/blogs/aws/keeping-time-with-amazon-time-sync-service/ for more details

mv /etc/chrony/chrony.conf /etc/chrony/chrony.conf.old
sed '/^pool ntp\.ubuntu\.com*/i server 169.254.169.123 prefer iburst minpoll 4 maxpoll 4' /etc/chrony/chrony.conf.old > /etc/chrony/chrony.conf
/etc/init.d/chrony restart
