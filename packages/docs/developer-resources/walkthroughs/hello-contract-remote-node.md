---
description: >-
  This page is similar to the Hello Contracts page, but this one
  will connect to a remote node (Forno) and do key management in the Truffle project.
---

# Hello Contract \(Truffle + Remote Node\)

This guide walks you through the basics of how to deploy your own smart contracts on Celo networks. As Celo is fully EVM compatible, we inherit the rich developer ecosystem and tooling of the Ethereum community. We will be deploying a typical hello world smart contract onto the Alfajores testnet with typical Ethereum tools like Truffle and Ganache.

## Setup

This guide assumes that you have a basic Node/[NPM](https://www.npmjs.com/get-npm) setup. If so, you can install truffle with:

```text
$ npm install -g truffle
```

{% hint style="info" %}
[Learn more about the Truffle development framework here.](https://www.trufflesuite.com/docs/truffle/overview) 
{% endhint %}

As you may know, Truffle is built for Ethereum developers. Because Celo has a similar network architecture and runs the Ethereum Virtual Machine, Celo developers are able to leverage many Ethereum developer tools. But it is important to keep in mind the differences. If you haven't already, please review the Celo overview.

{% page-ref page="../../overview.md" %}

[Clone this Truffle project from GitHub to get started](https://github.com/critesjosh/hello_contract-truffle). This is a basic truffle project, with some additional files to help us with account management and deploying to a remote Celo test net node. Run `$ npm install` to install of the project dependencies.

## Hello World!

Let's add a contract with

```text
$ truffle create contract HelloWorld
```

We will not be getting into the details of how to write Solidity in this exercise, but you can learn more at the [Solidity documentation page](https://solidity.readthedocs.io/en/latest/).

Our contract will just store a name for now:

```text
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

## Prepare Deployment

Let's create a migration to deploy the contract. For that, we need to create a file in the `./migrations/` folder named `2_deploy_helloworld.js`:

{% hint style="info" %}
[Learn more about Truffle migrations here.](https://www.trufflesuite.com/docs/truffle/getting-started/running-migrations)
{% endhint %}

```javascript
var HelloWorld = artifacts.require('HelloWorld')

module.exports = function(deployer) {
  deployer.deploy(HelloWorld)
}
```

{% hint style="info" %}
You can [learn more about Truffle configuration options here.](https://www.trufflesuite.com/docs/truffle/reference/configuration)
{% endhint %}


## Deploy to Alfajores \(Remotely\)

When we deploy contracts to the Celo network with a remote node, we have to sign the contract deployment transaction locally before sending it to the remote node to be broadcast to the network. This presents some unique challenges when using Ethereum development tools \(like Truffle\) because Celo transaction objects are slightly different than Ethereum transaction objects.

When you are ready to deploy your contract to Alfajores, you'll need a Celo client connected to the testnet. In this exercise we are going to connect to a remote node to read and write to the public test net, but you could also run a test net node locally to perform the same actions.

Here are the steps we need to go through to deploy the contract to the test net.

1. Connect to Forno \(a remote Celo node service provider\)
2. Get personal account information \(generate a private key if required, stored in `./.secret`\)
3. Get your personal account address and fund it via the [faucet](https://celo.org/build/faucet)
4. Get the compiled contract bytecode
5. Create and sign the contract deployment transaction
6. Send transaction to the network

```javascript
const Kit = require('@celo/contractkit')

const kit = Kit.newKit('https://alfajores-forno.celo-testnet.org')

const getAccount = require('./getAccount').getAccount

async function awaitWrapper(){
    let account = await getAccount()

    console.log(account.address)
}

awaitWrapper()
```

Make sure the dependencies are installed with:

```text
$ npm install
```

Run the provided script with:

```text
$ node celo_deploy.js
```

The provided code will import the contract kit and connect to the remote node. It will look for a private key in the `./.secret` file, and if it doesn't find one, it will generate a new one. Once it gets the key, it will print the associated account. This is the account that we will fund with the faucet.

If you go to the [Alfajores Faucet Page](https://celo.org/build/faucet), you can faucet your account some Celo Gold and see your balance increase.

Then add your account to the `kit` with the private key:

```javascript
    kit.addAccount(account.privateKey)
```

### Deploy the contract

#### Truffle Deployment

Before we can use truffle for the migration, we need to set up the proper configuration in `truffle-config.js`.  At the top of `truffle-config.js`, let's set up the `kit` by connecting to the test network and adding the account we just funded.

```javascript
const Kit = require('@celo/contractkit')
const kit = Kit.newKit('https://alfajores-forno.celo-testnet.org')

const getAccount = require('./getAccount').getAccount

async function awaitWrapper(){
    let account = await getAccount()
    kit.addAccount(account.privateKey)
}
awaitWrapper()
```

Then, in the `networks` object, we can add the initialized `kit`provider to an `alfajores` property.

```javascript
  networks: {
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    alfajores: {
      provider: kit.web3.currentProvider, // CeloProvider
      network_id: 44786                   // Alfajores network id
    }
  }
```

Now, deploying the contracts to Alfajores is as easy as:

```javascript
$ truffle migrate --network alfajores
```

#### Custom Node.js Deployment

In this section, we will go over how to deploy a contract using a simple Node.js script to show how you can do it without using Truffle.

You need to compile the `HelloWorld.sol` contract using \(if it isn't already\):

```javascript
$ truffle compile
```

This command will generate a `HelloWorld.json` file in the `./build/contracts/` directory. `HelloWorld.json` contains a lot of data about the contract, compiler and low level details. Import this file into the deployment script with:

```javascript
const HelloWorld = require('./build/contracts/HelloWorld.json')
```

We are finally ready to deploy the contract. Use the `kit`to create a custom transaction that includes the contract bytecode.

```javascript
    let tx = await kit.sendTransaction({
        from: account.address,
        data: HelloWorld.bytecode // from ./build/contracts/HelloWorld.json
    })
```

{% hint style="info" %}
To deploy a contract on Celo, use the `kit.sendTransaction()` function with no `to:` field and the contract bytecode in the `data` field. The account that you are sending the transaction from must have enough cGLD to pay the transaction fee, unless you specify another currency as the `feeCurrency`, then you need enough of that currency to pay the transaction fee.
{% endhint %}

The entire deployment script is less than 20 lines of code.

```javascript
const Kit = require('@celo/contractkit')
const HelloWorld = require('./build/contracts/HelloWorld.json')

const kit = Kit.newKit('https://alfajores-forno.celo-testnet.org')

const getAccount = require('./getAccount').getAccount

async function awaitWrapper(){
    let account = await getAccount()
    kit.addAccount(account.privateKey) // this account must have a cGLD balance to pay transaction fees

    let tx = await kit.sendTransaction({
        from: account.address,
        data: HelloWorld.bytecode
    })
    const receipt = await tx.waitReceipt()
    console.log(receipt)
}

awaitWrapper()
```

Congratulations! You have deployed your first contract onto Celo! You can verify your contract deployment on [Blockscout](https://alfajores-blockscout.celo-testnet.org/). You can get the transaction hash from the receipt and look it up on the block explorer. 

The above method shows a more detail about how to create custom deployment transactions and scripts than the previous method.

As you can see, all the goodies from Ethereum apply to Celo, so virtually all tutorials and other content should be easily translatable to Celo.

Check out [https://celo.org/build](https://celo.org/build) for more resources!
