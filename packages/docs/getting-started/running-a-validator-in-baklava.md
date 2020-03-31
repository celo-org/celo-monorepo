# Running a Validator in Baklava

The Baklava Testnet is a non-production Testnet for the validator community. It serves several purposes:

- **Operational excellence**: It helps you get familiarized with the processes that will be used to create RC1, and verify the security and stability of your infrastructure with the new software.
- **Detecting vulnerabilities**: It helps the Celo community discover any remaining bugs before RC1.
- **Future testnet**: If all goes well, it will continue to function as a testnet, serving as a testing ground for changes after mainnet is launched.

While the Baklava Testnet was previously used for The Great Celo Stake Off, the Testnet is now available for any potential validators to experiment with.

## Network Deployment

The setup of the Baklava network will differ from previous Stake Off deployments in two main ways:

- **No cLabs validators at genesis.** The new Baklava Testnet will be stood up entirely by community validators.
- **Block production will not start right away.** Validators are encouraged to get set up and configure monitoring and other tooling straight away. Block production will start automatically at a time encoded in the genesis block.

The deployment timeline is as follows (all dates are subject to change):

* 3/31: Docker image with genesis block distributed
* 3/31 - 4/6: Infrastructure setup
* 4/6 16:00 UTC: Block production begins
* 4/6: Celo Core Contracts and `ReleaseGold` contracts are deployed
* 4/7: Governance proposal to start validator rewards
* 4/8: Governance proposal to unfreeze Celo Gold voter rewards
* 4/9: Mock Oracles deployed and governance proposal to unfreeze Celo Dollar exchange
* 4/10: Faucet requests for non-genesis validators accepted

