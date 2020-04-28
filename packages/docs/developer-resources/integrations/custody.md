# Custody

Custody in this section refers to the holding of Celo assets such as Celo Dollar and Celo Gold on behalf of a user. This page lines out information to help you integrate these into your services.

## Balance model

As a fork of Ethereum, Celo retains the account model to keep track of users' balances. Celo Dollar and Celo Gold are [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) contracts. It is common for smart contracts to hold balances on behalf of other addresses. One example is the [`LockedGold`](../../celo-codebase/protocol/proof-of-stake/locked-gold.md) smart contract that holds the "locked portion of a user's `cGLD` balance". Another one is the [`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) smart contract that holds `cGLD` that is being released to a beneficiary address over time according to some schedule.

Applications that display balances may need to be written to be aware of this possibility.

## Transfers

Celo Gold and Celo Dollars implement the ERC20 interface, as will any future core stable Celo currencies. Celo Gold, as the native currency of the network, can also be transferred by specifying the value field of a transaction, in the same way that ETH can be transferred in Ethereum.

## LockedGold

The `LockedGold` contract is part of Celo's [proof-of-stake](/../../celo-codebase/protocol/proof-of-stake/README.md) mechanism. Users can lock Celo Gold by creating an account in the [Accounts smart contract](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L89) and sending it to LockedGold. This allows users to vote in validator elections, receive epoch rewards, and participate in on-chain governance.

There are two ways in which users can vote:

- Directly, by sending voting transactions with the same key used to lock up Celo Gold

- Via an authorized validator signer, which can submit voting transactions on behalf of the account with locked Celo Gold

## ReleaseGold

A common problem in more recent PoS projects is the fact that early token holders have their balances release over time to ensure long-term alignment, yet wanting to have those balances participate in the PoS system to increase the security of the network. For that purpose, many early token balances are released via the [`ReleaseGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGold.sol) contract. Beneficiaries of these contracts can participate in the PoS system by locking/unlocking already-released/to-be-released Celo Gold and authoring voting/validating keys to act on behalf of the beneficiary.

Many users are likely to prefer custodians that support this functionality so that they can maximize their epoch rewards and participate in governance of the network.
