# Valora Accounts

Behind every Valora wallet are two types of accounts: an externally owned account \(EOA\) and a meta-transaction wallet \(MTW\). EOAs are what most people think of when they imagine a blockchain wallet. EOAs are comprised of an ECDSA public/private key pair from which the on-chain address is derived. With Valora, this EOA is generated and stored on the user's mobile device and backed up via the mnemonic phrase. A meta-transaction wallet on the other hand is a smart contract that can be used to interact with other smart contracts on behalf of an EOA. In this case you can think of the MTW as a proxy account and the EOA as the only controller of this account.

## Benefits of a Meta-Transaction Wallet

### Separation of signer and payer

When new users sign up with Valora, most wallets start with an empty balance. This makes it difficult for the user to verify their phone number as they need to pay for both the Celo transactions and the Attestation Service fees \([see here for more details](./)\). To make this experience more intuitive for new users, cLabs operates an [onboarding service called Komenci](https://github.com/celo-org/komenci/) that pays for the transactions on behalf of the user. It does this by first deploying a meta-transaction wallet contract and setting the Valora EOA address as the signer. At this point, the EOA can sign transactions and submit them to Komenci. Komenci will wrap the signed transaction into a meta-transaction, which it pays for and submits to the network.

### Fund Recovery

Meta-transaction wallets can also be useful if a user ever loses their phone and backup account key. Any ERC20 tokens that the EOA has [approved](https://docs.openzeppelin.com/contracts/2.x/api/token/erc20#IERC20-approve-address-uint256-) their meta-transaction wallet to use, can be recovered. In the case of loss of EOA, a new EOA will be created and granted signer rights to the original MTW. This would allow the lost funds to still be accessed, even though the original EOA is unrecoverable. This recovery mechanism hasn't been rolled out yet, but is actively being worked on by cLabs.

## For Wallet Developers

When performing a payment to a Valora wallet, it's important that the address that is receiving funds is the EOA, and not the MTW since funds in the MTW are not displayed or directly accessible to Valora users. To look up a wallet using a phone number:

1. Use ODIS to query the phone number pepper
2. Use the phone number pepper to get the on-chain identifier
3. Use the on-chain identifier to get the account address
4. Use the account address to get the wallet address \(EOA\)

The first two steps are covered extensively in [this guide](../../../developer-guide/contractkit/odis.md).

To get the account address \(step 3\) you can use the [Attestation contract method `lookupAccountsForIdentifier`](https://github.com/celo-org/celo-monorepo/blob/e6fdaf798a662ffe2c12f9a74b28e0fa1c1f8101/packages/sdk/contractkit/src/wrappers/Attestations.ts#L472).

To get the wallet address from the account \(step 4\) you can use the [Account contract method `getWalletAddress`](https://github.com/celo-org/celo-monorepo/blob/e6fdaf798a662ffe2c12f9a74b28e0fa1c1f8101/packages/sdk/contractkit/src/wrappers/Accounts.ts#L318).

It may also be necessary to lookup the data encryption key \(ex. [for comment encryption](../transactions/tx-comment-encyption.md)\). This key can similarly be queried with the account by using the [Account contract method `getDataEncryptionKey`](https://github.com/celo-org/celo-monorepo/blob/e6fdaf798a662ffe2c12f9a74b28e0fa1c1f8101/packages/sdk/contractkit/src/wrappers/Accounts.ts#L310).

You can view a working example of this all tied together in [the `celocli` command `identity:get-attestations`](https://github.com/celo-org/celo-monorepo/blob/master/packages/cli/src/commands/identity/get-attestations.ts).

## For Dapp Developers

### EIP-712

Since all Valora users will have the ability to use a meta-transaction wallet, it's important to keep in mind that transactions may originate from an EOA as well as a smart contract. If your contract relies upon EIP-712 signed typed data, be sure to also support typed data originating from contracts. This data doesn't need to be signed by the msg.sender since it's originating from a contract.

## Implementation

The implementation of Valora's meta-transaction wallet can be [found here](https://github.com/celo-org/celo-monorepo/blob/master/packages/protocol/contracts/common/MetaTransactionWallet.sol).

