# Celo for Ethereum Developers

For a general overview of the Celo network and architecture, see [the Celo Overview page](../overview.md).

## What is Celo's Relationship to Ethereum?

Celo is a layer 1 protocol and blockchain platform, and the Celo Mainnet is entirely separate from the Ethereum network.
While the Celo client originated as a fork of Ethereum Go langauge client, [go-ethereum](https://github.com/ethereum/go-ethereum) (or geth), it has several significant differences, including a proof-of-stake based PBFT consensus mechanism. All the cryptoassets on Celo have ERC-20 compliant interfaces, meaning that while they are not ERC-20 tokens on the Ethereum Mainnet, all familiar tooling and code that support ERC-20 tokens can be easily adapted for Celo assets, including the Celo Native Asset (CELO) and the Celo Dollar (cUSD). 

In terms of programmability, Celo is similar to Ethereum. Both networks run the Ethereum Virtual Machine (EVM) to support smart contract functionality. 
This means that all programming languages, developer tooling and standards that target the EVM are relevant for both Celo and Ethereum. 
Developers building on Celo can write smart contracts in [Solidity](https://solidity.readthedocs.io/en/latest/), use [Truffle](https://www.trufflesuite.com/) for smart contract management and 
take advantage of smart contract standards that have already been developed for Ethereum.

## The ERC-20 Token Standard

The [ERC20 token standard](https://eips.ethereum.org/EIPS/eip-20) is a standard API for tokens within smart contracts. 
This standard interface allows any tokens to be re-used by different applications. 
The ERC20 token standard is blockchain agnostic, so ERC20 tokens can be implemented on any blockchain.

The standard includes the __*optional*__ functions

```javascript
function name() public view returns (string)
function symbol() public view returns (string)
function decimals() public view returns (uint8)
```

and the __*required*__ functions

```javascript
function totalSupply() public view returns (uint256)
function balanceOf(address _owner) public view returns (uint256 balance)
function transfer(address _to, uint256 _value) public returns (bool success)
function transferFrom(address _from, address _to, uint256 _value) public returns (bool success)
function approve(address _spender, uint256 _value) public returns (bool success)
function allowance(address _owner, address _spender) public view returns (uint256 remaining)
```

and includes the following events

```js
event Transfer(address indexed _from, address indexed _to, uint256 _value)
event Approval(address indexed _owner, address indexed _spender, uint256 _value)
```

An ERC20 compliant contract must include the required functions and events at *minimum*. 
It can include additional functions and events and still be ERC20 compliant.

## The Celo Native Asset and the Celo Dollar

This interface is relevant for two important assets on the Celo network, the Celo native asset (CELO) and the Celo Dollar (cUSD).

CELO was called Celo Gold (cGLD) when the contract was deployed, so you will often see references to Celo Gold in the codebase. 
CELO and cGLD are the same thing. You can [view the CELO implementation here.](https://explorer.celo.org/address/0x8dd4f800851db9dc219fdfaeb82f8d69e2b13582/contracts)

CELO has an ERC20 interface, so users can interact with CELO via the token standard, but it is important to note that not all CELO transfers are required to go through the token contract. 
CELO can also be transferred by specifying the value field of a transaction, in the same way that ETH can be transferred in Ethereum. 
To properly monitor balance changing operations of CELO, it can be helpful to use [Celo Rosetta.](https://github.com/celo-org/rosetta)
Celo Rosetta provides an easy way to obtain changes that are not easily queryable using the celo-blockchain RPC. 

The Celo Dollar (cUSD) is implemented solely as a smart contract, so all cUSD actions are mediated by the smart contract. 
You can [view the implementation here.](https://explorer.celo.org/address/0xaa933baf03cfc55b8e4e0d7de479bcc12f189352/contracts)

## Key differences between Celo and Ethereum

### Features exclusive to Celo

 1. Celo allows users to pay transaction fees in cryptoassets other than the native asset. On Ethereum, users must pay transaction fees in Ether. For example, users can send cUSD, and then pay any transaction fees in cUSD as well.
 2. The Celo protocol uses BFT Proof-of-Stake for maintaining consensus. This allows blocks on Celo to be created in 5 seconds, as compared to ~12+ seconds on Ethereum. In addition, all blocks are finalized immediately, so there is no need to wait for more than 1 block confirmation to ensure that a transaction won't be reverted.

### Things to watch out for

 1. As previously mentioned, CELO transfers are not required to happen via the ERC20 interface. A user's CELO balance may change without any interaction with the CELO contract, as they may transfer CELO natively.

 2. Celo transaction objects are slightly different from transaction objects on Ethereum. 
 Ethereum transaction objects include fields to, value, gas, gasPrice, data, nonce, signature (v,r,s). 
 Celo transaction objects include the same fields as Ethereum transaction objects, plus feeCurrency, gatewayFee and gatewayFeeRecipient. 
 These additional fields are included to provide [full node incentives](../overview.md#incentives-for-operating-full-nodes) 
 and to allow users to [pay transaction fees in different currencies.](../overview.md#richer-transactions) 

 3. You can’t use Ethereum wallets with Celo.
    1. Celo accounts are derived differently from Ethereum accounts. The Celo key derivation path is `m/44'/52752'/0'/0` whereas Ethereum’s is `m/44'/60'/0'/0`.
    2. Wallets are used to sign transactions. Ethereum transaction signing tools, like those found in wallets, are designed for signing Ethereum transactions, which are different from Celo transactions. 