{% hint style="info" %}
A [timeline](https://celo.org/#timeline) of the Celo project is available to provide further context.
{% endhint %}

## Setup for Genesis Validators (Before 4/6)

**If you provided your validator signer address and BLS public key for genesis, the community is relying on your validator to get the network started!**

This section outlines the steps needed to configure your proxy and validator nodes before block production begins.

Please follow these steps if you ranked on The Great Celo Stake Off leaderboard and have provided details of your validator signer and BLS addresses as explained in this [FAQ](https://forum.celo.org/t/faq-for-stake-off-validators-on-release-candidate-and-new-baklava-networks/372/2).

If this doesn't apply to you, but you are interested in trying out the Baklava testnet, please check back later for additional instructions on how to get testnet units of Celo Gold set up your validator.

### Environment Variables

First we are going to setup the main environment variables related with the new Baklava network. Run these on both your **validator** and **proxy** machines:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=33120
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

Please use the validator signer address that you submitted through your Gist file. It is included in the genesis validator set.

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the Docker image to use. Now we can get the Docker image on your validator and proxy machines:

```bash
docker pull $CELO_IMAGE
```

The `us.gcr.io/celo-testnet/celo-node:baklava` image is built from commit [`c82411259ac7a0b44a4705b7c5f6289f6e8292b2`](https://github.com/celo-org/celo-blockchain/commit/c82411259ac7a0b44a4705b7c5f6289f6e8292b2) and contains the [genesis block](https://storage.cloud.google.com/genesis_blocks/baklava) and [bootnode information](https://storage.cloud.google.com/env_bootnodes/baklava) in addition to the Celo Geth binary.

### Networking requirements

To avoid exposing the validator to the public internet, we first deploy a proxy node which is responsible for communicating with the network. On our proxy machine, we'll set up the node and get the bootnode enode URLs to use for discovering other nodes.

In order for your Validator to participate in consensus and complete attestations, it is critically important to configure your network correctly. Your Proxy nodes must have static, external IP addresses, and your Validator node must be able to communicate with your proxy, preferably via an internal network, or otherwise via the Proxy's external IP address.

On the Proxy machine, port 30303 should accept TCP and UDP connections from all IP addresses. This port is used to communicate with other nodes in the network.

On the Proxy machine, port 30503 should accept TCP connections from the IP address of your Validator machine. This port is used by the Proxy to communicate with the Validator.

### Deploy a proxy

```bash
# On the proxy machine
mkdir celo-proxy-node
cd celo-proxy-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES="$(docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes)"
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to appear on Celostats.

```bash
# On the proxy machine
docker run --name celo-proxy -it --restart always -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --nousb --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>-proxy@baklava-ethstats.celo-testnet.org
```

{% hint style="info" %}
You can detach from the running container by pressing `ctrl+p ctrl+q`, or start it with `-d` instead of `-it` to start detached. Access the logs for a container in the background with the `docker logs` command.
{% endhint %}

### Get your Proxy's connection info

Once the proxy is running, we will need to retrieve its enode and IP address so that the validator will be able to connect to it.

```bash
# On the proxy machine, retrieve the proxy enode
docker exec celo-proxy geth --exec "admin.nodeInfo['enode'].split('//')[1].split('@')[0]" attach | tr -d '"'
```

Now we need to set the proxy enode and proxy IP address in environment variables on the validator machine.

If you don't have an internal IP address over which the Validator and Proxy can communicate, feel free to set the internal IP address to the external IP address.

If you don't know your proxy's external IP address, you can get it by running the following command:

```bash
# On the proxy machine
dig +short myip.opendns.com @resolver1.opendns.com
```

Then, export the variables on your validator machine.

```bash
# On the validator machine
export PROXY_ENODE=<YOUR-PROXY-ENODE>
export PROXY_EXTERNAL_IP=<PROXY-MACHINE-EXTERNAL-IP-ADDRESS>
export PROXY_INTERNAL_IP=<PROXY-MACHINE-INTERNAL-IP-ADDRESS>
```

### Connect the Validator to the Proxy

When starting up your validator, it will attempt to create a network connection between the validator machine and the proxy machine. You will need make sure that your proxy machine has the appropriate firewall settings to allow the validator to connect to it.

Specifically, on the proxy machine, port 30303 should allow TCP and UDP connections from all IP addresses. And port 30503 should allow TCP connections from the IP address of your validator machine.

Test that your network is configured correctly by running the following commands:

```bash
# On your local machine, test that your Proxy is accepting TCP connections over port 30303.
# Note that it will also need to be accepting UDP connections over this port.
nc -vz $PROXY_EXTERNAL_IP 30303
```

```bash
# On your Validator machine, test that your Proxy is accepting TCP connections over port 30503.
nc -vz $PROXY_INTERNAL_IP 30503
```

Once that is completed, go ahead and run the validator. Be write your validator signer password to `./.password` for the following command to work, or provide your password another way.

```bash
# On the validator machine
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
docker run --name celo-validator -it --restart always -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --nousb --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303  --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=<YOUR-VALIDATOR-NAME>@baklava-ethstats.celo-testnet.org
```

The `networkid` parameter value of `33120` indicates we are connecting to the new Baklava network.

At this point your proxy should be peering with other nodes as the come online. Your validator will not automatically peer with the proxy until the mining routine starts after the genesis timestamp on, so it will not have any peers. You should see a `Mining too far in the future` log message from the validator, which indicates it is waiting for the genesis timestamp to pass. On April 6th at 1600 UTC, the validator engine will start up, and after a couple of minutes to establish the validator overlay network, block production will begin.

## After Block Production Begins

Once block production starts, core contracts and  `ReleaseGold` contracts will be deployed, and the community will vote on a series of Governance Proposals in a process which will be a preview of the deployment process for the Celo Mainnet.

`ReleaseGold` contracts will be used to provide the required testnet units of Celo Gold required to register a validator and vote. `ReleaseGold` is the same mechanism that will be used to distribute Celo Gold to Stake Off participants, so it will be used in Baklava to give you a chance to get familiar with the process.

We will provide more complete instructions later this week.

## Deployment Tips

### Running the Docker containers in the background

There are different options for executing Docker containers in the background. The most typical one is to use in your docker run commands the `-d` option. Also for long running processes, especially when you run in a remote computer, you can use a tool like [screen](https://ss64.com/osx/screen.html). It allows to connect and disconnect from running processes providing an easy way to manage long running processes.

It's out of the scope of this documentation to go through the `screen` options, but you can use the following command format with your `docker` commands:

```bash
screen -S <SESSION NAME> -d -m <YOUR COMMAND>
```

For example:

```bash
screen -S celo-validator -d -m docker run --name celo-validator -it --restart always -p 127.0.0.1:8545:8545 .......
```

You can list your existing `screen` sessions:

```bash
screen -ls
```

And re-attach to any of the existing sessions:

```bash
screen -r -S celo-validator
```

### Stopping containers

You can stop the Docker containers at any time without problem. If you stop your containers that means those containers stop providing service.
The data directory of the validator and the proxy are Docker volumes mounted in the containers from the `celo-*-dir` you created at the very beginning. So if you don't remove that folder, you can stop or restart the containers without losing any data.

It is recommended to use the Docker stop timeout parameter `-t` when stopping the containers. This allows time, in this case 60 seconds, for the Celo nodes to flush recent chain data it keeps in memory into the data directories. Omitting this may cause your blockchain data to corrupt, requiring the node to start syncing from scratch.

You can stop the `celo-validator` and `celo-proxy` containers running:

```bash
docker stop celo-validator celo-proxy -t 60
```

And you can remove the containers (not the data directory) by running:

```bash
docker rm -f celo-validator celo-proxy
```
