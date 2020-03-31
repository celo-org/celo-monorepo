# Running a Validator in the New Baklava Testnet

The new Baklava Testnet is the final testnet before Mainnet Release Candidate 1 (RC1). Its genesis block is only composed of community validators. The new Baklava serves 3 main purposes:

- **Operational excellence**: it helps you get familiarized with the processes that will be used to create RC1, and verify the security and stability of your infrastructure with the new software.
- **Detecting vulnerabilities**: it helps the Celo community discover any remaining bugs before RC1
- **Future testnet**: if all goes well, it will continue to function as a testnet, serving as a testing ground for changes after mainnet is launched

## Key Differences vs. Baklava Testnet

- **No cLabs validators at genesis.** The new Baklava Testnet will be stood up entirely by non-cLabs validators.
- **Block production will not start right away.** However, validators may start their node now and peer with other nodes. Block production will start automatically at a time encoded in the genesis block (April 6, 16:00 UTC).

## Timeline

The following [timeline](https://celo.org/#timeline) illustrates where we are in Celo Validators’ Journey.

* Alfajores Testnet Release
* Baklava Testnet -- The Great Celo Stake Off
* New Baklava Testnet
    - [3/31] image released
    - [3/31 - 4/6] infrastructure setup
    - [4/6 16:00 UTC] genesis block; mining begins
* Mainnet Release Candidate 1
* Validator Elections Start
* Celo Gold Voter Rewards Activate
* Celo Gold Live
* Celo Dollars Live

## Initial Setup

The new Baklava network has a two-part rollout process. This section outlines the steps needed before block production begins.

Of the four nodes you ran in The Great Celo Stakeoff (validator signer, validator proxy, account node, and attestation node), only the **validator signer** and **validator proxy** are required to initialize the new Baklava network.

### Environment Variables

First we are going to setup the main environment variables related with the new Baklava network. Run these on both your **validator** and **proxy** machines:

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:baklava
export NETWORK_ID=200110
export CELO_VALIDATOR_SIGNER_ADDRESS=<YOUR-VALIDATOR-SIGNER-ADDRESS>
```

Please use the validator signer address that you submitted through your gist file.

### Pull the Celo Docker image

In all the commands we are going to see the `CELO_IMAGE` variable to refer to the right Docker image to use. Now we can get the Docker image on your validator and proxy machines:

```bash
docker pull $CELO_IMAGE
```

### Deploy a proxy

To avoid exposing the validator to the public internet, we are deploying a proxy node which is responsible to communicate with the network. On our Proxy machine, we'll set up the node and get the bootnode enode URLs to use for discovering other nodes.

```bash
# On the proxy machine
# Note that you have to export $CELO_IMAGE on this machine
mkdir celo-proxy-node
cd celo-proxy-node
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
export BOOTNODE_ENODES=`docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes`
```

You can then run the proxy with the following command. Be sure to replace `<YOUR-VALIDATOR-NAME>` with the name you'd like to use for your Validator account. Your proxy should start syncing after a few seconds.

```bash
# On the proxy machine
docker run --name celo-proxy -it --restart always -p 30303:30303 -p 30303:30303/udp -p 30503:30503 -p 30503:30503/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --proxy.proxy --proxy.proxiedvalidatoraddress $CELO_VALIDATOR_SIGNER_ADDRESS --proxy.internalendpoint :30503 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --bootnodes $BOOTNODE_ENODES --ethstats=<YOUR-VALIDATOR-NAME>-proxy@baklava-ethstats.celo-testnet.org
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

If you don't know your Proxy's external IP address, you can get it by running the following command:

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
telnet $PROXY_EXTERNAL_IP 30303
```

```bash
# On your Validator machine, test that your Proxy is accepting TCP connections over port 30503.
telnet $PROXY_INTERNAL_IP 30503
```

Once that is completed, go ahead and run the validator. Be sure to replace `<VALIDATOR-SIGNER-PASSWORD>` with the password for your Validator signer. You should see the validator begin syncing via the Proxy within a few seconds.

```bash
# On the validator machine
echo <VALIDATOR-SIGNER-PASSWORD> > .password
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE init /celo/genesis.json
docker run --name celo-validator -it --restart always -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode full --mine --istanbul.blockperiod=5 --istanbul.requesttimeout=3000 --etherbase $CELO_VALIDATOR_SIGNER_ADDRESS --nodiscover --proxy.proxied --proxy.proxyenodeurlpair=enode://$PROXY_ENODE@$PROXY_INTERNAL_IP:30503\;enode://$PROXY_ENODE@$PROXY_EXTERNAL_IP:30303  --unlock=$CELO_VALIDATOR_SIGNER_ADDRESS --password /root/.celo/.password --ethstats=<YOUR-VALIDATOR-NAME>@baklava-ethstats.celo-testnet.org
```

The `mine` flag does not mean the node starts mining blocks, but rather starts trying to participate in the BFT consensus protocol. It cannot do this until it gets elected -- so next we need to stand for election.

The `networkid` parameter value of `200110` indicates we are connecting to the Baklava network, Stake Off Phase 1.

Note that if you are running the validator and the proxy on the same machine, then you should set the validator's listening port to something other than `30303`. E.g. you could use the flag `--port 30313` and set the docker port forwarding rules accordingly (e.g. use the flags `-p 30313:30313` and `-p 30313:30313/udp`).

## After Block Production Begins

cLabs will update this section closer to April 6. Once the block production starts, core contracts and the ReleaseGold contract will be deployed so you will be able to experience this process before Mainnet.

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
The data dir of the validator and the proxy are Docker volumes mounted in the containers from the `celo-*-dir` you created at the very beginning. So if you don't remove that folder, you can stop or restart the containers without losing any data.

It is recommended to use the Docker stop timeout parameter `-t` when stopping the containers. This allows time, in this case 60 seconds, for the Celo nodes to flush recent chain data it keeps in memory into the data directories. Omitting this may cause your blockchain data to corrupt, requiring the node to start syncing from scratch.

You can stop the `celo-validator` and `celo-proxy` containers running:

```bash
docker stop celo-validator celo-proxy -t 60
```

And you can remove the containers (not the data dir) running:

```bash
docker rm -f celo-validator celo-proxy
```

## Stop Validating

If for some reason you need to stop running your Validator, and it is currently elected, you first need to stop it getting re-elected at the end of the current epoch. After that you can stop the validator, proxy and Attestation Service processes, containers or machines.

{% hint style="danger" %}
**Validated Uptime and Network Stability**: If you stop your validator while it is still elected, you will receive fewer rewards on account of downtime, may be slashed, and also potentially affect the stability and performance of the network.
{% endhint %}

Please remove your validator from its group so that at the end of the current epoch it will not be re-elected:

```bash
celocli validatorgroup:member --from $CELO_VALIDATOR_GROUP_ADDRESS --remove $CELO_VALIDATOR_ADDRESS
```
