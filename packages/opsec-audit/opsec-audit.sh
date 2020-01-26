#!/bin/bash
tput clear
trap ctrl_c INT

function ctrl_c() {
        echo "**Exiting as encountered Ctrl+C"
	exit 0;
}
#
echo "###############################################"
echo "Welcome to the Celo Security audit of your linux machine:"
echo "###############################################"
echo
echo "This script will execute speedtest-cli, lynis, perform some extra checks and upload results:"
echo "Note: it has been tested for Debian/Centos:"
echo
sleep 3
echo "###############################################"
echo "You Are $HOSTNAME..:"
echo
sleep 3
echo "Starting"
START=$(date +%s)
echo -e "\e[0;33m 1. Downloading Lynis////// \e[0m"
curl https://downloads.cisofy.com/lynis/lynis-2.7.5.tar.gz -o lynis-2.7.5.tar.gz
tar xfvz lynis-2.7.5.tar.gz -C /usr/local
echo 'plugin=tooling' | sudo tee -a /usr/local/lynis/custom.prf > /dev/null
echo
echo "###############################################"
echo
echo -e "\e[0;33m 2. Executing Lynis////// \e[0m"
/usr/local/lynis/lynis audit system
echo
echo "###############################################"
echo
echo -e "\e[0;33m 3.  Checking Kernel///// \e[0m"
grep -Ei "no kernel update available" /var/log/lynis.log
grep -Ei "os_kernel_version_full" /var/log/lynis-report.dat
echo
echo "###############################################"
echo
echo -e "\e[0;33m 4. Checking Automatic Updates///// \e[0m"
grep -Ei "unattended_upgrade_tool|unattended_upgrade_option" /var/log/lynis-report.dat
echo
echo "###############################################"
echo
echo -e "\e[0;33m 5. Checking SELinux///// \e[0m"
grep -Ei "selinux_status|selinux_mode|framework_selinux" /var/log/lynis-report.dat
echo
echo "###############################################"
echo
echo -e "\e[0;33m 6. Checking Insecure Services/Vulnerable Programs///// \e[0m"
echo "Check Lynis Output"
echo
echo "###############################################"
echo
echo -e "\e[0;33m 7. Checking GRUB///// \e[0m"
grep -Ei "suggestion\[\]\=BOOT-5122" /var/log/lynis-report.dat
echo
echo "###############################################"
echo
echo -e "\e[0;33m 8. Checking File Permissions///// \e[0m"
grep -Ei "suggestion\[\]\=FILE-7524" /var/log/lynis-report.dat
echo "No Output is Positive"
echo
echo "###############################################"
echo
echo -e "\e[0;33m 9. Check Blank Passwords///// \e[0m"
grep -Ei "warning\[\]\=AUTH-9283" /var/log/lynis-report.dat
echo "No Output is Positive"
echo
echo "###############################################"
echo
echo -e "\e[0;33m 10. Check Password Strength Tools///// \e[0m"
grep -Ei "suggestion\[\]\=AUTH-9262" /var/log/lynis-report.dat
echo "DEBIAN"
cat /etc/pam.d/common-auth
echo "CentOS-RHEL"
cat /etc/pam.d/system-auth
cat /etc/security/pwquality.conf
echo
echo "###############################################"
echo
echo -e "\e[0;33m 11. Check IDS///// \e[0m"
grep ids_ips_tooling /var/log/lynis-report.dat
echo
echo "###############################################"
echo
echo -e "\e[0;33m 12. IPTables///// \e[0m"
echo "Check Lynis Output"
echo
echo "###############################################"
echo
echo -e "\e[0;33m 13. SSH///// \e[0m"
grep -Ei "PermitRootLogin|PasswordAuthentication|ChallengeResponseAuthentication|UsePAM|AllowUsers|AllowGroups" /etc/ssh/sshd_config
echo
echo "###############################################"
echo
echo -e "\e[0;33m 14. Check Docker File Permissions///// \e[0m"
echo "Check Lynis Output"
echo
echo "###############################################"
echo
echo -e "\e[0;33m 15. Downloading and Executing Speedtest///// \e[0m"
curl -Lo speedtest-cli https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py
chmod +x speedtest-cli
./speedtest-cli
echo
echo "###############################################"
echo -e "\e[0;33m 14. Check Ledger///// \e[0m"
echo
echo "###############################################"
echo
lsusb -d "2c97:"
echo
docker exec -it celo-validator geth -exec personal.listWallets attach | grep -B4 "ledger://"
echo
echo "###############################################"
END=$(date +%s)
DIFF=$(( $END - $START ))
echo "Script completed in $DIFF seconds :"
echo

exit 0;
