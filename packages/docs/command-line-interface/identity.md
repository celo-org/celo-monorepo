---
description: Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol
---

## Commands

### Current-attestation-services

Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol

```
USAGE
  $ celocli identity:current-attestation-services
```

_See code: [packages/cli/src/commands/identity/current-attestation-services.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/current-attestation-services.ts)_

### Test-attestation-service

Tests whether the account has setup the attestation service properly by calling the test endpoint on it

```
USAGE
  $ celocli identity:test-attestation-service

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Your validator's signer or account address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --message=message                                  (required) The message of the SMS

  --phoneNumber=+14152223333                         (required) The phone number to send the test message to

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  test-attestation-service --from 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/identity/test-attestation-service.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/test-attestation-service.ts)_
