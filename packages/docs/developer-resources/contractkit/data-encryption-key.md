# Data Encryption Key

An account may register a data encryption key (DEK) that can be used for lightweight signing or encryption operations. Some examples of DEK usage are:

1. Supporting private payment comments between two users
2. Signing authentication headers to the Oblivious Decentralized Identifier Service
3. Sharing profile picture and name privately between two users

Most Valora users automatically register a DEK with their wallet when they go through the onboarding flow. The DEK can be set during account creation or registered after as follows:

```ts
  const accountWrapper: AccountsWrapper = await contractKit.contracts.getAccounts()
  const setKeyTx = accountWrapper.setAccountDataEncryptionKey(dekPublicKey)
```

When using the DEK, it's important to check that the DEK is the latest that's registered for a user. This can be done by querying the account contract and comparing the resulting public key with the key that's expected.

```ts
  // Query the on-chain data encryption key for a user
  const accountWrapper: AccountsWrapper = await contractKit.contracts.getAccounts()
  const dataEncryptionKey = accountWrapper.getDataEncryptionKey(address)
  // Check that this matches with the public key
  ...
```
