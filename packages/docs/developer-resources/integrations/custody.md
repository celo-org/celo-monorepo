# Custody

This section is intended for Custodians, Exchanges, and other services that intend to custody Celo assets such as Celo Dollar and Celo Gold on behalf of a user. Generally speaking, custodying Celo Gold (cGLD), the native token on the Celo network, requires understanding the various states that cGLD can exist in at any time. This is to provide useful services beyond custody such as allowing users to lock up their cGLD and vote with it. Many of these "states" are implemented as smart contracts, and involve sending cGLD from a user owned account to a contract address. Thus, in order to be able to show a user's true balance, services need to be able to observe every balance changing operation and reconcile cGLD balances from all the various contracts and states cGLD can be in.

## Balance Model

As a fork of Ethereum, Celo retains the account model to keep track of users' balances. Celo Dollar and Celo Gold are [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) contracts. As mentioned previously, it is common for smart contracts to hold balances on behalf of other addresses. One example is the [`LockedGold`](../../celo-codebase/protocol/proof-of-stake/locked-gold.md) smart contract that holds the "locked portion of a user's `cGLD` balance". Another one is the [`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) smart contract that holds `cGLD` that is being released to a beneficiary address over time according to some schedule.

Applications that display balances may need to be written to be aware of this possibility.

## Transfers

Celo Gold and Celo Dollars implement the ERC20 interface, as will any future core stable Celo currencies. Celo Gold, as the native currency of the network, can also be transferred by specifying the value field of a transaction, in the same way that ETH can be transferred in Ethereum. Therefore, for cGLD, application developers should be aware that transactions can be specified in both ways.

## cGLD State Machine

Celo Gold as described previously can also exist in various states that represent a specific user behavior. For example, if a user wants to lock gold to either participate in consensus directly or vote, that cGLD will be sent to the `LockedGold` smart contract. To understand the high level flow, please read [this description of the various states cGLD can exist in](../../celo-codebase/protocol/proof-of-stake/locked-gold#locking-and-voting-flow). The diagram below may also help to visualize the flows between states, and the function calls required to transfer the balance from one state to another.

<TODO: insert image>

## Smart Contracts

The following smart contracts are helpful to understand in order to map the conceptual states to actual accounts and function calls

### Accounts

[Accounts.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol) allows the mapping of an address to an account in storage, after which all further functionality (locking, voting, etc.) can be accessed. 

The [createAccount](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L103) function indexes the address as an account in storage, and is required to differentiate an arbitrary key-pair from a user-owned account in the Celo network.

The Accounts contract also allows for the authorization of various signer keys, such as a [vote signer key](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L175). This allows for the user who owns the primary account key to authorize a separate key that can only vote on behalf of the account. This allows for the ability to custody keys in a manner corresponding to their exposure or "warmth". Eg. the primary account private key can be kept in cold storage after authorizing the signer keys, which can be in warmer environments, and potentially more exposed to the network. See the key management 

### LockedGold

The `LockedGold` contract is part of Celo's [proof-of-stake](/../../celo-codebase/protocol/proof-of-stake/README.md) mechanism. Users can lock Celo Gold by creating an account in the [Accounts smart contract](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L89) and sending it to LockedGold. This allows users to vote in validator elections, receive epoch rewards, and participate in on-chain governance.

There are two ways in which users can vote:

- Directly, by sending voting transactions with the same key used to lock up Celo Gold

- Via an authorized validator signer, which can submit voting transactions on behalf of the account with locked Celo Gold

### Election

### ReleaseGold

A common problem in more recent PoS projects is the fact that early token holders have their balances release over time to ensure long-term alignment, yet wanting to have those balances participate in the PoS system to increase the security of the network. For that purpose, many early token balances are released via the [`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) contract. Beneficiaries of these contracts can participate in the PoS system by locking/unlocking already-released/to-be-released Celo Gold and authoring voting/validating keys to act on behalf of the beneficiary.

Many users are likely to prefer custodians that support this functionality so that they can maximize their epoch rewards and participate in governance of the network.

## Tracing

Since monitoring balance changing operations is important to be able to display user balances properly, it can be helpful to use a tracing or reconciling system. Several tools exist to help application developers with this process:

- Tracer
- Rosetta
