# Glossary

Account
: Identifies an account on Celo. There are two types of account. **Externally owned accounts** have an associated Celo Gold balance and are controlled by a user holding the associated public-private keypair. **Contract accounts** contain the code and data of a single smart contract which can be called and manipulate its own stored data.

Address
: A unique identifier for an account on the Celo blockchain.

Alfajores
: The first public Celo test network.

Block
: The unit of update to the blockchain. A block consist of a header identifying its position in the chain and other metadata,and a list of transactions, and data structures that describe the new state after executing those transactions.

Blockchain
: A database maintained by a distributed set of computers that do not share a trust relationship or common ownership. This arrangement is referred to as decentralized. The content of a blockchain's database, or ledger, is authenticated using cryptographic techniques, preventing its contents being added to, edited or removed except according to a protocol operated by the network as a whole.

C Labs, Celo Labs
: The team currently leading the development of the Celo protocol and Celo Wallet application.

Celo
: An open platform that makes financial tools accessible to anyone with a mobile phone.

Celo Gold
: Celo's native unit of accounting. The cryptocurrency Celo Gold is equivalent to Ether in Ethereum but is is also an ERC-20 token.

Client
: An instance of the Celo Blockchain software.

Consensus
: An algorithm that enables multiple computers to reach a decision on a single value proposed by one of them, despite network or computer failures.

ContractKit
: A library to help developers and operators of Validator nodes interact with the Celo Blockchain and Celo Core Contracts.

DApp
: Short for Decentralized Application. An application, usually a mobile application, which to deliver its functionality connects to a decentralized network like Celo, rather than to centralized services in a single organization's data centers.

DAppKit
: A lightweight set of functions in the Celo Wallet that allow other mobile DApps to use the Celo Blockchain node bunded with the Celo Wallet to sign transactions and access the user's address.

DeFi
: Decentralized Finance; open source software and networks without intermediaries in the financial space.

ERC-20
: A standard interface for implementing cryptocurrencies or tokens as contracts, rather than via account balances.

Ethereum
: A project with which the code of the Celo Blockchain has shared ancestry, [Ethereum](https://www.ethereum.org) facilitates building general-purpose decentralized applications.

EVM
: The Ethereum Virtual Machine. A runtime environment used by smart contracts on Ethereum and Celo.

Full Node
: A computer running the Celo Blockchain software that maintains a full copy of the blockchain locally and, in Celo, receives transaction fees in exchange for servicing light clients.

Gas
: A step of execution of a smart contract. Different operations consume different amounts of gas. To prevent denial-of-service attacks, transactions specify a **maximum gas** which bounds the steps of execution before a transaction is reverted.

Gas Price
: Determines the unit price for gas, i.e. cost for a transaction to perform one step of execution. This is used to prioritize which transactions the network applies.

Geth
: [go-ethereum](https://github.com/ethereum/go-ethereum), a Golang implementation of the Ethereum protocol from which the Celo Blockchain software is forked.

Light Client
: A device or computer running the Celo Blockchain software that keeps typically only the most recent blockchain state, such that it can send transactions and identify what other data to request as necessary. Every Celo Wallet installation includes a Celo Blockchain light client.

Savings Circle
: A common practice in societies without easy access to banking (source); a peer-to-peer savings and loan group

SDK
: Software Development Kit. Generally, a suite of developer tools that enable applications to be built on a platform. Celo's SDK currently comprises two components, DAppKit and ContractKit.

Smart Contracts
: Programs that are deployed to a blockchain and execute on its nodes. They operate on data on the blockchain, and on external inputs received in transactions or messages to the blockchain, and may update the state of the blockchain, including account balances. On Celo and Ethereum, smart contracts are written in languages like [Solidity](https://solidity.readthedocs.io/en/v0.5.10/).

Transaction
: Requests to make a change to the state of the blockchain. They can: transfer value between accounts; execute a function in a smart contract and pass in arguments \(perhaps causing other smart contracts to be called, update their storage, or transfer value\); or create a new smart contract.

Validator
: A computer running the Celo Blockchain software that is ready (if elected) to partipate in the Byzantine Fault Tolerant consensus algorithm to agree new blocks to append to the blockchain ledger.

Wallet
: A DApp that allows a user to manage an account, and usually stores the associated private key.
