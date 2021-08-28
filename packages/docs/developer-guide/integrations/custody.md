# Custody

This section is intended for Custodians, Exchanges, and other services that intend to custody Celo assets such as Celo Dollar and CELO on behalf of a user. Generally speaking, custodying CELO, the native token on the Celo network, requires understanding the various states that CELO can exist in at any time. This is to provide useful services beyond custody such as allowing users to lock up their CELO and vote with it. Many of these "states" are implemented as smart contracts, and involve sending CELO from a user owned account to a contract address. Thus, in order to be able to show a user's true balance, services need to be able to observe every balance changing operation and reconcile CELO balances from all the various contracts and states CELO can be in.

## Balance Model

As a fork of Ethereum, Celo retains the account model to keep track of users' balances. Celo Dollar and CELO implement the [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) interface. As mentioned previously, it is common for smart contracts to hold balances on behalf of other addresses. One example is the [`LockedGold`](../../celo-codebase/protocol/proof-of-stake/locked-gold.md) smart contract that holds the "locked portion of a user's `CELO` balance". Another one is the [`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) smart contract that holds `CELO` that is being released to a beneficiary address over time according to some schedule.

{% hint style="warning" %}
Celo assets assets exist on an independent blockchain, and although they implement the ERC20 interface, they cannot be accessed through wallets that connect to the Ethereum network. Wallets and other integrations must connect to the Celo network to transfer tokens on Celo.
{% endhint %}

Applications that display balances may need to be written to be aware of this possibility.

## Transfers

CELO and Celo Dollars implement the ERC20 interface, as will any future core stable Celo currencies. CELO, as the native currency of the network, can also be transferred by specifying the value field of a transaction, in the same way that ETH can be transferred in Ethereum. Therefore, for CELO, application developers should be aware that transactions can be specified in both ways.

## CELO State Machine

