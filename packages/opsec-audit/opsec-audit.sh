#!/bin/bash
tput clear
trap ctrl_c INT
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

LYNIS_TARFILE=lynis-2.7.5.tar.gz

function ctrl_c() {
  echo "**Exiting as encountered Ctrl+C"
  exit 0
}

function testcmd() {
  if command -v "$1" >/dev/null; then
    return 0
  else
    echo "The command $1 is not installed in your system. Please intall it and run the script again"
    return 1
  fi
}

function check_root() {
  if [[ $EUID -ne 0 ]]; then
    echo "Please run this script as root or using sudo"
    exit 1
  fi
}

function get_so() {
  # From https://unix.stackexchange.com/questions/6345/how-can-i-get-distribution-name-and-version-number-in-a-simple-shell-script
  if [ -f /etc/os-release ]; then
    # freedesktop.org and systemd
    source /etc/os-release
    OS=$NAME
    VER=$VERSION_ID
  elif type lsb_release >/dev/null 2>&1; then
    # linuxbase.org
    OS=$(lsb_release -si)
    VER=$(lsb_release -sr)
  elif [ -f /etc/lsb-release ]; then
    # For some versions of Debian/Ubuntu without lsb_release command
    source /etc/lsb-release
    OS=$DISTRIB_ID
    VER=$DISTRIB_RELEASE
  elif [ -f /etc/debian_version ]; then
    # Older Debian/Ubuntu/etc.
    OS=Debian
    VER=$(cat /etc/debian_version)
  else
    # Fall back to uname, e.g. "Linux <version>", also works for BSD, etc.
    OS=$(uname -s)
    VER=$(uname -r)
  fi
}
##
check_root
get_so

#
echo "###############################################"
echo "Welcome to the Celo Security audit of your linux machine:"
echo "###############################################"
echo
echo "This script will execute speedtest-cli, lynis, perform some extra checks and upload results:"
echo "Note: it has been tested for Debian/Centos."
echo
sleep 3
echo "###############################################"
echo "You Are $HOSTNAME, $OS $VER distribution...:"
echo
sleep 3
echo "Starting"
START=$(date +%s)
if [[ ! -f "/usr/local/lynis/lynis" ]]; then
  if [[ ! -f "$DIR/$LYNIS_TARFILE" ]]; then
    echo -e "\e[0;33m 1. Downloading Lynis////// \e[0m"
    curl -s -f https://downloads.cisofy.com/lynis/$LYNIS_TARFILE -o "$DIR/$LYNIS_TARFILE"
  fi
  tar xfvz "$DIR/$LYNIS_TARFILE" -C /usr/local
fi
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
if [[ "$OS" == *"Debian"* ]] || [[ "$OS" == *"Ubuntu"* ]]; then
  echo "DEBIAN"
  cat /etc/pam.d/common-auth
elif [[ "$OS" == *"CentOS"* ]] || [[ "$OS" == *"Red Hat"* ]] || [[ "$OS" == *"Fedora"* ]]; then
  echo "CentOS-RHEL"
  cat /etc/pam.d/system-auth
  cat /etc/security/pwquality.conf
fi
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
if [[ ! -f "$DIR/speedtest-cli" ]]; then
  echo -e "\e[0;33m 15a. Downloading Speedtest///// \e[0m"
  curl -s -f -Lo speedtest-cli https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py
fi
echo -e "\e[0;33m 15b. Executing Speedtest///// \e[0m"
chmod +x $DIR/speedtest-cli
$DIR/speedtest-cli
echo
echo "###############################################"
echo -e "\e[0;33m 16. Check Ledger///// \e[0m"
echo
echo "###############################################"
echo
testcmd lsusb && lsusb -d "2c97:"
echo
testcmd docker && docker ps | grep celo-validator && docker exec -it celo-validator geth -exec personal.listWallets attach | grep -B4 "ledger://"
echo
echo "###############################################"
END=$(date +%s)
DIFF=$(( END - START ))
echo "Script completed in $DIFF seconds :"
echo

exit 0

