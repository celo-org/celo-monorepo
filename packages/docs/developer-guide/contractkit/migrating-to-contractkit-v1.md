# Migrating to ContractKit v1.0

cLabs recently released [ContractKit version 1.0.0](https://medium.com/celoorg/contractkit-1-0-0-9c0412462d45). In it, the original ContractKit package has been split into several separate packages that all make up the Celo SDK. This document explains the key differences and shows you how you can start using the updated SDK.

If you are using a previous version of ContractKit \(anything below 1.0.0\), you can continue using that version and you will only need to make the following changes when you upgrade.

The main benefit of using the new version include:

* Reduced bundle size
* Better Typescript support
* Improved maintenance by making it easier to use other libraries

## ContractKit packages

ContractKit is now a [suite of packages](https://github.com/celo-org/celo-monorepo/tree/master/packages/sdk).

### Main packages

* `Connect` handles how we communicate to the our chain nodes. It wraps the `web3` library and has its own `rpcCaller` class, to make custom calls to the node. It's the layer in charge of knowing how and which parameters are added by Celo, connect to the node, build the message, send it and handle those responses.
* `ContractKit` is a reduced subset of the previous versions of ContractKit. This is the layer in charge of loading and using our [core contracts](contracts-wrappers-registry.md). Internally, uses the `connect` package described above. It has our contracts generated from the ABIs, their wrappers, and also the logic to make claims.

### Complementary Packages

* `Explorer` depends on `contractkit` and `connect`. It provides some utility functions that make it easy to listen for new block and log information.
* `Governance` depends on `contractkit` and `explorer`. It provides functions to read and interact with Celo Governance Proposals \(CGPs\).
* `Identity` simplifies interacting with [ODIS](odis.md), Celo’s lightweight identity layer based on phone numbers.
* `Network-utils` provides utilities for getting genesis block and static node information.
* `Transactions-uri` makes it easy to generate Celo transaction URIs and QR codes.

### Wallets and Wallet Utility packages

* `Wallet-hsm-azure` is a Azure Key Vault implementation of a RemoteWallet.
* `Wallet-hsm-aws` allows you to easily interact with a cloud HSM wallet built on AWS KMS.
* `Wallet-ledger` provides utilities for interacting with a Ledger hardware wallet.
* `Wallet-local`provides utilities for locally managing wallet by importing a private key string.
* `Wallet-rpc` provides utilities for performing wallet functions via RPC.
* `Wallet-base` provides base utilities for creating Celo wallets.
* `Wallet-hsm` provides signature utilities for using HSMs.
* `Wallet-remote` provides utilities for interacting with remote wallets. This is useful for interacting with wallets on secure remote servers.

## Importing packages

Importing the packages is slightly different now that many packages are separate from the main `ContractKit` package. You will have to explicitly import these packages instead of just importing all of them with `ContractKit`.

For example:

```javascript
// Previously this would work to import the block-explorer
import { newBlockExplorer } from '@celo/contractkit/lib/explorer/block-explorer'

// With ContractKit v1.x.y, import the block-explorer explicitly
import { newBlockExplorer } from '@celo/explorer/lib/block-explorer'
```

## Connecting to the network

### Older versions of ContractKit:

```javascript
// version ^0.4.0 
const ContractKit = require('@celo/contractkit')

// Older versions of ContractKit create a new Web3 instance internally 
const kit = ContractKit.newKit('https://forno.celo.org')
```

### Version 1.x.y

```javascript
// Since ContractKit no longer instantiates web3, you'll need to explicitly require it 
const Web3 = require('web3') 
const web3 = new Web3('https://forno.celo.org') 

// Require ContractKit and newKitFromWeb3 
const { ContractKit, newKitFromWeb3 } = require('@celo/contractkit') 
let contractKit = newKitFromWeb3(web3)
```

## Accessing Web3 functions

You can access `web3` functions through the `connection` module.

```javascript
// version ^0.4.0 
let amount = kit.web3.utils.fromWei("1000000", "ether")

// version 1.x.y
let amount = kit.connection.web3.utils.fromWei("1000000", "ether")
```

## Backward Compatibility

[These ContractKit functions](https://github.com/celo-org/celo-monorepo/blob/a7579fc9bdc0c1b4ce1d9fec702938accf82be2a/packages/sdk/contractkit/src/kit.ts#L278) will still work when accessed directly from `kit`, but it is advised to consume it via `connection` to avoid future deprecation.

```text
// This still works
kit.addAccount

// recommended:
kit.connection.addAccount
```

## `Connection` package

The `connection` package update includes implementations of some common web3 functions. Here are a few examples:

* `kit.web3.eth.isSyncing` --&gt; `kit.connection.isSyncing`
* `kit.web3.eth.getBlock` --&gt; `kit.connection.getBlock`
* `kit.web3.eth.getBlockNumber` --&gt; `kit.connection.getBlockNumber`
* `kit.web3.eth.sign` --&gt; `kit.connection.sign`
* `kit.isListening` --&gt; `kit.connection.isListening`
* `kit.addAccount` --&gt; `kit.connection.addAccount`

