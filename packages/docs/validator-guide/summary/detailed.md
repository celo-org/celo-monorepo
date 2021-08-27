# Detailed Role Descriptions

This page provides a detailed description of the various account roles found in the Celo protocol, as well as small examples of how to designate an account as playing a particular role.

## Celo Accounts

Any private key generated for use in the Celo protocol has a corresponding address. The account address is the last 20 bytes of the hash of the corresponding public key, just as in Ethereum. Celo account keys can be used to sign and send transactions on the Celo network.

Celo Accounts can be designated as Locked Gold Accounts or authorized as signer keys on behalf of a Locked Gold Account by sending special transactions using [celocli](../../command-line-interface/introduction.md). Note that Celo accounts that have not been designated as Locked Gold Accounts or authorized signers may not be able to send certain transactions related to proof-of-stake.

## Locked Gold Accounts

[Locked Gold](../../celo-codebase/protocol/proof-of-stake/locked-gold.md) Account keys have the highest level of privilege in the Celo protocol. These keys can be used to lock and unlock CELO in order to be used in proof-of-stake. Furthermore, Locked Gold Account keys can be used to authorize other keys to sign transactions and messages on behalf of the Locked Gold Account.

In _most_ cases, the Locked Gold Account key has all the privileges as any authorized signers. For example, if a voter signer is authorized, a user can place votes on behalf of the Locked Gold Account with both the authorized vote signer _and_ the Locked Gold Account.

Because of the significant priveleges afforded to the Locked Gold Account, it is best to store this key securely and access it as infrequently as is possible. Authorizing other signers is one way to minimize how frequently you need to access your Locked Gold Account key. The Locked Gold Account key will only be used to send transactions and **can be stored on a Ledger hardware wallet.**

### Creating a Locked Gold Account

A Celo account may be designated as a Locked Gold Account by running the following command:

```text
# Designate the Celo account as a Locked Gold Account
celocli account:register --from $ADDRESS_TO_DESIGNATE --useLedger

# Confirm the address was designated as a Locked Gold Account
celocli account:show $ADDRESS_TO_DESIGNATE
```

Note that [ReleaseGold](../../celo-owner-guide/release-gold.md) beneficiary keys are considered vanilla Celo accounts with respect to proof-of-stake, and that the `ReleaseGold` contract address is what ultimately gets designated as a Locked Gold Account.

## Authorized Vote Signers

Any Locked Gold Account may optionally authorize a Celo account as a vote signer. Authorized vote signers can vote for validator groups and for on-chain governance proposals on behalf of the Locked Gold Account.

Note that the vote signer must first generate a "proof-of-possession" indicating that signer's willingness to be authorized on behalf of the Locked Gold Account.

Authorized vote signers can only be used to send voting transactions and **can be stored on a Ledger hardware wallet**.

### Authorizing a Vote Signer

A Celo account may be authorized as a vote signer on behalf of a Locked Gold Account by running the following commands:

```text
# Create a proof-of-possession. Note that the signer private key must be available.
celocli account:proof-of-possession --account $LOCKED_GOLD_ACCOUNT --signer $SIGNER_TO_AUTHORIZE --useLedger

# Authorize the vote signer. Note that the Locked Gold Account private key must be available.
celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role vote --signer $SIGNER_TO_AUTHORIZE --signature $SIGNER_PROOF_OF_POSSESSION --useLedger

# Confirm that the vote signer was authorized
celocli account:show $LOCKED_GOLD_ACCOUNT

# You can also look up account info via the authorized signer
celocli account:show $SIGNER_TO_AUTHORIZE
```

## Authorized Validator Signers

Any Locked Gold Account may optionally authorize a Celo account as a validator signer. Authorized validator signers can be used to register and manage a validator or validator group on behalf of the Locked Gold Account. If the authorized validator signer is used to register and run a validator, the signer key is also used to sign consensus messages.

### Authorized Validator Signers for Validator Groups

An authorized validator signer key that will be used to register a validator group can be used to send group management transactions \(e.g. register, add member A, queue commission update to 0.25, etc.\) Because this key does not participate directly in consensus it **can be stored on a Ledger hardware wallet.**

### Authorized Validator Signers for Validators

An authorized validator signer key that will be used to register a validator can be used to send validator management transactions \(e.g. register, affiliate with group A, etc.\) This key will also be used to sign consensus messages and thus **cannot be stored on a Ledger hardware wallet** as signing consensus messages is not currently supported by the Celo Ledger App.

Note that the validator signer must first generate a "proof-of-possession" indicating the signer's willingness to be authorized on behalf of the Locked Gold Account.

