# Validator Setup FAQ

This is a living document. Please contribute if you have a solution to a common problem.

## How do I reset my local celo state?
You may desire to reset your local chain state when updating parameters or wishing to do a clean reset. Note that this will cause the node to resync from block 0 which will take a couple hours.
```bash
# Remove the celo state directory
sudo rm -rf celo
# Recreate the genesis state
sudo docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
```
## How do I backup a local Celo private key?
It's important that local accounts are properly backed up for disaster recovery. The local keystore files are encrypted with the specified account password and stored in the keystore directory. To copy this file to your local machine you may use ssh:

```bash
ssh USERNAME@IPADDRESS "sudo cat /root/.celo/keystore/<KEYSTORE_FILE>" > ./nodeIdentity
```

You can then back this file up to a cloud storage for redundancy.
{% hint style="warning" %}
**Warning**: It's important that a strong password used since this file will be held in potentially insecure environments.
{% endhint %}

## How do I install and use celocli on my node?

To install celocli in on a Linux machine, run the following:
``` bash
sudo apt-get update -y
sudo apt-get install lsb-release libudev-dev libusb-dev libusb-1.0-0 -y
sudo npm install -g @celo/celocli --unsafe-perm
```

You can then run celocli and point it to your local geth.ipc file:
``` bash
# Check if node is synced using celocli
sudo celocli node:synced --node geth.ipc
```