# Overview

This section contains information about some of the key tools and resources that will help developers start building applications on Celo.

## Quick Start Guides

View the [Developer Code Examples page](start/) to get started using the Celo SDKs with guided coding exercises.

## Tools

### SDKs

* [ContractKit](contractkit/)
  * Javascript package of Celo blockchain utilities
  * Manage connections to the Celo blockchain, accounts, send transactions, interact with smart contracts, etc.
  * A set of wrappers around the core protocol smart contracts to easily connect with contracts related to governance, validators, on-chain exchange, etc.
  * Includes [web3.js](https://web3js.readthedocs.io/en/v1.2.4/)
* [Celo Ethers.js Wrapper](https://github.com/celo-tools/celo-ethers-wrapper) \(_experimental_\)
  * A minimal wrapper to make [ethers.js](https://docs.ethers.io/v5/) compatible with the Celo network
* [use-contractkit](https://github.com/celo-tools/use-contractkit)
  * A [Web3Modal](https://web3modal.com/)-like experience that injects ContractKit into your web-based application. Supports a variety of different wallets, including but not limited to Valora, Ledger, Metamask \(Celo compatible fork\) and any WalletConnect compatible wallets
* [DappKit](dappkit/)
  * Easily connect to the [Valora](http://valoraapp.com/) wallet with your React Native mobile application
  * Valora manages user account, private keys and transaction signing, so you can focus on building your dapp
  * Learn more and see the code with the [Dappkit truffle box](https://github.com/critesjosh/celo-dappkit)
* [Python SDK](https://github.com/blaize-tech/celo-sdk-py)
* [Java SDK](https://github.com/blaize-tech/celo-sdk-java)

### Infrastructure

* [Valora](https://valoraapp.com/) provides a clean, intuitive UI where users can send transactions and interact with smart contracts
* [Forno](forno.md)
  * Node access service so you can connect your dapp to the Celo blockchain without having to run node infrastructure
* [ODIS](contractkit/odis.md)
  * Oblivious decentralized identity service
  * Lightweight identity layer that makes it easy to send cryptocurrency to a phone number
* Blockscout block explorers
  * [Alfajores testnet](http://alfajores-blockscout.celo-testnet.org/) & [mainnet](http://explorer.celo.org/)
* [Stats.celo.org](http://stats.celo.org) to check network activity and health

#### Networks

* [Alfajores Testnet](../getting-started/alfajores-testnet/)
  * [Faucet](https://celo.org/developers/faucet) for free testnet CELO and cUSD
  * [Forno](forno.md) supports connections to alfajores
  * Requires Alfajores Celo wallet for mobile device testing \(please request, [support@clabs.co](mailto:support@clabs.co)\)
* [Baklava testnet](../getting-started/baklava-testnet/) for validators and testing protocol changes

### Ethereum Tools

* Similarities between Celo and Ethereum means you can use many of the most popular Ethereum developer tools.
  * Celo supports the EVM, so tools for writing smart contracts in Solidity \(or any language that compiles to EVM bytecode\) are compatible with Celo
  * ERC20, NFT \(ERC721\) and other smart contract interface standards are supported, see [Celo for Ethereum Developers](celo-for-eth-devs.md)
  * [Truffle](https://www.trufflesuite.com/)
  * [OpenZeppelin](https://openzeppelin.com/)
  * [Remix](https://remix.ethereum.org/)
  * Many more

### Ongoing projects

* [Community projects](celo-dapp-gallery.md)
* [Grant recipients](https://celo.org/experience/grants/directory)
* Web wallets
  * [celowallet.app](https://celowallet.app)
  * [Celo Terminal](https://github.com/zviadm/celoterminal/)

## Community

* Join our [Discord](https://chat.celo.org)
* [Discourse Forum](https://forum.celo.org/)

