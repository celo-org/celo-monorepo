# Celo Overview

Celo’s aim is to empower anyone with a smartphone anywhere in the world to have access to financial services, send money to phone numbers, and pay merchants -- on a decentralized platform that is operated by a community of users.

To achieve this, Celo is a complete stack of new blockchain software, core libraries that run on that blockchain, and end user applications including a Wallet app that communicate with that logic.

This page provides some background on blockchain technology and explores the Celo software stack.

### Background and Key Concepts

A **blockchain** or **cryptographic network** is a broad term used to describe a database maintained by a distributed set of computers that do not share a trust relationship or common ownership. This arrangement is referred to as **decentralized**. The content of a blockchain's database, or **ledger**, is authenticated using cryptographic techniques, preventing its contents from being added to, edited or removed except according to a protocol operated by the network as a whole.

The code of the Celo Blockchain has shared ancestry with [Ethereum](https://www.ethereum.org), blockchain software for building general-purpose decentralized applications. Celo differs from Ethereum in several important areas as described in the following sections. However, it inherits a number of key concepts.

{% hint style="warning" %}
Despite its similarity to Ethereum, Celo is a completely different blockchain and protocol, and Celo assets **cannot** be accessed on the Ethereum network.
{% endhint %}

Ethereum applications are built using **smart contracts**. Smart contracts are programs written in languages like [Solidity](https://solidity.readthedocs.io/en/v0.5.10/) that produce bytecode for the **Ethereum Virtual Machine** or **EVM**, a runtime environment. Programs encoded in smart contracts receive messages and manipulate the blockchain ledger and are termed **on-chain**.

Celo has a native unit of accounting, the cryptocurrency **CELO**, comparable to Ether on Ethereum. Celo's ledger consists of **accounts**, identified by an **address**. There are two types of accounts. **Externally owned accounts** have an associated CELO balance and are controlled by a user holding the associated public-private keypair. **Contract accounts** contain the code and data of a single smart contract which can be called and manipulate its own stored data.

**ERC-20** is a standard interface for implementing cryptocurrencies or **tokens** as contracts, rather than via account balances. For additional information on this, see [Celo for Ethereum Developers](https://docs.celo.org/developer-guide/celo-for-eth-devs). In Celo, CELO has a duality as both the native currency and an ERC-20 compliant token on the Celo blockchain.

{% hint style="warning" %}
Celo assets exist on an independent blockchain, and cannot be accessed through wallets that connect to the Ethereum network. Only use wallets designed to work with the Celo network. Do **not** send your Celo assets to your Ethereum wallet or send your Ethereum assets to your Celo wallet.
{% endhint %}

Users interact with the blockchain by creating signed **transactions.** These are requests to make a change to the ledger. They can: transfer value between accounts; execute a function in a smart contract and pass in arguments \(perhaps causing other smart contracts to be called, update their storage, or transfer value\); or create a new smart contract.

The blockchain is updated by a protocol that takes the current state of the ledger, applies a number of transactions in turn, each of which may execute code and result in updates to the global state. This creates a new **block** that consists of a **header**, identifying the previous block and other metadata, and a data structure that describes the new state.

To avoid Denial-of-Service attacks and ensure termination of calls to smart contract code, the account sending a transaction pays **transaction fees** for its execution steps using its own balance. Transactions specify a **maximum gas** which bounds the steps of execution before a transaction is reverted. A **gas price** determines the unit price for each step, and is used to prioritize which transactions the network applies. \(In Celo transaction fees can be paid in ERC-20 currencies and gas pricing works differently from Ethereum\).

For a more in depth explanation of Ethereum, see the [Ethereum White Paper](https://github.com/ethereum/wiki/wiki/White-Paper) or [documentation](http://ethdocs.org/en/latest/introduction/what-is-ethereum.html#learn-about-ethereum).

### The Celo Stack

Celo is oriented around providing the simplest possible experience for end users, who may have no familiarity with cryptocurrencies, and may be using low cost devices with limited connectivity. To achieve this, Celo takes a full-stack approach, where each layer of the stack is designed with the end user in mind while considering other stakeholders \(e.g. operators of nodes in the network\) involved in enabling the end user experience.

The Celo stack is structured into the following logical layers:

![](https://storage.googleapis.com/celo-website/docs/full-stack-diagram.jpg)

* **Celo Blockchain**: An open cryptographic protocol that allows applications to make transactions with and run smart contracts in a secure and decentralized fashion. The Celo Blockchain code has shared ancestry with [Ethereum](https://www.ethereum.org), and maintains full EVM compatibility for smart contracts. However it uses a [Byzantine Fault Tolerant](http://pmg.csail.mit.edu/papers/osdi99.pdf) \(BFT\) consensus mechanism rather than Proof of Work, and has different block format, transaction format, client synchronization protocols, and gas payment and pricing mechanisms.
* **Celo Core Contracts**: A set of smart contracts running on the Celo Blockchain that comprise much of the logic of the platform features including ERC-20 stable currencies, identity attestations, proof-of-stake and governance. These smart contracts are upgradeable and managed by the decentralized governance process.
* **Applications:** Applications for end users built on the Celo platform. The Celo Wallet app, the first of an ecosystem of applications, allows end users to manage accounts and make payments securely and simply by taking advantage of the innovations in the Celo protocol. Applications take the form of external mobile or backend software: they interact with the Celo Blockchain to issue transactions and invoke code that forms the Celo Core Contracts’ API. Third parties can also deploy custom smart contracts that their own applications can invoke, which in turn can leverage Celo Core Contracts. Applications may use centralized cloud services to provide some of their functionality: in the case of the Celo Wallet, push notifications and a transaction activity feed.

The Celo Blockchain and Celo Core Contracts together comprise the **Celo Protocol**.

### Topology of a Celo Network

The topology of a Celo network consists of machines running the Celo Blockchain software in several distinct configurations:

![](https://storage.googleapis.com/celo-website/docs/network.png)

* **Validators:** Validators gather transactions received from other nodes and execute any associated smart contracts to form new blocks, then participate in a Byzantine Fault Tolerant \(BFT\) consensus protocol to advance the state of the network. Since BFT protocols can scale only to a few hundred participants, and can tolerate at most a third of the participants acting maliciously, a proof-of-stake mechanism admits only a limited set of nodes to this role.
* **Full Nodes:** Most machines running the Celo Blockchain software are either not configured to be, or not elected as, validators. Celo nodes do not do "mining" as in Proof of Work networks. Their primary role is to serve requests from light clients and forward their transactions, for which they receive the fees associated with those transactions. These payments create a ‘permissionless onramp’ for individuals in the community to earn currency. Full nodes maintain at least partial history of the blockchain by transferring new blocks between themselves, and can join or leave the network at any time.
* **Light Clients:** Applications including the Celo Wallet will also run on each user's device an instance of the Celo Blockchain software operating as a ‘light client’. Light clients connect to full nodes to make requests for account and transaction data and to sign and submit new transactions, but they do not receive or retain the full state of the blockchain.

The Celo Wallet application is a fully unmanaged wallet that allows users to self custody their funds using their own keys and accounts. All critical features such as sending transactions and checking balances can be done in a trustless manner using the peer-to-peer light client protocol. However, the wallet does use a few centralized cloud services to improve the user experience where possible, e.g.:

* **Google Play Services:** to pre-load invitations in the app
* **Celo Wallet Notification Service:** sends device push notifications when a user receives a payment or requests for payment
* **Celo Wallet Blockchain API:** provides a GraphQL API to query transactions on the blockchain on a per-account basis, used to implement a users' activity feed.

When an end user downloads the Celo Wallet from, for example, the Google Play Store, users are trusting both cLabs \(or the entity that has made the application available in the Play Store\) and Google to deliver a correct binary, and most users would feel that relying on these centralized services to provide this additional functionality is worthwhile.

## The Celo Protocol

The Celo Blockchain and Celo Core Contracts together comprise the **Celo Protocol**. This term describes both what services the decentralized Celo network provide to applications and the way in which nodes in the network cooperate to achieve this. This section introduces some of these services.

### Consensus and Proof-of-Stake

Celo is a proof-of-stake blockchain. In comparison to Proof of Work systems like Bitcoin and Ethereum, this eliminates the negative environmental impact and means that users can make transactions that are cheaper, faster, and whose outcome cannot be changed once complete.

The Celo Blockchain implements a Byzantine Fault Tolerant \(BFT\) consensus algorithm in which a well-defined set of validator nodes broadcast signed messages between themselves in a sequence of steps to reach agreement even when up to a third of the total nodes are offline, faulty or malicious. When a quorum of validators have reached agreement, that decision is final.

Celo uses a proof-of-stake mechanism for selecting the validator set for a fixed period termed an epoch. Anyone can earn rewards by locking CELO and by participating in validator elections and governance proposals. Initially, the number of validators will be capped to one hundred nodes elected by CELO holders. Validators earn additional fixed rewards in Celo Dollars to cover their costs plus margin.

{% hint style="success" %}
**Roadmap**: Celo is pioneering a [highly scalable, permissionless BFT consensus algorithm](https://medium.com/celohq/bftree-scaling-hotstuff-to-millions-of-validators-7d6930ee046a) that in the long term will result in substantial changes to the proof-of-stake mechanism described here.
{% endhint %}

### On-Chain Governance

Celo uses an on-chain governance mechanism to manage and upgrade aspects of the protocol that reside in the Celo Core Contracts, and for a number of parameters used by the Celo Blockchain. This includes operations like upgrading smart contracts, adding new stable currencies, modifying the reserve target asset allocation, and changing how validator elections are decided.

The Governance contract is set as “owner” for all of the Celo Core Contracts. This allows the protocol to carry out agreed governance proposals by executing code in the context of the Governance contract. Proposals are selected for consideration and voted on by CELO holders using a weighted vote based on the same Locked CELO commitment used to vote to elect validators.

### Ultralight Synchronization

Celo provides extremely fast, secure synchronization to enable light clients to begin to track the current state of the Celo blockchain ledger almost immediately. This means that even wallet users with high latency, low bandwidth, or high cost data tariffs can use Celo.

In Ethereum, verifying whether data received from an untrusted full node really does represent the current state of a blockchain requires fetching every block header ever produced to confirm they form a cryptographically secure chain. A consequence of Celo using a BFT consensus algorithm is that it can do that verification by building a chain only of changes in the validator set, not each individual block.

{% hint style="success" %}
**Roadmap**: Synchronization performance will be further improved with BLS signature aggregation and succinct zero-knowledge proofs, via zk-SNARKs.
{% endhint %}

### Incentives for Operating Full Nodes

In Ethereum, there are few incentives to run a full node that is not mining. Few nodes serve light clients, and this results in a poor experience for mobile wallets.

Celo introduces a scheme that incentivizes users to operate regular nodes. Light clients pay transaction fees to full nodes. Clients include in every transaction the address of a node which, when the transaction is processed, receives the fee. While a full node provides other services for which they receive no specific fee, it is expected that failing to service these requests will cause clients to seek other full nodes that do, who will then receive fees when they next make a transaction.

Since light clients need not trust full nodes, as they can verify their work, this also provides the 'permissionless on-ramp' for users to receive CELO or Celo Dollars without already holding it that is missing in other proof-of-stake networks.

### Stable Cryptocurrencies

Celo enables a family of stablecoins that track the value of any asset, including fiat currencies, commodities, and even natural resources. Stablecoins supported include the Celo Dollar \(cUSD\) and the Celo Euro \(cEUR\), which track the value of the U.S. Dollar and Euro respectively. CELO and a basket of other assets including BTC and ETH serves as the collateral for these stablecoins. These stablecoins are redeemable for CELO, ensuring that transactions can occur quickly, cheaply and reliably on-chain.

Celo's stability mechanism allows users to create a new cUSD and cEUR by sending CELO to the reserve, or burn cUSD and cEUR by redeeming it for their equivalent value in CELO.

This mechanism relies on a series of Oracles, or information feeds from exchanges external to the network, to report the CELO to US Dollar or Euro market rates. To minimize the risk of a run on CELO collateral when these reported values are inaccurate or out-of-date, Celo uses an on-chain constant-product-market-maker model, inspired by the [Uniswap](https://uniswap.io/) system. This mechanism adjusts the redemption price of CELO until either arbitrage occurs \(so that the on-chain price dynamically adjusts until the offered rate meets the external rate\) or Oracles reset the on-chain price.

The Celo protocol ensures that there is sufficient CELO collateral to redeem the amount of CELO in circulation through several sources. These include a [stability fee](celo-codebase/protocol/stability/stability-fees.md) levied on Celo Dollar balances, a transfer from [epoch rewards](celo-codebase/protocol/proof-of-stake/epoch-rewards/community-fund.md#bolstering-the-reserve), plus the proceeds from the spread when interacting with the on-chain market-maker mechanism.

In addition, a back-up reserve of cryptocurrencies is held off-chain. This off-chain reserve is managed to preserve value and minimize volatility by maintaining a diversified portfolio of cryptocurrencies through algorithmic rebalancing trading and periodically "topping-up" the CELO collateral available to ensure it exceeds the amount required to redeem Celo Dollars in circulation. The approved cryptocurrencies, distribution ratios, and rebalancing period are all subject to on-chain governance.

{% hint style="success" %}
**Roadmap**: Celo envisages a number of stable currencies tracking different fiat currencies as well as natural resources such as forests. In addition, once bridges between other chains and the Celo blockchain are fully developed, and liquid trading on decentralized exchanges occurs, the rebalancing can be handled transparently on-chain.
{% endhint %}

### Lightweight Identity

Celo offers a lightweight identity layer that allows users of applications including Celo Wallet to identify and securely transact with other users via their contacts' phone numbers. Celo Wallet enables payments directly to users listed in their device's contacts list.

The Attestations contract allows a user to request attestations to their phone number for a small fee. A secure decentralized source of randomness is used to pick a number of validators that will produce and send via SMS signed secret messages that act as attestations of ownership of the phone number. The user then submits these back to the Attestations contract which verifies them and installs a mapping for the phone number to the user's account.

### Richer Transactions

Celo provides a number of enhancements to regular transactions as familiar to Ethereum developers.

The Celo native asset has a duality as both the native currency and is also an ERC-20 token, simplifying the work of application developers.

{% hint style="warning" %}
Celo assets exist on an independent blockchain, and cannot be accessed through wallets that connect to the Ethereum network. Only use wallets designed to work with the Celo network.
{% endhint %}

In Celo, transaction fees can be paid in stable cryptocurrencies. A user sending Celo Dollars will be able to pay their transaction fee out of their Celo Dollar balance, so they do not need to hold a separate balance of CELO in order to make transactions. The protocol maintains a list of currencies which can be used to pay for transaction fees. These smart contracts implement an extension of the ERC-20 interface, with additional functions that allow the protocol to debit and credit transaction fees.

The Escrow contract allows users to send payments to other users who can be identified by a phone number but don’t yet have an account. These payments are stored in this contract itself and can be either withdrawn by the intended recipient after creating an account and attesting their identity, or reclaimed by the sender.

Transfers between two accounts with associated identities support end-to-end encrypted comments. A comment encrypted to the identity's public key is passed when making the transfer, and included in an event that can be located on the blockchain ledger.

