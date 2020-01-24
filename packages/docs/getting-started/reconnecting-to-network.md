# How to reconnect to Baklava after a network reset

If you were running a Validator and Proxy in a previous phase of the `baklava` network, this page contains instructions about how to set up your Validator on the current phase.

## Stop all your nodes

```bash
# On your local machine
docker stop celo-accounts && docker rm celo-accounts
```

```bash
# On your validator machine
docker stop celo-validator && docker rm celo-validator
```

```bash
# On your proxy machine
docker stop celo-proxy && docker rm celo-proxy
```

```bash
# On your attestations machine
docker stop celo-attestations && docker rm celo-attestations
docker stop celo-attestation-service && docker rm celo-attestation-service
```

If you have provided attestations, you will want to wipe the database that you configured the attestation service to.

## Double check that you still have your keys

Make sure that you still have your Validator, Validator Group, Validator signer and Attestation signer private keys, as you will be able to re-use them in the next phase of the network. You can do so by listing the contents of your `keystore` directory on each machine. You should see a file ending with the address of the corresponding key.

```bash
# On your local machine
# You should see the keystore file for your Validator and Group keys.
ls celo-accounts-node/keystore
```

```bash
# On your validator machine
# You should see the keystore file for your Validator signer key.
ls celo-validator-node/keystore
```

```bash
# On your Attestation machine
# You should see the keystore file for your Attestation signer key.
ls celo-attestations-node/keystore
```

## Delete chain data from your nodes

Because we are re-connecting to a new blockchain, it's necessary to remove the previous chain data before syncing with the network.

```bash
# On your local machine
cd celo-accounts-node
rm -rf geth* && rm static-nodes.json
```

```bash
# On your proxy machine
# Here, you will want to preserve the nodekey so that your enode address doesn't change.
cd celo-proxy-node
mv geth/nodekey nodekey
rm -rf geth* && rm static-nodes.json
mkdir geth
mv nodekey geth/nodekey
```

```bash
# On your validator machine
cd celo-validator-node
rm -rf geth*
```

```bash
# On your Attestation machine
cd celo-attestations-node
rm -rf geth* && rm static-nodes.json
```

## Restarting the components

### Pulling the latest Celo Docker image

First, pull the Celo image as described [here](running-a-validator.md#pull-the-celo-docker-image). Be sure to pull the image on your local, validator, proxy, and attestations machines.

```bash
# On all machines
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=200110
docker pull $CELO_IMAGE
```

```bash
# On your attestation machine
export CELO_IMAGE_ATTESTATION=us.gcr.io/celo-testnet/celo-monorepo:attestation-service-baklava
docker pull $CELO_IMAGE_ATTESTATION
```

### Restart your Accounts node

Follow [these instructions](running-a-validator.md#start-your-accounts-node) to restart your accounts node on your local machine.

### Restart your Proxy node

Follow [these instructions](running-a-validator.md#deploy-a-proxy) to restart your proxy node on your proxy machine.

### Restart your Validator node

In order to restart your Validator, you'll need to have the proxy info environment variables set. If not, follow [these instructions](running-a-validator.md#get-your-proxys-connection-info) to recover them.

Remember, `PROXY_EXTERNAL_IP` should be set to the external IP address of your Proxy machine.

```bash
# On your validator machine
echo $PROXY_INTERNAL_IP
echo $PROXY_EXTERNAL_IP
echo $PROXY_ENODE
```

You'll also need to make sure your Validator signer address is set:

```bash
# On your validator machine
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-CELO-VALIDATOR-SIGNER-ADDRESS>
```

Next, follow [these instructions](running-a-validator.md#connect-the-validator-to-the-proxy) to restart your validator node on your validator machine.

### Restart your Attestation node and service

Follow [these instructions](running-a-validator.md#running-the-attestation-service) to restart your Attestation node and service on your Attestation machine.

### Re-register your Validator

#### Restore any missing environment variables

When you originally set up your validator you should have exported multiple environment variables with information about your Celo accounts.

Please check you have the following environment variables exported in your system:

```bash
# On your local machine
echo -e "My Celo Key material:"
echo CELO_VALIDATOR_ADDRESS=$CELO_VALIDATOR_ADDRESS
echo CELO_VALIDATOR_GROUP_ADDRESS=$CELO_VALIDATOR_GROUP_ADDRESS
echo CELO_VALIDATOR_SIGNER_ADDRESS=$CELO_VALIDATOR_SIGNER_ADDRESS
echo CELO_VALIDATOR_SIGNER_PUBLIC_KEY=$CELO_VALIDATOR_SIGNER_PUBLIC_KEY
echo CELO_VALIDATOR_SIGNER_SIGNATURE=$CELO_VALIDATOR_SIGNER_SIGNATURE
echo CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY=$CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY
echo CELO_VALIDATOR_SIGNER_BLS_SIGNATURE=$CELO_VALIDATOR_SIGNER_BLS_SIGNATURE
echo CELO_ATTESTATION_SIGNER_ADDRESS=$CELO_ATTESTATION_SIGNER_ADDRESS
echo CELO_ATTESTATION_SIGNER_SIGNATURE=$CELO_ATTESTATION_SIGNER_SIGNATURE
```

If any of the environment variables are missing, you have two options:

1.  Find the shell where you ran the original instructions and look for the missing environment variables. Then, export them again.
2.  If you can't find that information, but you have the `CELO_VALIDATOR_ADDRESS`, `CELO_VALIDATOR_GROUP_ADDRESS` and `CELO_VALIDATOR_SIGNER_ADDRESS` variables, the other Celo variables are deterministic and generated using as input those variables. So you can refer to the point of the documentation where the missing variables were created, and create them again.

#### Run the celocli

First, make sure you have the latest version of the celocli.

```bash
# On your local machine
npm uninstall -g @celo/celocli && npm install -g @celo/celocli
```

At this point you should be able to continue the steps described in the [Running a Validator](running-a-validator.md) documentation page, starting at the [Register the Accounts](running-a-validator.md#register-the-accounts) section. Also remember to [register your Metadata](running-a-validator.md#registering-metadata) to be able to serve attestations and claim all your funds for the leaderboard.

Note that if you were fauceted in phase 1.0 of The Great Celo Stakeoff, your accounts should have been included in the genesis block for subsequent phases, so you will not need to be fauceted again.