CELO as described previously can also exist in various states that represent a specific user behavior. For example, if a user wants to lock CELO to either participate in consensus directly or vote, that CELO will be sent to the `LockedGold` smart contract. To understand the high level flow, please read [this description of the various states CELO can exist in](../../celo-codebase/protocol/proof-of-stake/locked-gold.md#locking-and-voting-flow).

## Smart Contracts

The following smart contracts are helpful to understand in order to map the conceptual states to actual accounts and function calls.

### Accounts

[Accounts.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol) allows the mapping of an address to an account in storage, after which all further functionality \(locking, voting, etc.\) can be accessed.

The [`createAccount`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L103) function indexes the address as an account in storage, and is required to differentiate an arbitrary key-pair from a user-owned account in the Celo network.

The `Accounts` contract also allows for the authorization of various signer keys, such as a [vote signer key](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L175). This allows for the user who owns the primary account key to authorize a separate key that can only vote on behalf of the account. This allows for the ability to custody keys in a manner corresponding to their exposure or "warmth". Eg. the primary account private key can be kept in cold storage after authorizing the signer keys, which can be in warmer environments, and potentially more exposed to the network. See the [key management guide](../../validator-guide/summary/detailed.md) for more details.

### LockedGold

[LockedGold.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/LockedGold.sol), which references Celo Gold, the deprecated name for the native token, is used as part of Celo's [proof-of-stake](https://github.com/celo-org/celo-monorepo/tree/28a278430981d03332111eae1d15a00b88c1dc16/celo-codebase/protocol/proof-of-stake/README.md) mechanism. Users can lock CELO by sending it to the `LockedGold` contract after creating an account via the `Accounts` contract as described above. This allows users to vote in validator elections, receive epoch rewards, and participate in on-chain governance.

There are two ways in which users can vote:

* Directly, by sending voting transactions with the same key used to lock up CELO
* Via an authorized vote signer, which can submit voting transactions on behalf of the account with locked CELO

`LockedGold` has a mapping of addresses to `balances` which is a [type](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/LockedGold.sol#L26) that contains both the `nonvoting` amount of CELO as well as `pendingWithdrawals`, which contain values corresponding to timestamps at which they can be withdrawn. The reason for the latter is because all locked CELO has an unlocking period that is [set at time of contract initialization](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/LockedGold.sol#L78), which is 3 days in the Celo network's deployed `LockedGold` contract. Hence, if users unlock CELO in tranches, multiple pending withdrawals could exist at once. Once the timestamp has eclipsed, CELO can be [withdrawn back to the user's address](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/LockedGold.sol#L193).

### Election

Once CELO has been locked via `LockedGold`, it can then be used to vote for validator groups. [Election.sol](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Election.sol) is the contract that manages this functionality.

The `votes` in this contract are tracked by a [Votes type](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Election.sol#L87) which has `pending`, `active`, and `total` votes. Pending votes are those that have been cast for a validator group, and active votes are those that have been activated after an epoch, meaning that these votes generate voter rewards.

Votes are cast for a validator group using the [`vote` function](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Election.sol#L229). This increments the `pending` and `total` votes in the `Election` contract, and decrements the equivalent amount of CELO from the `nonvoting` balance in the `LockedGold` contract, for the associated account.

The [`activate` function](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/Election.sol#L263) can then be called to shift `pending` votes into `active` votes in a following epoch. Votes in either state can then be revoked, which decrements votes from the `Election` contract and returns them to the `LockedGold` balance for the associated account. Users can revoke votes at any time and this takes effect instantly.

### ReleaseGold

A common problem in other proof-of-stake protocols is the tension between wanting early token holders' balances to release over time to ensure long-term alignment, while also wanting them to be able to participate in consensus to increase the security of the network. To bridge both goals, many early token balances in the Celo network are released via the [`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) contract. Beneficiaries of these contracts can then participate in the proof-of-stake system by staking and voting with CELO that has not yet been "released" for transfers. Please find more high level information about the `ReleaseGold` contract [here](../../celo-owner-guide/release-gold.md).

From a technical perspective, `ReleaseGold` can be thought of as a "puppet" account controlled by the "puppeteer", or the beneficiary private key corresponding to the `beneficiary` address in the contract. This beneficiary key can then authorize validator signer and vote signer keys that can then call respective functions associated with validating or voting. Most of the required function calls described above can be made by the signer keys directly to the `LockedGold` or `Election` contracts associated with the `ReleaseGold` account. However, some functions in the `ReleaseGold` contract are proxied to the underlying `LockedGold` or `Election` contracts, and have a separate function signature that can be called by the `beneficiary` address. Notably:

* [`createAccount`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol#L669)
* [`authorizeVoteSigner`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol#L525) and similar functions for other signer keys
* [`lockGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol#L469) and [`unlockGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol#L477)

Notice that all these functions have corresponding functions that are called on the underlying contract. The `ReleaseGold` contract can then just be thought of as brokering the transaction to the correct place, when necessary.

## Other Balance Changing Operations

In addition to transfers \(both native and ERC-20\) and locking / voting flows affecting user balances, there are also several additional Celo network features that may cause user balances to change:

* Gas fee payments: the fee paid by transaction senders to use the network
* Tobin tax: a tax on CELO transfers when the reserve balance is low and needs to be repleted
* Epoch rewards distribution: reward payments to voters, validators, and validator groups

Some of these may occur as events rather than transactions on the network, and therefore when updating balances, special attention should be paid to them.

## Useful Tools

Since monitoring balance changing operations is important to be able to display user balances properly, it can be helpful to use a tracing or reconciling system. [Celo Rosetta](https://github.com/celo-org/rosetta) is an RPC server that exposes an API to query the Celo blockchain, obtain balance changing operations, and construct airgapped transactions. With a special focus on getting balance change operations, Celo Rosetta provides an easy way to obtain changes that are not easily queryable using the celo-blockchain RPC.

