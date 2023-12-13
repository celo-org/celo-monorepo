# @celo/contractkit

## 6.0.0

### Major Changes

- 1c9c844cf: Remove contracts from lib/generated. now available in @celo/abis package at @celo/abis/web3

## 6.0.0-beta.2

### Patch Changes

- ba27783ae: Revert removal of Contracts

## 6.0.0-beta.1

### Major Changes


- 9ab9d00eb: Remove Support for deprecated MetaTransactionWallet and MetaTransactionWalletDeployer. IF absolutely needed the contracts can be accessed directly or an alternative such as account abstraction should be used
- 9ab9d00eb: Removes Grandamento from cli and contractkit completely as it has become no op by mento team

## 6.0.0-beta.0

### Major Changes

- 1c9c844cf: Remove contracts from lib/generated. now available in @celo/abis package at @celo/abis/web3

  If you were directly importing contracts from `@celo/contractkit/lib/generated/*` eg `@celo/lib/generated/Accounts` do a find replace

  find: `@celo/contractkit/lib/generated/`
  replace: `@celo/abis/web3/`

## 5.2.1

### Patch Changes

- 88e3788b8: add notice that LockedGold.getTotalPendingWithdrawalsCount is not yet available on all networks
- 70f600bb0: Mark MetaTransactionWallet and MetaTransactionWalletDeployer as deprecated, including functions to get them and their wrappers. see https://github.com/celo-org/celo-monorepo/issues/10766
- 2985f9eb2: Refactor Accounts.getParsedSignatureOfAddress

## 5.2.0

### Minor Changes

- add FeeHandler Wrapper
- 32face3d8: Governance delegation functions added
- 87647b46b: Add multisig:approve command to CLI, expose MultiSig.confirmTransaction in ContractKit.

### Patch Changes

- Updated dependencies [679ef0c60]
- Updated dependencies [97d5ccf43]
  - @celo/connect@5.1.1
  - @celo/base@6.0.0
  - @celo/utils@5.0.6
  - @celo/wallet-local@5.1.1

## 5.2.0-beta.0

### Minor Changes

- add FeeHandler Wrapper
- 32face3d8: Governance delegation functions added
- 87647b46b: Add multisig:approve command to CLI, expose MultiSig.confirmTransaction in ContractKit.

### Patch Changes

- Updated dependencies [97d5ccf43]
  - @celo/base@6.0.0-beta.0
  - @celo/connect@5.1.1-beta.0
  - @celo/utils@5.0.6-beta.0
  - @celo/wallet-local@5.1.1-beta.0

## 5.1.0

### Minor Changes

- d48c68afc: Add MultiSig.getTransaction() now optionally takes a second boolean param to avoid fetching confirmations information
- d48c68afc: Add method getConfirmations() to Multisig Wrapper
- 53bbd4958: Add cip64 support for feeCurrency Transactions. Note this is the replacement for the deprecated cip42 and legacy tx types https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip/0064.md

### Patch Changes

- 53bbd4958: Note celo sdk packages will no longer be fix bumped (ie will not share the same version always) and will now use ^range when depending on each other
- d48c68afc: parallelize async calls in Governance Wrapper
- Updated dependencies [d48c68afc]
- Updated dependencies [53bbd4958]
- Updated dependencies [53bbd4958]
  - @celo/connect@5.1.0
  - @celo/wallet-local@5.1.0
  - @celo/utils@5.0.5
  - @celo/base@5.0.5

## 5.1.0-beta.0

### Minor Changes

- d48c68afc: Add MultiSig.getTransaction() now optionally takes a second boolean param to avoid fetching confirmations information
- d48c68afc: Add method getConfirmations() to Multisig Wrapper
- 53bbd4958: Add cip64 support for feeCurrency Transactions. Note this is the replacement for the deprecated cip42 and legacy tx types https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip/0064.md

### Patch Changes

- 53bbd4958: Note celo sdk packages will no longer be fix bumped (ie will not share the same version always) and will now use ^range when depending on each other
- d48c68afc: parallelize async calls in Governance Wrapper
- Updated dependencies [d48c68afc]
- Updated dependencies [53bbd4958]
- Updated dependencies [53bbd4958]
  - @celo/connect@5.1.0-beta.0
  - @celo/wallet-local@5.1.0-beta.0
  - @celo/utils@5.0.5-beta.0
  - @celo/base@5.0.5-beta.0
