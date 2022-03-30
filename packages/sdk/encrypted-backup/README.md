# Pin/Password-Encrypted Backup SDK

This package provides an SDK for creating PIN/password encrypted user backups, as is used in the
PIN/Password Encrypted Account Recovery.

The best resource for understanding the library is the inline documentation in
[backup.ts](src/backup.ts).

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
