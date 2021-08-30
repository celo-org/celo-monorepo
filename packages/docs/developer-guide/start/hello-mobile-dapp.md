# DappKit Truffle Box

This tutorial includes a walk through of a truffle box to get you started with developing React Native dapps on Celo. We will touch on several key concepts in Celo dapp development including:

* Creating accounts \(private keys\)
* Basic smart contract development in Solidity
* Sending transactions to a Celo network
* View transactions with a block explorer
* Mobile development using React Native and Expo

**Mandatory:** Make sure that you have the [Yarn package manager](https://yarnpkg.com/), [Truffle](https://www.trufflesuite.com/truffle) installed and **are using Node.js v12.x**, then `$ truffle unbox critesjosh/celo-dappkit` in your new project directory. This will download the code from [this GitHub repo](https://github.com/critesjosh/celo-dappkit) to get you started.

Use this [Truffle Box](https://www.trufflesuite.com/boxes) to get started building a mobile dapp using Celo and React Native in Javascript. We will build a simple React Native application that we can use to read and update a contract on the Alfajores test network.

Once you download the box, run `$ yarn` to install the necessary smart contract development dependencies. Navigate to the client directory and run `$ yarn` again to install the client application dependencies.

This Truffle box uses React Native and Expo for developing a mobile first Celo blockchain experience. You will also need Expo installed globally on your machine. Install it with:

```text
$ npm install expo-cli --global
```

## Smart contract development

The project comes with a Hello World example contract in the root contracts directory. The box is also configured to deploy Solidity smart contracts to the Alfajores test network, but you will need test network funds to pay for the deployment costs.

Run

```text
$ npm run account
```

to create a new account for development. The new account address will be printed in the console. This script will generate a private key for you and store it in `/.secret`. If you need to print the account info again, run `$ npm run account` again, it will not create a new account, it will read the saved private key and print the corresponding account address.

Truffle will read this private key for contract deployments.

Copy your account address and paste it in to the [Alfajores faucet](https://celo.org/developers/faucet) to fund your account.

You can migrate the `HelloWorld.sol` contract to the alfajores test network with

```bash
$ truffle migrate --network alfajores
```

To run a local development Celo blockchain, use the Celo fork of `ganache-cli`. You can find the package details and install instructions [here.](https://www.npmjs.com/package/@celo/ganache-cli)

You should deploy the `HelloWorld.sol` contract to work through the exercise. You can deploy it using the remote node specified in `truffle-config.js`. You may get an error about connecting to a running RPC client. If you run into the error, trying running `truffle migrate --network alfajores` again. A successful deployment should print something like the following:

```text
Joshs-MacBook-Pro-2:untitled folder joshcrites$ truffle migrate --network alfajores

Compiling your contracts...
===========================
> Everything is up to date, there is nothing to compile.


Starting migrations...
======================
> Network name:    'alfajores'
> Network id:      44787
> Block gas limit: 0x1312d00


1_initial_migration.js
======================

   Deploying 'Migrations'
   ----------------------
   > transaction hash:    0x8a7d5f323ef9e356407566ded4d191e3b68b0ba579c5a7b920e5dea3936bb101
   > Blocks: 0            Seconds: 4
   > contract address:    0x6363f95B5dDe5bbb1A73dbdc752036e105769207
   > block number:        587188
   > block timestamp:     1583779418
   > account:             0x0ac6eDb733EAB57f8fa6c0F8678de0b9ef950bc6
   > balance:             4.98552399999999992
   > gas used:            188419
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00376838 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.00376838 ETH


2_deploy_contracts.js
=====================

   Deploying 'HelloWorld'
   ----------------------
   > transaction hash:    0xb48d8f2da01f49b6ebe3dd2391b289c735afd2ec1b57902a5bd3958c4b5773b3
   > Blocks: 1            Seconds: 4
   > contract address:    0xD9BBC1c3C76bd285C33de5Df4b987369EC66DC56
   > block number:        587190
   > block timestamp:     1583779428
   > account:             0x0ac6eDb733EAB57f8fa6c0F8678de0b9ef950bc6
   > balance:             4.979126059999999888
   > gas used:            277896
   > gas price:           20 gwei
   > value sent:          0 ETH
   > total cost:          0.00555792 ETH


   > Saving migration to chain.
   > Saving artifacts
   -------------------------------------
   > Total cost:          0.00555792 ETH


Summary
=======
> Total deployments:   2
> Final cost:          0.0093263 ETH
```

Since we are developing this on the public Alfajores test network, we can view all the accounts, contracts and transactions on the [public block explorer](https://alfajores-blockscout.celo-testnet.org/).

You can look up the contract deployment transaction on the Alfajores block explorer via the transaction hash, [https://alfajores-blockscout.celo-testnet.org/tx/0xb48d8f2da01f49b6ebe3dd2391b289c735afd2ec1b57902a5bd3958c4b5773b3](https://alfajores-blockscout.celo-testnet.org/tx/0xb48d8f2da01f49b6ebe3dd2391b289c735afd2ec1b57902a5bd3958c4b5773b3) in this case.

Truffle will save the deployment information to the Truffle artifact located at `client/contracts/HelloWorld.json`. You will use this deployment information to connect your React Native application to the correct contract.

## Developing the mobile application

Keep in mind that you will need a version of the Celo Wallet installed on the mobile device with which you are developing the application. The Celo Wallet is the private key management software used to sign transactions for the user.

You can build a the latest version of the Celo Wallet and find instructions on running a development build [here.](https://github.com/celo-org/celo-monorepo/tree/master/packages/mobile) Once you have a device with the Celo wallet installed, you can start working on your application.

For the purposes of introduction, we have added some code to you get you started located in App.js in the `client` directory.

### Application development with Expo

In this project, the React Native application lives in the `client` directory. `cd` into the client directory and run `$ yarn` to install the dependencies.

[Expo](https://expo.io/) is a tool that makes developing React Native applications much easier. We will be using Expo for easy setup.

Install it with:

```text
$ npm install expo-cli --global
```

You can start the application with

```text
$ expo start
```

You can use your physical mobile device or an emulator to develop apps with Expo. If you want to use your physical device, you will have to [install the Expo app on your device.](https://expo.io/learn)

### Using an emulator

You can find more information about running and Android emulator [here.](https://developer.android.com/studio/run/emulator-commandline)

## Celo Dapp Examples

[Celo Savings Circle](https://github.com/celo-org/savings-circle-demo)

## Wrapping up

You should now have the necessary skills to get started with developing mobile applications on Celo. In this tutorial we covered:

* Creating accounts \(private keys\)
* Basic smart contract development in Solidity
* Sending transactions to a Celo network
* View transactions with a block explorer
* Mobile development using React Native and Expo

This is not a comprehensive tutorial for Celo's features and capabilities, keep exploring the docs to learn more and please [connect with us on Discord](https://chat.celo.org) if you need any help \(or just want to chat\)!