### Authorizing a Validator Signer

A Celo account may be authorized as a validator signer on behalf of a Locked Gold Account by running the following commands:

```text
# Create a proof-of-possession. Note that the signer private key must be available.
# Note that the signing key can be kept on a Ledger if it will be used to run a Validator Group.
celocli account:proof-of-possession --account $LOCKED_GOLD_ACCOUNT --signer $SIGNER_TO_AUTHORIZE

# Authorize the validator signer. Note that the Locked Gold Account private key must be available.
# Note that if a Validator has previously been registered on behalf of the Locked Gold Account it
# may be desirable to include the BLS key here as well. Please see the documentation on
# validator key rotation for more information.
celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role validator --signer $SIGNER_TO_AUTHORIZE --signature $SIGNER_PROOF_OF_POSSESSION --useLedger

# Confirm that the vote signer was authorized
celocli account:show $LOCKED_GOLD_ACCOUNT

# You can also look up account info via the authorized signer
celocli account:show $SIGNER_TO_AUTHORIZE
```

## Authorized Validator BLS Signers

The Celo protocol uses BLS signatures in consensus to ultimately determine whether or not a particular block is valid. Many BLS signatures over the same content can be combined into a single "aggregated signature", allowing several kilobytes of signatures to be compressed into fewer than 100 bytes, ensuring that the block headers remain compact and light client friendly.

When registering a Validator on behalf of a Locked Gold Account, users must provide a BLS public key, as well as a proof-of-possession to protect against [rogue key attacks](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html).

By default users can derive the BLS key directly from their authorized validator signer key. From a key management and security perspective, this means that the authorized BLS signer key is **exactly the same** as the authorized validator signer key.

Most users will only need to think about BLS signer keys when registering a validator, or when authorizing a new validator signer _after_ registering a validator. It follows that when a validator authorizes a new validator signer, the BLS public key and proof-of-possession for the new authorized validator signer should be provided as well.

Advanced users may optionally derive their BLS key separately, but that is out of the scope of this documentation.

### Deriving a BLS public key

To derive a BLS public key and proof-of-possession from the authorized validator signer key, and use that information to register a validator, run the following commands:

```text
# Derive the BLS public key and create a proof-of-possession. Note that the signer private key must be available.
# Also note that BLS proof-of-possessions are not currently supported by celocli
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $AUTHORIZED_VALIDATOR_SIGNER $LOCKED_GOLD_ACCOUNT --bls

# Register the Validator with the authorized validator signer on behalf of the Locked Gold Account
celocli validator:register --from $AUTHORIZED_VALIDATOR_SIGNER --blsKey $BLS_SIGNER_PUBLIC_KEY --blsSignature $BLS_SIGNER_PROOF_OF_POSSESSION

# Confirm that the validator was registered
celocli validator:show $LOCKED_GOLD_ACCOUNT

# You can also look up the validator via the authorized signer
celocli validator:show $AUTHORIZED_VALIDATOR_SIGNER
```

## Authorized Attestation Signers

Any Locked Gold Account may optionally authorize a Celo account as an attestation signer. Authorized attestation signers can sign attestation messages on behalf of the Locked Gold Account in Celo's [lightweight identity protocol](../../celo-codebase/protocol/identity/).

Note that the Celo Ledger App does yet not support signing attestation messages and as such attestation signer keys **cannot be stored on a Ledger hardware wallet**.

Note that the attestation signer must first be used to generate a "proof-of-possession" indicating the signer's willingness to be authorized on behalf of the Locked Gold Account.

### Authorizing an Attestation Signer

A Celo account may be authorized as a vote signer on behalf of a Locked Gold Account by running the following commands:

```text
# Create a proof-of-possession. Note that the signer private key must be available.
celocli account:proof-of-possession --account $LOCKED_GOLD_ACCOUNT --signer $SIGNER_TO_AUTHORIZE
# If celocli is unavailable on the attestations node, the proof-of-possession can be generated with celo-blockchain
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $SIGNER_TO_AUTHORIZE $LOCKED_GOLD_ACCOUNT

# Authorize the attestation signer. Note that the Locked Gold Account private key must be available.
celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role attestations --signer $SIGNER_TO_AUTHORIZE --signature $SIGNER_PROOF_OF_POSSESSION --useLedger

# Confirm that the vote signer was authorized
celocli account:show $LOCKED_GOLD_ACCOUNT

# You can also look up account info via the authorized signer
celocli account:show $SIGNER_TO_AUTHORIZE
```

