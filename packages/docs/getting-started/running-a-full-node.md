# Running a Full Node

This section explains how to get a full node running on the [Alfajores Testnet](alfajores-testnet.md), using a Docker image that was built for this purpose.

Full nodes play a special purpose in the Celo ecosystem, acting as a bridge between the mobile wallets \(running as light clients\) and the validator nodes. To make sure that full nodes are rewarded for this service, the Celo protocol includes full node incentives. Every time a light client sends a new transaction, a portion of the transaction fees will go to the full node that gossips the transaction to other full nodes and validators.

For this reason, despite the fact that Celo uses a proof-of-stake protocol, users can earn cryptocurrency without first having to own any, simply by running a full node.

## **Prerequisites**

- **You have Docker installed.** If you don’t have it already, follow the instructions here: [Get Started with Docker](https://www.docker.com/get-started). It will involve creating or signing in with a Docker account, downloading a desktop app, and then launching the app to be able to use the Docker CLI. If you are running on a Linux server, follow the instructions for your distro [here](https://docs.docker.com/install/#server). You may be required to run Docker with sudo depending on your installation environment.

## **Step-by-Step Guide**

{% hint style="info" %}
A note about conventions:  
The code you'll see on this page is bash commands and their output.

A $ signifies the bash prompt. Everything following it is the command you should run in a terminal. The $ isn't part of the command, so don't copy it.

When you see text in angle brackets &lt;&gt;, replace them and the text inside with your own value of what it refers to. Don't include the &lt;&gt; in the command.
{% endhint %}

### Account Creation + Setup

**Step 1: Set up a local directory and switch into it**  
The purpose of this is to store any of the data and files needed to run your node. This directory can be named anything you'd like, but here's a default you can use. The commands below create a directory and then navigate into it. The rest of the steps assume you are running the commands from inside this directory.

```
$ mkdir celo-data-dir
$ cd celo-data-dir
```

**Step 2:** **Create an account and get its address**  
In this step, you'll create an account on the network. If you've already done this and have an account address, you can skip this and move on to step 3.

Run the command to create a new account. You'll then be prompted to enter and confirm a password for this account

`` $ docker run -v `pwd`:/root/.celo -it us.gcr.io/celo-testnet/celo-node:alfajores account new ``

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

**Step 3: Save your account address to an environment variable**  
This makes it easier to refer to the address later.

`$ export CELO_ACCOUNT_ADDRESS=<YOUR-ACCOUNT-ADDRESS>`

_Note: this environment variable will only persist while you have this terminal window open. If you want this environment variable to be available in the future, you can add it to your ~/.bash_profile_

### Deploy the full node

**Step 4: Initialize Celo with the genesis block**  
The genesis block is the first block in the chain, and is specific to each network. This command gets the genesis.json file for alfajores and initializes your node with it.

`` $ docker run -v `pwd`:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores init /celo/genesis.json ``

**Step 5: Specify the bootnodes**  
A bootnode's purpose is to help nodes find other nodes in the network. This command gives your node the information it needs to find the bootnodes.

`` $ docker run -v `pwd`:/root/.celo --entrypoint cp us.gcr.io/celo-testnet/celo-node:alfajores /celo/static-nodes.json /root/.celo/ ``

**Step 6: Start the full node**  
This command specifies the settings needed to run the node, and gets it started.

`` $ docker run -p 127.0.0.1:8545:8545 -p 127.0.0.1:8546:8546 -p 30303:30303 -p 30303:30303/udp -v `pwd`:/root/.celo us.gcr.io/celo-testnet/celo-node:alfajores --verbosity 3 --networkid 44781 --syncmode full --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --lightserv 90 --lightpeers 1000 --maxpeers 1100 --etherbase $CELO_ACCOUNT_ADDRESS ``

You'll start seeing some output. There may be some errors or warnings that are ignorable. After a few minutes, you should see lines that look like this. This means your node has synced with the network and is receiving blocks.

```text
INFO [07-16|14:04:24.924] Imported new chain segment               blocks=139  txs=319 mgas=61.987 elapsed=8.085s mgasps=7.666 number=406  hash=9acf16…4fddc8 age=6h58m44s cache=1.51mB
INFO [07-16|14:04:32.928] Imported new chain segment               blocks=303  txs=179 mgas=21.837 elapsed=8.004s mgasps=2.728 number=709  hash=8de06a…77bb92 age=6h33m37s cache=1.77mB
INFO [07-16|14:04:40.918] Imported new chain segment               blocks=411  txs=0   mgas=0.000  elapsed=8.023s mgasps=0.000 number=1120 hash=3db22a…9fa95a age=5h59m30s cache=1.92mB
INFO [07-16|14:04:48.941] Imported new chain segment               blocks=335  txs=0   mgas=0.000  elapsed=8.023s mgasps=0.000 number=1455 hash=7eb3f8…32ebf0 age=5h31m43s cache=2.09mB
INFO [07-16|14:04:56.944] Imported new chain segment               blocks=472  txs=0   mgas=0.000  elapsed=8.003s mgasps=0.000 number=1927 hash=4f1010…1414c1 age=4h52m31s cache=2.34mB
```

You will have fully synced with the network once you have pulled the latest block number, which you can lookup by visiting at the [Alfajores Testnet Stats](https://alfajores-ethstats.celo-testnet.org/) page.

{% hint style="danger" %}
**Security**: The command line above includes the parameter `--rpcaddr 0.0.0.0` which makes the Celo Blockchain software listen for incoming RPC requests on all network adaptors. Exercise extreme caution in doing this when running outside Docker, as it means that any unlocked accounts and their funds may be accessed from other machines on the Internet. In the context of running a Docker container on your local machine, this together with the `docker -p` flags allows you to make RPC calls from outside the container, i.e from your local host, but not from outside your machine. Read more about [Docker Networking](https://docs.docker.com/network/network-tutorial-standalone/#use-user-defined-bridge-networks) here.
{% endhint %}

Light clients may connect to you as people run the [Celo Mobile Wallet](using-the-mobile-wallet.md) and you will start earning transaction fees for any transactions that these users initiate. The account that this node advertises for light clients to use for these fees is given by the `etherbase` parameter. The `lightserv` parameter defines the percentage of time this node should spend serving light clients. Valid values are 0-100. If this node is having trouble catching up to the current block, dropping this to a lower percentage may help. The `lightpeers` and `maxpeers` parameters set limits on the number of light clients and full node peers that the node will accept.
