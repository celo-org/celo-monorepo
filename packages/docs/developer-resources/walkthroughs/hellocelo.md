---
description: >-
  In this guide we are going to learn how to connect to the Celo test network
  using ContractKit.
---

# Hello Celo: sending value with Celo

In this guide we are going to write a Node.js script to introduce some of the basic concepts that are important to understand how Celo works. This will get us started with connecting to the Celo network and learning how to develop more advanced applications.

{% hint style="info" %}
We assume you already have Node.js and NPM installed on your computer.
{% endhint %}

## Learning Objectives

At the end of this guide, you will be able to:

* Connect to the Celo test network, called Alfajores
* Get test cGLD and cUSDs from the faucet
* Read account and contract information from the test network
* Send transactions to the network

## Getting Started

To start, [clone this GitHub repo](https://github.com/critesjosh/helloCelo). This is a Node.js application.

```
$ git clone https://github.com/critesjosh/helloCelo.git
```

We will be using the Celo ContractKit SDK to interact with the Celo test network. Let's install it. It is already defined in the package.json, so we can get it with

```javascript
$ npm install
```

## Importing ContractKit

We will be writing our Node.js app in the `helloCello.js` file.

Import the contract kit into our script with

```javascript
// 1. Import contractkit
const ContractKit = require('@celo/contractkit')
```

Now we can use the ContractKit to connect to the network.

```javascript
// 2. Init a new kit, connected to the alfajores testnet
const kit = ContractKit.newKit('https://alfajores-forno.celo-testnet.org')
```

{% hint style="info" %}
At any point in the file you can `console.log()` variables to print their output when you run the script.
{% endhint %}

## Reading Alfajores

ContractKit contains a `contracts` property that we can use to access certain information about deployed Celo contracts.

{% hint style="info" %}
The Celo blockchain has two native assets, Celo Gold \(cGLD\) and the Celo Dollar \(cUSD\). Both of these assets implement the [ERC20 token standard](https://eips.ethereum.org/EIPS/eip-20) from Ethereum. The cGLD asset is managed by the Celo Gold smart contract. We can access the gold contract with the SDK with `kit.contracts.getGoldToken()`. This function returns a promise, so we have to wait for it to resolve before we can interact with the gold token contract. If you are unfamiliar with Promises in Javascript, [check out this documentation.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promises are a common tool in blockchain development. In this guide, we use the [async/await syntax for promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).
{% endhint %}

Let's read some token balances from the blockchain. Add the following line in the `readAccount()` function. 

```javascript
// 3. Get the Gold Token contract
let goldtoken = await kit.contracts.getGoldToken()
```

We can get the cGLD balance of an account using the gold token wrapper with `goldtoken.balanceOf(address)`. Let's check the balance of this address `'0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'`

```javascript
// 4. Address to look up
let anAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'

// 5. Get Gold Token balance
let balance = await goldtoken.balanceOf(anAddress)

// Print balance
console.log(`${anAddress} balance: ${balance.toString()}`)
```

The `balanceOf(address)` function also returns a Promise, so we wait for the promise to resolve then we print the result.

{% hint style="info" %}
You may notice that we convert the balance to a string before we print it. This is because the `balanceOf()` function returns a [BigNumber](https://github.com/MikeMcl/bignumber.js/). Javascript does not have floating point numbers, so it is common to convert integers to large numbers before doing arithmetic. So 1 cGLD = 10\*\*18 base units of cGLD. The `balanceOf()` function returns the account balance in these base units. Converting the BigNumber to a string converts the BigNumber object into a more legible string.
{% endhint %}

Reading all account balances is a powerful feature of blockchains. Next, let's see how we can send value to each other on the test net.

In order to do transfers (aka [transactions](https://docs.celo.org/getting-started/glossary#transaction)), we need to:

1. Create an [account](https://docs.celo.org/getting-started/glossary#account) \(by creating a private key\)
2. Fund it with test cGLD and cUSDs
3. Sign and send transactions to the network

## Accounts

We are accessing the Celo network via a remote [node](https://docs.celo.org/getting-started/glossary#node) via HTTP requests at `'https://alfajores-forno.celo-testnet.org'`.

{% hint style="info" %}
Don't worry about what this means right now, just understand that it is easier to get started using Celo by accessing remote nodes, rather than running them locally on your machine. You can [read more about the details of the Celo network here.](https://github.com/critesjosh/celo-monorepo/tree/8542c1bc3ad32bc48eed33073f4d34a36fd91fae/packages/docs/celo-sdk/walkthroughs/overview.md#topology-of-a-celo-network)
{% endhint %}

Because we are accessing the network remotely, we need to generate an account to sign transactions and fund that account with test cGLD.

There is a short script in `getAccount.js` to either get a Celo account from a mnemonic in the `.secret` file, or create a random account if the file is empty. In the script, we use`web3.js` to create a new private key/account pair. [Web3.js](https://web3js.readthedocs.io/en/v1.2.6/) is a popular javascript library for handling Ethereum related functionality. Celo is a cousin of Ethereum, so this library works well for generating Celo accounts.

{% hint style="danger" %}
This is not the standard way of managing Celo accounts. In a production environment, the [Celo Wallet](../../celo-codebase/wallet/) will manage accounts for you. Accessing accounts from the Celo Wallet will be discussed in future guides.
{% endhint %}

We can now use this `account` to get account information \(ie the private key and account address\) and to send transactions from `account.address`. Add the following code to read the account balance. Continue adding to `helloCelo.js`.

```javascript
//
// Create an Account
//

// 6. Import the getAccount function
const getAccount = require('./getAccount').getAccount

async function createAccount(){
    // 7. Get your account
    let account = await getAccount()
    
    // 8. Get the Gold Token contract wrapper
    let goldtoken = await kit.contracts.getGoldToken()
    
    // 9. Get your Celo Gold balance
    let balance = await goldtoken.balanceOf(account.address)

    // Print your account info
    console.log(`Your account address: ${account.address}`)
    console.log(`Your account balance: ${balance.toString()}`)
}
```

This will print `0`, as we have not funded the associated account yet.

## Using the faucet

We can get free test cGLD and cUSDs on the test network for development via [the Celo Alfajores faucet](https://celo.org/build/faucet).

Copy your randomly generated account address from the console output mentioned above, and paste it into the faucet.

Once your account has been funded, run `$ node helloCelo.js` again to see your updated balance.

## Sending Value

We have an account with cGLD in it, now how do we send it to another account. Remember the Gold Token wrapper we used to read account balances earlier? We can use the same wrapper to send tokens, you just need to add the private key associated with your account to ContractKit \(see line 10\).

The Gold Token wrapper has a method called `transfer(address, amount)` that allows you to send value to the specified address \(line 14\).

You need to `send()` the transaction to the network after you construct it. The `send()` method returns a transaction object. We will wait for the transaction receipt \(which will be returned when the transaction has been included in the blockchain\) and print it when we get it. This receipt contains information about the transaction.

After we read the receipt, we check the balance of our account again, using the `balanceOf()` function. The logs print our updated balance!

You may notice that the account balance is a bit smaller than the amount of tokens that we sent. This is because you have to pay for every update to the network.

Add the following code to the `send()` function in `helloCelo.js` to send a transaction.

```javascript
async function send(){
    // 10. Get your account
    let account = await getAccount()
    
    // 11. Add your account to ContractKit to sign transactions
    kit.addAccount(account.privateKey)
    
    // 12. Specify recipient Address
    let anAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'

    // 13. Specify an amount to send
    let amount = 100000

    // 14. Get the Gold Token contract wrapper    
    let goldtoken = await kit.contracts.getGoldToken()
    
    // 15. Transfer gold from your account to anAddress
    let tx = await goldtoken.transfer(anAddress, amount).send({from: account.address})
    
    // 16. Wait for the transaction to be processed
    let receipt = await tx.waitReceipt()
    
    // 17. Print receipt
    console.log('Transaction receipt: %o', receipt)
    
    // 18. Get your new balance
    let balance = await goldtoken.balanceOf(account.address)
    
    // 19. Print new balance
    console.log(`Your new account balance: ${balance.toString()}`)
}
```

Run `$ node helloCelo.js` again to send the transaction and see the printed output in the console.

## Wrapping Up

Congratulations! You have accomplished a lot in this short introduction to developing on Celo.

We covered:

* Installing and setting up ContractKit 
* Connecting to the Celo Alfajores network
* Getting the cGLD contract wrapper
* Reading account balances using the cGLD wrapper
* Generating a new account in Celo
* Funding an account using the Celo Alfajores Faucet
* Sending cGLD

