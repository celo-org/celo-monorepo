# Custody

Custody in this section refers to the holding of Celo assets such as Celo Dollar and Celo Gold on behalf of a user. This page lines out information to help you integrate these into your services.

## Balance model

As a fork of Ethereum, Celo retains the account model to keep track of users' balances. Celo Dollar and Celo Gold are [ERC20](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md) contracts. Thus it is easy and common for smart contracts to have balances on the token contracts in another account's association. An example is the [`LockedGold`](celo-codebase/protocol/proof-of-stake/locked-gold) smart contract that holds the "locked portion of a user's `cGLD` balance". Another one is the [`ReleasingGold`](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/governance/ReleaseGoldInstance.sol) smart contract that holds `cGLD` that is being released over time to some schedule.

It is up you to decide how you would like to represent a user's "balance" in your service.

## Transfers

Since all Celo assets are implementing an ERC-20 like interface, transfers can be done simply with the `transfer` function. Celo Gold is special as the native currency of the network, and can thus be transfered (in addition to the ERC20 interface) by specifying the `value` field of the transaction, similarly to `ETH` in Ethereum. Transfers to smart contracts can often be accomplished via the `approve/transferFrom` method, or via `value` in the case of contracts such as `LockedGold`.

## LockedGold

The `LockedGold` contract is part of Celo's [Proof of Stake system] to allow users to vote in validator elections, receive rewards for doing so and participate in on-chain governance. `Celo Gold` can be transferred to the `LockedGold` contract and be voted with (after [creating an account](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L89) on the `Accounts` smart contract). There are two ways through which you can support your users' voting in the validator elections:

**Direct voting**:
In your service, you can list eligible validator groups and then have users vote directly in your UI by submitting the relevant transactions (such as voting/activating/revoking) from your side.

**Voting key delegation**:
Any account on the [Accounts smart contract](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/Accounts.sol#L13) can designate an authorized vote signer which can submit the voting transactions on behalf of the account. In this scenario, your service would only have to expose the authorizing of the voting key to the user, and then the user would be responsible for submitting the voting transactions themselves.

Voting on governance proposals is similar.

## ReleasingGold

A common problem in more recent PoS projects is the fact that early token holders have their balances release over time to ensure long-term alignment, yet wanting to have those balances participate in the PoS system to increase the security of the network. For that purpose, many early token balances are released via the `ReleasingGold` contract. Beneficiaries of these contracts can participate in the PoS system by locking/unlocking already-released/to-be-released Celo Gold and authoring voting/validating keys to act on behalf of the beneficiary.

Custodians of benefiaries will want to support this functionality to increase the security of the network.



