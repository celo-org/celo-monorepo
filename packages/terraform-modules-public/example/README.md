# Configure your setup

You can take this terraform code as base for your setup. You need to configure the next parameters.

## Project parameters

The first parameters to configure are the Google Cloud parameters. Please configure your GCP project, region and zone. Additionally, you can configure your `attestation_service_db` username/password for someone of your convenience.
Most of the parameters are safe to go with the default value. You can configure the replica count for each service, but a good starting point would be 1 validator, 1 proxy, and 1 attestation service. Each validator service has an attached proxy service.

## Validator accounts

Using the [celocli](https://www.npmjs.com/package/@celo/celocli), run the next command to get credentials for the needed account:

```bash
$ celocli account:new
This is not being stored anywhere, so, save the mnemonic somewhere to use this account at a later point

mnemonic: history lemon flight ask umbrella emerge lawsuit bar tortoise demand oak brave together kiss dance filter yellow scheme check victory also daring reward uphold
privateKey: d497b2c97f5cd276c09e53b80ee5300ff37bbf6c6e9b814d908d2ab654e56137
publicKey: 041e9f487477b7d9f5c5818a1337601f05b790267ffc052aa98b49bea88a920bb2667aea5c99b47718da9198645669d6fa3643e547b9e2e1d386c4d9ee300db0cd
accountAddress: 0x2A809BeE654AAe41794838291390BC75BEd100BB
```

In the example, `0x2A809BeE654AAe41794838291390BC75BEd100BB` would be an account address, `d497b2c97f5cd276c09e53b80ee5300ff37bbf6c6e9b814d908d2ab654e56137` a private key.

You have to generate an account for each component you want to deploy. Please save this credentials securely so you can recover or access your account when you need.

For the proxy_accounts["private_node_keys"] and proxy_accounts["enodes"] you can use the next bash snippet:

```bash
DOCKER_IMAGE="gcr.io/celo-testnet/geth-all:5f34ad666ef506de914285b5cd9f7ffe88eaed68"
docker run -i --rm --entrypoint=/bin/sh $DOCKER_IMAGE <<'EOF'
bootnode -genkey /tmp/pkey && \
ENODE_ADDRESS=$(bootnode -nodekey /tmp/pkey -writeaddress) && \
echo "Enode Address: ${ENODE_ADDRESS}" && \
echo "Associated private node key: $(cat /tmp/pkey)"
EOF
```

Which should return an output of the shape:

```bash
Enode Address: bcd2cabf722abe26f2d3bb7dd02bd2bc0e94f0d2884a3628088974f96a7636abe189771fa3d40ae929dfe3e08ccaf1eca2c1063ce57411f430c96ec3faacbca6
Associated private node key: eb99dc2de55a5253dd2834411c2795050e8cb67ac3b6482352aa26b99778eabc
```

The passwords referred in the variables will be used to import the accounts in the geth deployed (i.e.: The passwords have not to exist previously). They will keep your account safe if somebody access to the keystore file or if you want to unlock the account.
