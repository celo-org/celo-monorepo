# Key Usage in Protocol

### Celo Registry Contracts

`Accounts` Entrypoint for users to create an account and authorize _unique_ addresses which correspond to signing keys

- requires user is _not_ a validator if authorizing Validator key and _not_ updating ECDSA public key
- requires user is a validator if authorizing Validator key and updating ECDSA public key

`LockedGold` Expects user to be registered account signing with Account key

`Governance` Expects user to be registered account signing with Vote key (or account key)

`Election` Expects user to be registered account signing with Vote key (or account key)

`Validators` Expects user to be registered account signing with Validator key (or account key)

`Attestations` Expects issuers to be registered accounts; expects completers to be signing with Attestation key (or account key)

### Celo Blockchain Client

`Consensus` Expects participants to be registered accounts and signing with Validator key

`Precompiles` Keeps track of current validator set and proof of possession using authorized Validator key addresses
