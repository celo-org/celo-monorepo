# How to reconnect to Baklava after a network reset?

If you were running a Validator and Proxy in `baklava` Celo network, you were running the instructions or the reference script for creating all your Validator accounts, signatures, etc.

After a network reset you could need to re-connect to the network re-using all the key material you had, without making need to re-create again all your accounts. If that's the case the following steps can be useful for you:

## Check you have all the information you need

If you followed the process described in the [Running a Validator](running-a-validator.md) documentation page, you should have exported multiple environment variables with all the information about your Celo accounts.

Please check you have the following environment variables exported in your system:

```bash
echo -e "My Celo Key material:"
echo CELO_VALIDATOR_ADDRESS=$CELO_VALIDATOR_ADDRESS
echo CELO_VALIDATOR_GROUP_ADDRESS=$CELO_VALIDATOR_GROUP_ADDRESS
echo CELO_VALIDATOR_SIGNER_ADDRESS=$CELO_VALIDATOR_SIGNER_ADDRESS
echo CELO_VALIDATOR_SIGNER_PUBLIC_KEY=$CELO_VALIDATOR_SIGNER_PUBLIC_KEY
echo CELO_VALIDATOR_SIGNER_SIGNATURE=$CELO_VALIDATOR_SIGNER_SIGNATURE
echo CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY=$CELO_VALIDATOR_SIGNER_BLS_PUBLIC_KEY
echo CELO_VALIDATOR_SIGNER_BLS_SIGNATURE=$CELO_VALIDATOR_SIGNER_BLS_SIGNATURE
```

If you don't have any of those you have 2 options:

1.  Find the shell when you run the instructions and look for the environment variable missing. You can export it again using the following command:

    ```bash
    export CELO_VALIDATOR_ADDRESS=<MY CELO VALIDATOR ADDRESS>
    ```

    Please, replace the environment variable name for the one you don't have exported in your system.

2.  If you can't find that information, but you have the `CELO_VALIDATOR_ADDRESS`, `CELO_VALIDATOR_GROUP_ADDRESS` and `CELO_VALIDATOR_SIGNER_ADDRESS` variables, the other Celo variables are deterministic and generated using as input those variables. So you can refer to the point of the documentation where were created and do it again.

## Check your keystore information is there

We want to check you didn't remove accidentaly your key material. Please check what's the folder you used for storing your keys and data dir. If you run the reference script it should be `/tmp/celo/network/` or `~/.celo/network/`. Run the following command replacing `DATA_DIR` for the folder path you used:

```bash
sudo find DATA_DIR -name "*$CELO_VALIDATOR_ADDRESS*"
```

If you find a file means your key material is there. If not it could mean your accounts information is somewhere else or you removed accidentaly. Please remember to store your key material in a secure folder and make backups.

Please, repite the previous step with the `CELO_VALIDATOR_GROUP_ADDRESS` and `CELO_VALIDATOR_SIGNER_ADDRESS` addresses:

```bash
sudo find DATA_DIR -name "*$CELO_VALIDATOR_GROUP_ADDRESS*"
sudo find DATA_DIR -name "*$CELO_VALIDATOR_SIGNER_ADDRESS*"
```

## Remove your geth data data dir

Because we are re-connecting to a new fresh copy of blockchain, it's necessary to remove the previous data dir before syncing to the network. Please, using take the `DATA_DIR` you are using as we described in the previous section and run the following command replacing the dir:

```bash
# This command will delete your local copy of Celo blockchain
sudo find /tmp/celo/network/ -type d -name "geth"|xargs sudo rm -rf
```

## Restarting the components

### Pulling the Celo Image

Please, pull the Celo image as described at the (Pull the Celo Docker image)[running-a-validator.md#pull-image] section.

### Starting your Accounts node

Now you can go to your accounts folder:

```bash
cd celo-accounts-node
```

And follow again the steps to [start your Celo accounts](running-a-validator.md#starting-celo-accounts) node.

### Deploy your Proxy node

Please, go to the node and Celo Proxy folder:

```bash
cd celo-proxy-node
```

And follow again the steps to [deploy your Celo Proxy](running-a-validator.md#starting-celo-proxy) node.

### Deploy your Validator node

In order to connect your Validator with the Proxy, you should have the `PROXY_ENODE` and `PROXY_IP` information in environment variables. If not, having the Proxy up and running, you can get that information as described in the [getting Proxy information](running-a-validator.md#getting-proxy-info) section.

Please, go to the node and folder where your `celo-validator-node` folder is and follow the steps to [start your Validator](running-a-validator.md#deploy-validator) again.

At this point you should be able to continue the steps described in the [Running a Validator](running-a-validator.md) documentation page, starting at [Register the Accounts](running-a-validator.md#register-accounts) section.
