# Pin/Password-Encrypted Backup SDK

## Overview

This package provides an SDK for creating PIN/password encrypted user data backups, as is used in
the [PIN/Password Encrypted Account Recovery (PEAR)].

[PIN/Password Encrypted Account Recovery (PEAR)]: https://docs.celo.org/celo-codebase/protocol/identity/encrypted-cloud-backup

It includes functionality to create, serialize, deserialize, and open encrypted backups.

**Note that this SDK relies on the [Domains extension] to ODIS, which is not currently deployed to
the Mainnet operators**

[Domains extension]: https://docs.celo.org/celo-codebase/protocol/odis/domains

Developers can integrate with two preconfigured encryption profiles with the functions,
`createPinEncryptedBackup` and `createPasswordEncryptedBackup` which apply recommended levels of
hardening to generate the backup encryption key from the given PIN or password respectively.

### Configuration

Developers who want more control over the security parameters and user experience trade-offs (e.g.
more restrictive rate limiting for higher security at the cost of higher friction), may define their
own hardening configurations and use the `createBackup` function to build those backups.

If the available ODIS hardening profiles do not work for your use case, the ODIS [Domains extension]
which underlies the key hardening is designed to be readily extensible. Feel free to propose a new
rate limiting function by filing an issue or opening a PR. You can read [CIP-40] for more
information about what is possible.

[Domains extension]: https://docs.celo.org/celo-codebase/protocol/odis/domains
[CIP-40]: https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0040.md

### Key hardening

PIN or password derived encryption keys are not secure by default because these secrets do not have
enough entropy (i.e. they are too easy to guess). As a result key hardening is required to ensure
the derived key is strong enough to withstand a motivated attackers.

### ODIS

The primary method of key hardening used in this SDK is the ODIS [POPRF] functionality, exposed
through the [Domains extension] for [key hardening]. This uses ODIS as a "hashing service" with an
applied rate limit that is configurable by the client. The enforcement of the rate limit makes
guessing a password or PIN infeasible by greatly restricting the amount of attempts an attacker gets
to guess the key. This necessarily also limits the number of attempts the user gets.

[POPRF]: https://github.com/celo-org/celo-poprf-rs
[Domains extension]: https://docs.celo.org/celo-codebase/protocol/odis/domains
[key hardening]: https://docs.celo.org/celo-codebase/protocol/odis/use-cases/key-hardening

### Additional hardening

In addition to ODIS, this library supports two more sources of key hardening.

First, it supports computational key hardening through `scrypt` or `PBKDF2`. These functions impose
a computational cost on checking a password guess. For secrets such as passwords with a moderate
amount of entropy, this can be a useful line of defense in preventing key cracking. The default
password hardening configuration includes `scrypt` hardening. In the case of low entropy secrets
such as PINs, it does not provide a meaningful increase in security.

Second, it supports the use of a "circuit breaker" service. When enabled, the key generation process
will include a random "fuse key". Once mixed into the encryption key, the fuse key is encrypted to
the public key of the circuit breaker service and then discarded. The fuse key ciphertext is
included in the backup. Under normal circumstances, the user can send the fuse key ciphertext to the
circuit breaker service to have it decrypted. If ODIS is ever believed to be compromised, the
circuit breaker operator will disable this service, disabling recovery of the fuse key and
decryption of the backup data. Using this service represents a trade-off of electing a third-party
with the right to disable backup access for the benefit of security against attackers that might
successfully compromise ODIS. The PIN default hardening configuration includes this service,
electing [Valora] as the circuit breaker operator.

[Valora]: https://valoraapp.com/

## Documentation

The best resource for understanding the library is the inline documentation in [backup.ts] or the
SDK documentation at [celo-sdk-docs.readthedocs.io].

[backup.ts]: src/backup.ts
[celo-sdk-docs.readthedocs.io]: https://celo-sdk-docs.readthedocs.io/en/latest/encrypted-backup/

## Examples

### Creating a backup

In order to create a backup, the application should serialize the account data (e.g. seed phrase, user
name, wallet metadata, etc) into a `Buffer` and obtain a PIN or password from the user. In this
example, we use a PIN.

Calling `createPinEncryptedBackup` will use ODIS for key hardening, add a circuit breaker key, and
bundle the result into a `Backup` object. The application should store this data somewhere the user
can access it for recovery. Although it is encrypted, it should not be exposed publicly and
instead should be stored in consumer cloud storage like Google Drive or iCloud, or on the
application servers with some application specific authentication.

```typescript
import { createPinEncryptedBackup } from '@celo/encrypted-backup'

const backup = await createPinEncryptedBackup(accountData, userPin)
if (!backup.ok) {
  // handle backup.error
}
storeUserBackup(backup.result)
```

### Opening a backup

In order to open the backup, the application should fetch the user backup and ask the user to enter
their PIN or password. Calling `openBackup` will read the backup to determine what hardening was
applied, the make the required calls ODIS, a circuit breaker service, and computational hardening to
recover the encryption key and decrypt the backup. The backup data can then be used to restore the
user account.

```typescript
import { openBackup } from '@celo/encrypted-backup'

const backup = await fetchUserBackup()
const accountData = await openBackup(backup, userPin)
if (!accountKey.ok) {
  // handle backup.error
}
restoreAccount(accountData.result)
```
