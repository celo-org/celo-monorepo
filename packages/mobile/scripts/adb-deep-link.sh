# some useful commands for testing deep links

# use adb to launch a deep link

adb shell am start -a android.intent.action.VIEW -d "celo://wallet/pay?address=0x0b784e1cf121a2d9e914ae8bfe3090af0882f229&displayName=Crypto4BlackLives&e164PhoneNumber=%2B14046251530"
