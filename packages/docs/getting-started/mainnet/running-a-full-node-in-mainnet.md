# Running a Full Node

This section explains how to get a full node running on the [Mainnet Network](./), using a Docker image that was built for this purpose.

If you'd prefer a simple, one click hosted setup for running a node on one of the major cloud providers \(AWS and GCP\), checkout our [hosted nodes](../hosted-nodes.md) documentation.

{% hint style="info" %}
If you would like to keep up-to-date with all the news happening in the Celo community, including validation, node operation and governance, please sign up to our [Celo Signal mailing list here](https://celo.activehosted.com/f/15).

You can add the [Celo Signal public calendar](https://calendar.google.com/calendar/u/0/embed?src=c_9su6ich1uhmetr4ob3sij6kaqs@group.calendar.google.com) as well which has relevant dates.
{% endhint %}

Full nodes play a special purpose in the Celo ecosystem, acting as a bridge between the mobile wallets \(running as light clients\) and the validator nodes. To make sure that full nodes are rewarded for this service, the Celo protocol includes [full node incentives](../../celo-codebase/protocol/transactions/full-node-incentives.md).

When a light client sends transactions, they may include a gateway fee to be paid to the node that gossips transactions to the other full nodes and validators.

For this reason, despite the fact that Celo uses a proof-of-stake protocol, users can earn cryptocurrency without first having to own any, simply by running a full node.

{% hint style="warning" %}
Full node incentives have not been enabled yet because the mechanism for negotiating a gateway fee is still under development. Currently, light clients are configured to send a gateway fee of 0 and full nodes are set to accept a minimum gateway fee of 0.
{% endhint %}

## Prerequisites

* **You have Docker installed.** If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with `sudo` depending on your installation environment.

{% hint style="info" %}
Code you'll see on this page is bash commands and their output.

When you see text in angle brackets &lt;&gt;, replace them and the text inside with your own value of what it refers to. Don't include the &lt;&gt; in the command.
{% endhint %}

## Celo Networks

First we are going to setup the environment variables required for the `mainnet` network. Run:

```bash
export CELO_IMAGE=us.gcr.io/celo-org/geth:mainnet
```

## Pull the Celo Docker image

We're going to use a Docker image containing the Celo node software in this tutorial.

If you are re-running these instructions, the Celo Docker image may have been updated, and it's important to get the latest version.

```bash
docker pull $CELO_IMAGE
```

## Set up a data directory

First, create the directory that will store your node's configuration and its copy of the blockchain. This directory can be named anything you'd like, but here's a default you can use. The commands below create a directory and then navigate into it. The rest of the steps assume you are running the commands from inside this directory.

```bash
mkdir celo-data-dir
cd celo-data-dir
```

## Create an account and get its address

In this step, you'll create an account on the network. If you've already done this and have an account address, you can skip this and move on to configuring your node.

Run the command to create a new account:

```bash
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
```

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Public address of the key: <YOUR-ACCOUNT-ADDRESS>`

Save this address to an environment variables, so that you can reference it below \(don't include the braces\):

```bash
export CELO_ACCOUNT_ADDRESS=<YOUR-ACCOUNT-ADDRESS>
```

{% hint style="info" %}
This environment variable will only persist while you have this terminal window open. If you want this environment variable to be available in the future, you can add it to your `~/.bash_profile`
{% endhint %}

## Start the node

This command specifies the settings needed to run the node, and gets it started.

```bash
docker run --name celo-fullnode -d --restart unless-stopped --stop-timeout 300 -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --light.serve 90 --light.maxpeers 1000 --maxpeers 1100 --etherbase $CELO_ACCOUNT_ADDRESS --datadir /root/.celo --nousb
```

You'll start seeing some output. After a few minutes, you should see lines that look like this. This means your node has started syncing with the network and is receiving blocks.

```text
INFO [07-16|14:04:24.924] Imported new chain segment               blocks=139  txs=319 mgas=61.987 elapsed=8.085s mgasps=7.666 number=406  hash=9acf16…4fddc8 age=6h58m44s cache=1.51mB
INFO [07-16|14:04:32.928] Imported new chain segment               blocks=303  txs=179 mgas=21.837 elapsed=8.004s mgasps=2.728 number=709  hash=8de06a…77bb92 age=6h33m37s cache=1.77mB
INFO [07-16|14:04:40.918] Imported new chain segment               blocks=411  txs=0   mgas=0.000  elapsed=8.023s mgasps=0.000 number=1120 hash=3db22a…9fa95a age=5h59m30s cache=1.92mB
INFO [07-16|14:04:48.941] Imported new chain segment               blocks=335  txs=0   mgas=0.000  elapsed=8.023s mgasps=0.000 number=1455 hash=7eb3f8…32ebf0 age=5h31m43s cache=2.09mB
INFO [07-16|14:04:56.944] Imported new chain segment               blocks=472  txs=0   mgas=0.000  elapsed=8.003s mgasps=0.000 number=1927 hash=4f1010…1414c1 age=4h52m31s cache=2.34mB
```

You will have fully synced with the network once you have pulled the latest block number, which you can lookup by visiting the [Network Stats](https://stats.celo.org) or [Block Explorer](https://explorer.celo.org/) pages.

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

## Command Line Interface

Once the full node is running, it can serve the [Command Line Interface](../../command-line-interface/introduction.md) tool `celocli`. For example:

```bash
$ npm install -g @celo/celocli
...
$ celocli node:synced
true
$ celocli account:new
...
```

## Light Client Serving

Light clients may connect to you as people run the [Celo Mobile Wallet](../alfajores-testnet/using-the-mobile-wallet.md) and you will start earning gateway fees for any transactions that these users initiate, which you can read more about in the [Full Node Incentives](../../celo-codebase/protocol/transactions/full-node-incentives.md) document. The account that this node advertises for light clients to use for these fees is given by the `etherbase` parameter. The `light.serve` parameter defines the percentage of time this node should spend serving light clients. Valid values are 0-100. If this node is having trouble catching up to the current block, dropping this to a lower percentage may help. The `light.maxpeers` and `maxpeers` parameters set limits on the number of light clients and full node peers that the node will accept.

