# @celo/contractkit

## 5.2.1-beta.0

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
