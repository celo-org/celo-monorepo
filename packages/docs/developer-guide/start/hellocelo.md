---
description: >-
  In this guide we are going to learn how to connect to the Celo test network
  and tranfer tokens using ContractKit.
---

# Sending CELO & cUSD

In this guide we are going to write a Node.js script to introduce some of the basic concepts that are important to understand how Celo works. This will get us started with connecting to the Celo network and learning how to develop more advanced applications.

{% hint style="info" %}
We assume you already have Node.js and NPM installed on your computer.
{% endhint %}

## Learning Objectives

At the end of this guide, you will be able to:

* Connect to the Celo test network, called Alfajores
* Get test CELO and Celo Dollars \(cUSD\) from the faucet
* Read account and contract information from the test network
* Transferring CELO and cUSD on the test network

## Getting Started

To start, [clone this GitHub repo](https://github.com/critesjosh/helloCelo). This is a Node.js application.

```text
git clone https://github.com/critesjosh/helloCelo.git
```

We will be using the Celo ContractKit SDK to interact with the Celo test network \(Alfajores\). Let's install it. It is already defined in the package.json, so we can get it with

```text
cd helloCelo
npm install
```

## Importing ContractKit

We will be writing our Node.js app in the `helloCelo.js` file.

Import the contract kit into our script with

```javascript
// 1. Import web3 and contractkit 
const Web3 = require("web3")
const ContractKit = require('@celo/contractkit')
```

Now we can use the ContractKit to connect to the test network.

```javascript
// 2. Init a new kit, connected to the alfajores testnet
const web3 = new Web3('https://alfajores-forno.celo-testnet.org')
const kit = ContractKit.newKitFromWeb3(web3)
```

{% hint style="info" %}
At any point in the file you can `console.log()` variables to print their output when you run the script.
{% endhint %}

## Reading Alfajores

ContractKit contains a `contracts` property that we can use to access certain information about deployed Celo contracts.

{% hint style="info" %}
The Celo blockchain has two native assets, CELO \(CELO\) and the Celo Dollar \(cUSD\). Both of these assets implement the [ERC20 token standard](https://eips.ethereum.org/EIPS/eip-20) from Ethereum. The CELO asset is managed by the CELO smart contract and Celo Dollars is managed by the cUSD contract. We can access the CELO contract via the SDK with `kit.contracts.getGoldToken()` and the cUSD contract with `kit.contracts.getStableToken()`. These functions return promises, so we have to wait for them to resolve before we can interact with the token contracts. If you are unfamiliar with Promises in Javascript, [check out this documentation.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) Promises are a common tool in blockchain development. In this guide, we use the [async/await syntax for promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await).
{% endhint %}

Let's read some token balances from the blockchain. Add the following line in the `readAccount()` function.

```javascript
// 3. Get the token contract wrappers
let goldtoken = await kit.contracts.getGoldToken()
let stabletoken = await kit.contracts.getStableToken()
```

We can get the CELO balance of an account using the token wrappers like `goldtoken.balanceOf(address)`. Let's check the balance of this address `'0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'`.

```javascript
// 4. Address to look up
let anAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'

// 5. Get token balances
let celoBalance = await goldtoken.balanceOf(anAddress)
let cUSDBalance = await stabletoken.balanceOf(anAddress)

// Print balances
console.log(`${anAddress} CELO balance: ${celoBalance.toString()}`)
console.log(`${anAddress} cUSD balance: ${cUSDBalance.toString()}`)
```

The `balanceOf(address)` function also returns a Promise, so we wait for the promise to resolve then we print the result.

To view the balances, run the script from the termainal with

```text
node helloCelo.js
```

{% hint style="info" %}
Note that the `balanceOf()` function returns objects with type [BigNumber](https://github.com/MikeMcl/bignumber.js/) because balances are represented in Celo as a 256 bit unsigned integer, and JavaScript's number type cannot safely handle numbers of that size. Note also that the balance values are reported in units of CELO Wei, where one CELO = 10\*\*18 CELO Wei.
{% endhint %}

Reading all account balances is a powerful feature of blockchains. Next, let's see how we can send value to each other on the testnet.

In order to do transfers \(aka [transactions](https://docs.celo.org/getting-started/glossary#transaction)\), we need to:

1. Create an [account](https://docs.celo.org/getting-started/glossary#account) \(by creating a private key\)
2. Fund it with test CELO and cUSDs
3. Sign and send transactions to the network

## Accounts

We are accessing the Celo network via a remote [node](https://docs.celo.org/getting-started/glossary#node) via HTTP requests at `'https://alfajores-forno.celo-testnet.org'`.

{% hint style="info" %}
Don't worry about what this means right now, just understand that it is easier to get started using Celo by accessing remote nodes, rather than running them locally on your machine. You can [read more about the details of the Celo network here.](https://github.com/critesjosh/celo-monorepo/tree/8542c1bc3ad32bc48eed33073f4d34a36fd91fae/packages/docs/celo-sdk/walkthroughs/overview.md#topology-of-a-celo-network)
{% endhint %}

Because we are accessing the network remotely, we need to generate an account to sign transactions and fund that account with test CELO.

There is a short script in `getAccount.js` to either get a Celo account from a mnemonic in the `.secret` file, or create a random account if the file is empty. In the script, we use`web3.js` to create a new private key/account pair. [Web3.js](https://web3js.readthedocs.io/) is a popular javascript library for handling Ethereum related functionality. Celo is a cousin of Ethereum, so this library works well for generating Celo accounts.

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

    // 8. Get the token contract wrappers
    let goldtoken = await kit.contracts.getGoldToken()
    let stabletoken = await kit.contracts.getStableToken()

    // 9. Get your token balances
    let celoBalance = await goldtoken.balanceOf(account.address)
    let cUSDBalance = await stabletoken.balanceOf(account.address)

    // Print your account info
    console.log(`Your account address: ${account.address}`)
    console.log(`Your account CELO balance: ${celoBalance.toString()}`)
    console.log(`Your account cUSD balance: ${cUSDBalance.toString()}`)
}
```

Run this script again with `node helloCelo.js`. This will print `0`, as we have not funded the associated account yet.

## Using the faucet

We can get free test CELO and cUSDs on the test network for development via [the Celo Alfajores faucet](https://celo.org/build/faucet).

Copy your randomly generated account address from the console output mentioned above, and paste it into the faucet.

Once your account has been funded, run `$ node helloCelo.js` again to see your updated balance.

## Sending Value

We have an account with CELO and cUSD in it, now how do we send tokens to another account? Remember the token wrappers we used to read account balances earlier? We can use the same wrappers to send tokens, you just need to add the private key associated with your account to ContractKit \(see line 10\).

The token wrappers have a method called `transfer(address, amount)` that allows you to send value to the specified address \(line 14\).

You need to `send()` the transaction to the network after you construct it. The `send()` methods accepts an option that allows you to specify the `feeCurrency`, which allows the sender to pay transaction fees in CELO or cUSD. The default `feeCurrency` is CELO. In the following example, let's pay transaction fees in CELO when we transfer CELO and pay with cUSD when we transfer cUSD.

The `send()` method returns a transaction object. We will wait for the transaction receipt \(which will be returned when the transaction has been included in the blockchain\) and print it when we get it. This receipt contains information about the transaction.

After we read the receipt, we check the balance of our account again, using the `balanceOf()` function. The logs print our updated balance!

You may notice that the account balance is a bit smaller than the amount of tokens that we sent. This is because you have to pay for every update to the network.

Add the following code to the `send()` function in `helloCelo.js` to send a transaction.

```javascript
async function send(){
    // 10. Get your account
    let account = await getAccount()

    // 11. Add your account to ContractKit to sign transactions
    kit.connection.addAccount(account.privateKey)

    // 12. Specify recipient Address
    let anAddress = '0xD86518b29BB52a5DAC5991eACf09481CE4B0710d'

    // 13. Specify an amount to send
    let amount = 100000

    // 14. Get the token contract wrappers    
    let goldtoken = await kit.contracts.getGoldToken()
    let stabletoken = await kit.contracts.getStableToken()

    // 15. Transfer CELO and cUSD from your account to anAddress
    // Specify cUSD as the feeCurrency when sending cUSD
    let celotx = await goldtoken.transfer(anAddress, amount).send({from: account.address})
    let cUSDtx = await stabletoken.transfer(anAddress, amount).send({from: account.address, feeCurrency: stabletoken.address})

    // 16. Wait for the transactions to be processed
    let celoReceipt = await celotx.waitReceipt()
    let cUSDReceipt = await cUSDtx.waitReceipt()

    // 17. Print receipts
    console.log('CELO Transaction receipt: %o', celoReceipt)
    console.log('cUSD Transaction receipt: %o', cUSDReceipt)

    // 18. Get your new balances
    let celoBalance = await goldtoken.balanceOf(account.address)
    let cUSDBalance = await stabletoken.balanceOf(account.address)

    // 19. Print new balance
    console.log(`Your new account CELO balance: ${celoBalance.toString()}`)
    console.log(`Your new account cUSD balance: ${cUSDBalance.toString()}`)
}
```

Run `$ node helloCelo.js` again to send the transactions and see the printed output in the console.

## Connecting to a Ledger Device from a Web Application

The above instructions apply to building NodeJS applications. If you want to build an integration with a web application, you can still use the ContractKit by following slightly modified instructions.

The following code examples are typescript so should be stored in a `.tsc` file, you will also need to install typescript and then compile your typescript to javascript with `npx tsc` before you can run the code with node.

```text
npm install --save-dev typescript
npm install web3 @celo/contractkit @celo/wallet-ledger @ledgerhq/hw-app-eth @ledgerhq/hw-transport-u2f @ledgerhq/hw-transport-webusb
```

Then, you can create a new instance of the ContractKit with the following code:

```javascript
import { ContractKit, newKitFromWeb3 } from "@celo/contractkit";
import { newLedgerWalletWithSetup } from "@celo/wallet-ledger";
import Eth from "@ledgerhq/hw-app-eth";
import TransportU2F from "@ledgerhq/hw-transport-u2f";
import TransportUSB from "@ledgerhq/hw-transport-webusb";
import Web3 from "web3";

// Handle getting the Celo Ledger transport.
const getCeloLedgerTransport = () => {
  if (window.USB) {
    return TransportUSB.create();
  } else if (window.u2f) {
    return TransportU2F.create();
  }

  throw new Error("Ledger Transport not support, please use Chrome, Firefox, Brave, Opera or Edge.");
};

// Handle creating a new Celo ContractKit
const getContractKit = async () => {
  // Create a Web3 provider by passing in the testnet/mainnet URL
  const web3 = new Web3("https://alfajores-forno.celo-testnet.org");

  // Get the appropriate Ledger Transport
  const transport = await getCeloLedgerTransport();

  // Create a new instance of the ETH Ledger Wallet library
  const eth = new Eth(transport);

  // Use the Celo Ledger Wallet setup util
  const wallet = await newLedgerWalletWithSetup(eth.transport);

  // Instantiate the ContractKit
  const kit: ContractKit = newKitFromWeb3(web3, wallet);

  return kit;
};
```

Once you have successfully created the ContractKit, you can use the various Celo contracts to sign transactions with a connected Ledger device. For example, here's how to transfer gold tokens \(just like above in the NodeJS example\):

```javascript
// Use the gold token contract to transfer tokens
const transfer = async (from, to, amount) => {
  const goldTokenContract = await kit.contracts.getGoldToken();
  const tx = await goldTokenContract.transfer(to, amount).send({ from });
  const receipt = await tx.waitReceipt();
  console.log("Transaction Receipt: ", receipt);
};
```

This is the basic setup to integrate the Celo Ledger App with a web application. You can also view the [Celo Ledger App example codebase](https://github.com/celo-org/celo-ledger-web-app) for some other examples of connecting to a Ledger Device from a web application.

## Wrapping Up

Congratulations! You have accomplished a lot in this short introduction to developing on Celo.

We covered:

* Installing and setting up ContractKit
* Connecting to the Celo Alfajores network
* Getting the CELO contract wrapper
* Reading account balances using the CELO wrapper
* Generating a new account in Celo
* Funding an account using the Celo Alfajores Faucet
* Sending CELO

