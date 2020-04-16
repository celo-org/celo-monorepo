# Detailed Description of Key Types
This page provides a detailed description of the various key prototypes found in the Celo protocol, as well as small examples of how to designate key types in the Celo proof-of-stake smart contracts.

## Undesignated

By default, any private key generated in the Celo protocol does not have a specific role in proof-of-stake. These keys can be used to sign and send transactions that are unrelated to Celo's proof-of-stake protocol, including but by no means limited to transferring Celo Gold, transferring Celo Dollars, exchanging Celo Gold for Celo Dollars, etc.

Undesignated keys can be designated as Locked Gold Accounts or authorized as signer keys on behalf of a Locked Gold Account by sending special transactions using `celocli`.

Note that [ReleaseGold](../../celo-codebase/protocol/release-gold) beneficiary keys are by default Undesignated with respect to proof-of-stake, and that the `ReleaseGold` contract address is what ultimately gets designated as a Locked Gold Account.


## Locked Gold Accounts

Locked Gold Account keys have the highest level of privileges in the Celo protocol. These keys can be used to lock and unlock cGLD in order to be used in proof-of-stake. Furthermore, Locked Gold Account keys can be used to authorize other keys to sign transactions and messages on behalf of the Locked Gold Account.

In *most* cases, the Locked Gold Account key has all the privileges as any authorized keys. For example, if a voter signing key is authorized, a user can place votes on behalf of the Locked Gold Account with both the authorized vote signing key *and* the Locked Gold Account key.

Because of the significant priveleges afforded to the Locked Gold Account key, it is best to store this key securely and access it as infrequently as is possible. Authorizing other signer keys is one way to minimize how frequently you need to access your Locked Gold Account key. The Locked Gold Account key will only be used to send transactions and **can be stored on a Ledger hardware wallet.**

### Creating a Locked Gold Account
An undesignated key may be designated as a Locked Gold Account key by running the following command:

```shell
# Designate the key as a Locked Gold Account
celocli account:create --from $ADDRESS_TO_DESIGNATE --useLedger

# Confirm the key was designated as a Locked Gold Account
celocli account:show $ADDRESS_TO_DESIGNATE
```

## Authorized Vote Signers

Any Locked Gold Account key may optionally authorize an undesignated key as a vote signing key. Authorized vote signing keys can vote in validator elections and on-chain governance on behalf of the Locked Gold Account.

Note that the vote signing key must first be used to generate a "proof-of-possession" indicating that key's willingness to be authorized as a signer on behalf of the Locked Gold Account.

Authorized vote signing keys will only be used to send transactions and **can be stored on a Ledger hardware wallet**.


### Authorizing a Vote Signer
An undesignated key may be authorized as a vote signer on behalf of a Locked Gold Account by running the following commands:

```shell
# Create a proof-of-possession. Note that the signer private key must be available.
celocli account:proof-of-possession --account $LOCKED_GOLD_ACCOUNT --signer $KEY_TO_AUTHORIZE --useLedger

# Authorize the vote signing key. Note that the Locked Gold Account private key must be available.
celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role vote --signer $KEY_TO_AUTHORIZE --signature $PROOF_OF_POSSESSION --useLedger

# Confirm that the vote signer was authorized
celocli account:show $LOCKED_GOLD_ACCOUNT

# You can also look up account info via the authorized signer
celocli account:show $KEY_TO_AUTHORIZE
```

## Authorized Validator Signers

Any Locked Gold Account key may optionally authorize an undesignated key as a validator signer. Authorized validator signing keys can be used to register and manage a validator or validator group on behalf of the Locked Gold Account. If the authorized validator key is used to register a validator it is also used to sign consensus messages.

### Authorized Validator Signers for Validator Groups
An authorized validator signer key that will be used to register a validator group can be used to send group management transactions (e.g. register, add member A, queue commission update to 0.25, etc.) Because this key does not participate directly in consensus it **can be stored on a Ledger hardware wallet.**

### Authorized Validator Signers for Validators
An authorized validator signer key that will be used to register a validator can be used to send validator management transactions (e.g. register, affiliate with group A, etc.) This key will also be used to sign consensus messages and thus *cannot be stored on a Ledger hardware wallet* as signing consensus messages is not currently supported by the Celo Ledger App.

Note that the validator signing key must first be used to generate a "proof-of-possession" indicating that key's willingness to be authorized as a signer on behalf of the Locked Gold Account.


### Authorizing a Validator Signer
An undesignated key may be authorized as a validator signer on behalf of a Locked Gold Account by running the following commands:

