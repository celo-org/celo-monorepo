# Hello Contracts: writing and deploying Celo contracts

This guide walks you through the basics of how to deploy your own smart contracts on Celo networks. As Celo is fully EVM compliant, we inherit the rich developer ecosystem and tooling of the Ethereum community. We will be deploying a typical hello world smart contract onto the Alfajores testnet with typical Ethereum tools like Truffle and Ganache.

## Setup

This guide assumes that you have a basic Node/[NPM](https://www.npmjs.com/get-npm) setup. If so, you can install truffle with:

```
npm install -g truffle
```

In your desired project folder, intiialize a new truffle project:

```
truffle init
```

## Hello World!

Let's add a contract with

```
truffle create contract HelloWorld
```

Our contract will just store a name for now:

```solidity
pragma solidity >=0.5.0 <0.7.0;

contract HelloWorld {
  string name = 'Celo';

  function getName() public view returns (string memory) {
    return name;
  }

  function setName(string calldata newName) external {
    name = newName;
  }
}
```

## Deploy locally

Let's create a migration to deploy the contract. For that, we need to create a file in the `migrations` folder named `2_deploy_helloworld.js`:

```javascript
var HelloWorld = artifacts.require('HelloWorld')

module.exports = function(deployer) {
  deployer.deploy(HelloWorld)
}
```

To be able to actually deploy it though, we need a blockchain. For local development and testing, you can use our fork of ganache:

```
npm install -g @celo/ganache-cli
```

And then start ganache with:

```
ganache-cli --port 7545
```

In your `truffle-config.js`, you'll want to add your local test network under networks:

```
  networks: {
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    }
  }
```

Then you can deploy your contract to your local network first:

```
truffle migrate --network test
```

You can interact with your contract by running the truffle console:

```
truffle console --network test
truffle(test)> contract = await HelloWorld.deployed()
undefined
truffle(test)> contract.getName()
'Celo'
truffle(test)> contract.setName('MyName')
{ tx:
...
truffle(test)> contract.getName()
'MyName'
```

## Deploy to Alfajores

When you are ready to deploy your contract to Alfajores, you'll need a Celo client connected to the testnet. We'll run a node somewhat similarly to the [Instructions of running a full node on Baklava](/getting-started/baklava-testnet/running-a-full-node):

```bash
export CELO_IMAGE=us.gcr.io/celo-testnet/celo-node:alfajores
export NETWORK_ID=44785
```

### Pull the Celo Docker image

We're going to use a Docker image containing the Celo node software in this tutorial.

If you are re-running these instructions, the Celo Docker image may have been updated, and it's important to get the latest version.

```bash
docker pull $CELO_IMAGE
```

### Set up a data directory

First, create the directory that will store your node's configuration and its copy of the blockchain. This directory can be named anything you'd like, but here's a default you can use. The commands below create a directory and then navigate into it. The rest of the steps assume you are running the commands from inside this directory.

```bash
mkdir celo-data-dir
cd celo-data-dir
```

### Create an account and get its address

In this step, you'll create an account on the network. If you've already done this and have an account address, you can skip this and move on to configuring your node.

Run the command to create a new account:

```bash
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account new
```

It will prompt you for a passphrase, ask you to confirm it, and then will output your account address: `Address: {<YOUR-ACCOUNT-ADDRESS>}`

Save this address to an environment variables, so that you can reference it below (don't include the braces):

```bash
export CELO_ACCOUNT_ADDRESS=<YOUR-ACCOUNT-ADDRESS>
```

_Note: this environment variable will only persist while you have this terminal window open. If you want this environment variable to be available in the future, you can add it to your `~/.bash_profile_

### Configure the node

The genesis block is the first block in the chain, and is specific to each network. This command gets the `genesis.json` file for baklava and uses it to initialize your nodes' data directory.

```bash
docker run -v $PWD:/root/.celo --rm $CELO_IMAGE init /celo/genesis.json
```

In order to allow the node to sync with the network, get the enode URLs of the bootnodes:

```bash
export BOOTNODE_ENODES=`docker run --rm --entrypoint cat $CELO_IMAGE /celo/bootnodes`
```

### Start the node

This command specifies the settings needed to run the node, and gets it started.

```bash
docker run --name celo-ultralight-node -d --restart always -p 127.0.0.1:8545:8545 -v $PWD:/root/.celo $CELO_IMAGE --verbosity 3 --networkid $NETWORK_ID --syncmode ultralight --rpc --rpcaddr 0.0.0.0 --rpcapi eth,net,web3,debug,admin,personal --etherbase $CELO_ACCOUNT_ADDRESS --bootnodes $BOOTNODE_ENODES
```

You can follow the logs with

```bash
docker logs -f celo-ultralight-node
```

After a few seconds of syncing (with [Celo's ultralight sync](celo-codebase/protocol/consensus/ultralight-sync)), you should be able to query the balance of your account:

```bash
docker exec celo-ultralight-node geth attach --exec 'eth.getBalance("<YOUR-ACCOUNT-ADDRESS>")'
```

If you go to our [Alfajores Faucet Page](https://celo.org/build/faucet), you should be able to faucet your account some Celo Gold and see your balance increase with the above command.

### Deploy the contract

We are finally ready to deploy the contract. First let's unlock the account:

```bash
docker exec celo-ultralight-node geth attach --exec 'personal.unlockAccount("<YOUR-ACCOUNT-ADDRESS>", "<YOUR-ACCOUNT-PASSWORD>")'
```

In your `truffle-config.js` reference your node:

```
alfajores: {
  host: "127.0.0.1",
  port: 8545,
  network_id: 44785
}
```

Then you should be able to deploy your contract with:

```
truffle migrate --network alfajores
```

You can verify your contract deployment on [Blockscout](https://alfajores-blockscout.celo-testnet.org/), as well as interact with your new contract with the `truffle console --network alfajores`. Congratulations!

As you can see, all the goodies from Ethereum apply to Celo, so virtually all tutorials and other content should be easily translatable to Celo. Check out [https://celo.org/build](https://celo.org/build) for more resources!
