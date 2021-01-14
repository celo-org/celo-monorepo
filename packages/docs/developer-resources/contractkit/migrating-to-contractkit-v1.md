# Migrating to ContractKit v1.0.0

cLabs recently released ContractKit version 1.0.0. This document explains the key differences and shows you how you can start using the updated package.

If you are using a previous version of ContractKit, you can continue using that version and you will only need to make the following changes when you upgrade.

The main benefit of using the new version include:
 - Reduced bundle size
 - Better typescript support
 - Improved maintenance by making it easier to use other libraries

## ContractKit packages

ContractKit is now a [suite of packages](https://github.com/celo-org/celo-monorepo/tree/master/packages/sdk).

### Main packages

 - `Connect` depends on the `web3` package and allows you to specify the connection provider and contains some configuration information for signing transactions.
 - `ContractKit` depends on `connect` and `wallet-local` and allows you to connect to the Celo network, locally sign transactions and has more configuration options than `connect`. It also contains a registry of [Celo core contracts](contracts-wrappers-registry.md) to make it easier to interact with them.

### Complementary Packages

 - `Explorer` depends on `contractkit` and `connect`. It provides some utility functions that make it easy to listen for new block and log information.
 - `Governance` depends on `contractkit` and `explorer`. It provides functions to read and interact with Celo Governance Proposals (CGPs).
 - `Identity` simplifies interacting with [ODIS](odis.md), Celo’s lightweight identity layer based on phone numbers.
 - `Network-utils` provides utilities for getting genesis block and static node information.
 - `Transactions-uri` makes it easy to generate Celo transaction URIs and QR codes.

### Wallets and Wallet Utility packages

 - `Wallet-hsm-azure` is a Azure Key Vault implementation of a RemoteWallet.
 - `Wallet-hsm-aws` allows you to easily interact with a cloud HSM wallet built on AWS KMS.
 - `Wallet-ledger` provides utilities for interacting with a Ledger hardware wallet.
 - `Wallet-local`provides utilities for locally managing wallet by importing a private key string.
 - `Wallet-rpc` provides utilities for performing wallet functions via RPC.
 - `Wallet-base` provides base utilities for creating Celo wallets.
 - `Wallet-hsm` provides signature utilities for using HSMs.
 - `Wallet-remote` provides utilities for interacting with remote wallets. This is useful for interacting with wallets on secure remote servers.

## Connecting to the network

### Older versions:

```javascript
// version ^0.4.0 
const ContractKit = require('@celo/contractkit')

// Older versions create a new Web3 instance internally 
const kit = ContractKit.newKit('https://forno.celo.org')
```

### Version 1.0.0+

```javascript
// Since ContractKit no longer instantiates web3, you'll need to explicitly require it 
const Web3 = require('web3') 
const web3 = new Web3('https://forno.celo.org') 

// Require ContractKit and newKitFromWeb3 
const { ContractKit, newKitFromWeb3 } = require('@celo/contractkit') 
let contractKit = newKitFromWeb3(web3)
```
## Accessing Web3 functions

You can access web3 functions through the `connection` module.

```javascript
// version ^0.4.0 
let accounts = await kit.web3.eth.getAccounts()
 
// version 1.0.0 
let accounts = await kit.connection.web3.eth.getAccounts()
```
## Backward Compatibility

[These ContractKit functions](https://github.com/celo-org/celo-monorepo/blob/a7579fc9bdc0c1b4ce1d9fec702938accf82be2a/packages/sdk/contractkit/src/kit.ts#L278) will still work when accessed directly from `kit`, but it is advised to consume it via `connection` to avoid future deprecation.

```
// This still works
kit.addAccount

// recommended:
kit.connection.addAccount
```
