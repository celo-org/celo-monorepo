# Checklist

This page serves as a checklist for applications building and integrating on Celo. Using common features and standards across applications in the Celo ecosystem will lead to a superior user experience.

## General

### Addresses

Addresses are identical to Ethereum addresses. When displaying and asking for user-inputted addresses, consider using and validating address checksums following the [EIP55 standard](https://github.com/ethereum/EIPs/blob/master/EIPS/eip-55.md) to detect typos.

For core smart contracts, developers are highly encouraged to use the Registry to reference the contracts in case they will have to be repointed \(via Governance\)

### QR Codes

Celo has [WIP QR code standard CIP16](https://github.com/celo-org/celo-proposals/pull/40) that aims to standardize how applications can ask wallets for transactions to avoid the user having to manually copy/paste addresses and other transaction metadata.

## Custodian/Exchange

Please read more under [Custody](custody.md), but here is a shortened version:

### Detect Transfers

Stable-value currencies, currently cUSD and cEUR, are contracts, `StableToken` and `StableTokenEUR` respectively, that can be accessed via the ERC20 interface. The native asset CELO can be accessed via the `GoldToken` ERC20 interface, or natively, similar to ETH on Ethereum.

Addresses for those contracts can be found by querying the [registry](../contractkit/contracts-wrappers-registry.md) or in the [Listing Guide](listings.md).

### Proof of Stake

Users may want to participate in Celo's Proof of Stake system to help secure the network and earn rewards.

### Authorized Signers

Celo's core smart contracts use Celo's `Accounts` abstraction to allow balance-moving keys to be held in cold storage, while other keys can be authorized to vote and be held in warm storage or online.

### Release Gold

There is an audited `ReleaseGold` smart contract which allows for the release of CELO over a set schedule through which CELO might be distributed to a user.

## Wallets

These suggestions apply to any application that custodies a key and allows users to interact and transfer value on the Celo platform.

### Key Derivation

Celo wallets should follow the [BIP44](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki) for deriving private keys from [BIP39 mnemonics](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki). Celo's key derivation path is at `m/44'/52752'/0'/0`. The first key typically is the `account key` that wallets should register themselves with and accept balance transfers on. The second key can be derived to be an account's `dataEncryptionKey` to allow other users on Celo to encrypt information to.

### Identity Protocol

Celo has a [lightweight identity protocol](https://github.com/celo-org/celo-monorepo/tree/2b8484b0991482a7a1a296629c4c65a577fb57ef/celo-codebase/protocol/identity/README.md) that allows users to address each other via their phone number instead of addresses that Celo wallets should implement. Since user privacy is important, Celo wallets should leverage the built-in [Phone Number Privacy protocol](https://github.com/celo-org/celo-monorepo/tree/2b8484b0991482a7a1a296629c4c65a577fb57ef/celo-codebase/protocol/identity/phone-number-privacy/README.md) to protect against large-scale harvesting of user phone numbers.

### Wallet Address

When transferring assets to an account, wallets should check the receiving account's `walletAddress` at which they want to receive funds at. Use cases might be smart contract accounts that want different recovery characteristics, but receive funds at a different address. Also, `walletAddresses` of `0x0` should indicate that the account requires a different mechanism to acquire the `walletAddress`.

### Transaction metadata

cUSD \(aka StableToken\) adds an additional method to the ERC20 interface called `transferWithComment` which allows senders to specify an additional comment that Celo wallets should support. Additionally, comments should be encrypted to the `dataEncryptionKey` when applicable.

### Dappkit

The Celo ecosystem relies on a diverse set of applications to be built so that users can interact with them. To ensure interoperability and avoid fragmentation due to proprietary interfaces, wallets should be implementing the deeplink-based dappkit to have a consistent interface for dapp developers to implement.

## Validator Group Explorers

[Validator Group Explorers](../../celo-owner-guide/voting-validators.md#validator-explorers) are critical to Celo's Proof of Stake system. Explorers will consider using the following standards to provide a minimum experience across all explorers.

### Names

All Celo accounts on `Accounts.sol` can claim any name they want. While explorers should display it, they should also be cognizant of the fraud potential.

### Identities

Celo accounts can make claims to existing identities, some of which are verifiable \(Domain Names or Keybase profiles\). Explorers should consider displaying those identities to reduce the potential for impersonation.

### Performance indicators

Validator Groups and their validators can perform their duties differently and explorers should reflect that to allow voters to ensure an optimal validator set. While uptime in the form of block signatures by the validators ultimately affect rewards, explorers should also consider displaying [other metrics](../../celo-owner-guide/voting-validators.md#choosing-a-validator-group) that impact the success of the Celo ecosystem, such as validators' performance in the identity protocol.

