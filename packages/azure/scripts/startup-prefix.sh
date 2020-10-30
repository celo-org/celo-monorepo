archive=$(grep --text --line-number '__TARBALL__:$' $0 | cut -f1 -d:)
tail -n +$((archive + 1)) $0 | tar -xvf - > /dev/null
./startup.sh
exit 0
__TARBALL__:
