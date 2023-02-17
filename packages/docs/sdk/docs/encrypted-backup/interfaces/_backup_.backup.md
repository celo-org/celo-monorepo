[@celo/encrypted-backup](../README.md) › ["backup"](../modules/_backup_.md) › [Backup](_backup_.backup.md)

# Interface: Backup

Backup structure encoding the information needed to implement the encrypted backup protocol.

**`remarks`** The structure below and its related functions implement the encrypted backup protocol
designed for wallet account backups. More information about the protocol can be found in the
official [Celo documentation](https://docs.celo.org/celo-codebase/protocol/identity/encrypted-cloud-backup)

## Hierarchy

* **Backup**

## Index

### Properties

* [computationalHardening](_backup_.backup.md#optional-computationalhardening)
* [encryptedData](_backup_.backup.md#encrypteddata)
* [encryptedFuseKey](_backup_.backup.md#optional-encryptedfusekey)
* [environment](_backup_.backup.md#optional-environment)
* [metadata](_backup_.backup.md#optional-metadata)
* [nonce](_backup_.backup.md#nonce)
* [odisDomain](_backup_.backup.md#optional-odisdomain)
* [version](_backup_.backup.md#version)

## Properties

### `Optional` computationalHardening

• **computationalHardening**? : *[ComputationalHardeningConfig](../modules/_config_.md#computationalhardeningconfig)*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:79](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L79)*

Options for local computational hardening of the encryption key through PBKDF or scrypt.

**`remarks`** Adding computational hardening provides a measure of security from password guessing
when the password has a moderate amount of entropy (e.g. a password generated under good
guidelines). If the user secret has very low entropy, such as with a 6-digit PIN,
computational hardening does not add significant security.

___

###  encryptedData

• **encryptedData**: *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L43)*

AES-128-GCM encryption of the user's secret backup data.

**`remarks`** The backup key is derived from the user's password or PIN hardened with input from the
ODIS rate-limited hashing service and optionally a circuit breaker service.

___

### `Optional` encryptedFuseKey

• **encryptedFuseKey**? : *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L69)*

RSA-OAEP-256 encryption of a randomly chosen 128-bit value, the fuse key.

**`remarks`** The fuse key, if provided, is combined with the password in local key derivation.
Encryption is under the public key of the circuit breaker service. In order to get the fuseKey
the client will send this ciphertext to the circuit breaker service for decryption.

___

### `Optional` environment

• **environment**? : *undefined | object*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:105](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L105)*

Information including the URL and public keys of the ODIS and circuit breaker services.

___

### `Optional` metadata

• **metadata**? : *undefined | object*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:102](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L102)*

Data provided by the backup creator to identify the backup and its context

**`remarks`** Metadata is provided by, and only meaningful to, the SDK user. The intention is for
this metadata to be used for identifying the backup and providing any context needed in the
application

**`example`** 
```typescript
{
  // Address of the primary account stored a backup of an account key. Used to display the
  // balance and latest transaction information for a given backup.
  accountAddress: string
  // Unix timestamp used to indicate when the backup was created.
  timestamp: number
}
```

___

###  nonce

• **nonce**: *Buffer*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:52](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L52)*

A randomly chosen 256-bit value. Ensures uniqueness of the password derived encryption key.

**`remarks`** The nonce value is appended to the password for local key derivation. It is also used
to derive an authentication key to include in the ODIS Domain for domain separation and to
ensure quota cannot be consumed by parties without access to the backup.

___

### `Optional` odisDomain

• **odisDomain**? : *SequentialDelayDomain*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L60)*

ODIS Domain instance to be included in the query to ODIS for password hardening,

**`remarks`** Currently only SequentialDelayDomain is supported. Other ODIS domains intended for key
hardening may be supported in the future.

___

###  version

• **version**: *string*

*Defined in [packages/sdk/encrypted-backup/src/backup.ts:82](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/encrypted-backup/src/backup.ts#L82)*

Version number for the backup feature. Used to facilitate backwards compatibility.
