# Enable autologout
cat <<EOF > /etc/profile.d/autologout.sh
TMOUT=300
readonly TMOUT
export TMOUT
EOF
chmod +x /etc/profile.d/autologout.sh

# Limit proc mount
mount -o remount,rw,hidepid=2 /proc

# Harden login.defs
sed -i 's/^UMASK\t*022/UMASK\t\t027/' /etc/login.defs
sed -i 's/^PASS_MAX_DAYS\t*[0-9]*/PASS_MAX_DAYS\t90/' /etc/login.defs
sed -i 's/^PASS_MIN_DAYS\t*[0-9]*/PASS_MIN_DAYS\t1/' /etc/login.defs

# Disable core dumps
echo "* hard core 0" >> /etc/security/limits.d/core.conf
echo "ulimit -c 0 > /dev/null 2>&1" >> /etc/profile.d/disablecoredumps.sh
chmod +x /etc/profile.d/disablecoredumps.sh
cat <<EOF > /etc/systemd/coredump.conf
[Coredump]

Storage=none
ProcessSizeMax=0
EOF
systemctl daemon-reload

# sysctl Hardening
echo "net.ipv4.conf.default.log_martians=1" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_source_route=0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.send_redirects=0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.log_martians=1" >> /etc/sysctl.conf
echo "kernel.sysrq=0" >> /etc/sysctl.conf
echo "kernel.kptr_restrict=2" >> /etc/sysctl.conf
echo "kernel.dmesg_restrict=1" >> /etc/sysctl.conf
echo "kernel.core_uses_pid=1" >> /etc/sysctl.conf
echo "fs.suid_dumpable=0" >> /etc/sysctl.conf
echo "net.ipv6.conf.default.accept_redirects=0" >> /etc/sysctl.conf
echo "net.ipv6.conf.all.accept_redirects=0" >> /etc/sysctl.conf
echo "net.ipv4.conf.default.accept_redirects=0" >> /etc/sysctl.conf
echo "net.ipv4.conf.all.accept_redirects=0" >> /etc/sysctl.conf

sysctl --system

# Upgrade packages
apt update
unattended-upgrade -d
apt upgrade -y

# Harden file permissions
chmod 600 /boot/grub/grub.cfg
chmod 600 /etc/at.deny
chmod 600 /etc/crontab
chmod 600 /etc/ssh/sshd_config
chmod 700 /etc/cron.d
chmod 700 /etc/cron.daily
chmod 700 /etc/cron.hourly
chmod 700 /etc/cron.weekly
chmod 700 /etc/cron.monthly