```shell
# Create a proof-of-possession. Note that the signer private key must be available.
# Note that the signing key should not be kept on a Ledger if it will be used to run a Validator
celocli account:proof-of-possession --account $LOCKED_GOLD_ACCOUNT --signer $KEY_TO_AUTHORIZE --useLedger

# Authorize the validator signing key. Note that the Locked Gold Account private key must be available.
# Note that if a Validator has previously been registered on behalf of the Locked Gold Account it
# may be desirable to include the BLS key here as well. Please see the documentation below on validator
# key rotation for more information.
celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role validator --signer $KEY_TO_AUTHORIZE --signature $PROOF_OF_POSSESSION --useLedger

# Confirm that the vote signer was authorized
celocli account:show $LOCKED_GOLD_ACCOUNT

# You can also look up account info via the authorized signer
celocli account:show $KEY_TO_AUTHORIZE
```

## Authorized Validator BLS Signers

The Celo protocol uses BLS signatures in consensus to ultimately determine whether or not a particular block is valid. Many BLS signatures over the same content can be combined into a single "aggregated signature", allowing several kilobytes of signatures to be compressed into fewer than 100 bytes, ensuring that the block headers remain compact and mobile friendly.

When registering a Validator on behalf of a Locked Gold Account, users must provide a BLS public key, as well as a proof-of-possession to protect against [rogue key attacks](https://crypto.stanford.edu/~dabo/pubs/papers/BLSmultisig.html).

By default users can derive the BLS key directly from their authorized validator signer key. From a key management perspective, this means that the authorized BLS signer key is **exactly the same** as the authorized validator signer key.

Most users will only need to think about BLS signer keys when registering a validator, or when authorizing a new validator signing key *after* registering a validator. It follows that when a validator authorizes a new validator signer key, the BLS public key and proof-of-possession for the new authorized validator signer should be provided as well.

Advanced users may optionally derive their BLS key separately, but that is out of the scope of this documentation.

### Deriving a BLS public key

To derive a BLS public key and proof-of-possession from the authorized validator signer key, and use that information to register a validator, run the following commands:
```shell
# Derive the BLS public key and create a proof-of-possession. Note that the signer private key must be available.
# Also note that BLS proof-of-possessions are not currently supported by celocli
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE --nousb account proof-of-possession $AUTHORIZED_VALIDATOR_SIGNER $LOCKED_GOLD_ACCOUNT --bls

# Register the Validator with the authorized validator signer on behalf of the Locked Gold Account
celocli validator:register --from $AUTHORIZED_VALIDATOR_SIGNER --blsKey $BLS_PUBLIC_KEY --blsSignature $BLS_PROOF_OF_POSSESSION

# Confirm that the validator was registered
celocli validator:show $LOCKED_GOLD_ACCOUNT

# You can also look up the validator via the authorized signer
celocli validator:show $AUTHORIZED_VALIDATOR_SIGNER
```

## Authorized Attestations Signers

Any Locked Gold Account key may optionally authorize an undesignated key as an attestations signing key. Authorized attestations signing keys can sign attestation messages on behalf of the Locked Gold Account in Celo's [lightweight identity protocol](celo-codebase/protocol/identity/).

Note that the Celo Ledger App does yet not support signing attestations messages and as such attestations signing keys **cannot be stored on a Ledger hardware wallet**.

Note that the attestations signing key must first be used to generate a "proof-of-possession" indicating that key's willingness to be authorized as a signer on behalf of the Locked Gold Account.


### Authorizing an Attestations Signer
An undesignated key may be authorized as a vote signer on behalf of a Locked Gold Account by running the following commands:

```shell
# Create a proof-of-possession. Note that the signer private key must be available.
celocli account:proof-of-possession --account $LOCKED_GOLD_ACCOUNT --signer $KEY_TO_AUTHORIZE
# If celocli is unavailable on the attestations node, the proof-of-possession can be generated with celo-blockchain
docker run -v $PWD:/root/.celo --rm -it $CELO_IMAGE account proof-of-possession $KEY_TO_AUTHORIZE $LOCKED_GOLD_ACCOUNT

# Authorize the attestations signing key. Note that the Locked Gold Account private key must be available.
celocli account:authorize --from $LOCKED_GOLD_ACCOUNT --role attestations --signer $KEY_TO_AUTHORIZE --signature $PROOF_OF_POSSESSION --useLedger

# Confirm that the vote signer was authorized
celocli account:show $LOCKED_GOLD_ACCOUNT

# You can also look up account info via the authorized signer
celocli account:show $KEY_TO_AUTHORIZE
```
