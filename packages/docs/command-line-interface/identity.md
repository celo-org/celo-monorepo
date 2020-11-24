---
description: Interact with ODIS and the attestations service
---

## Commands

### Current-attestation-services

Outputs the set of validators currently participating in BFT and which ones are participating in Celo's lightweight identity protocol

```
USAGE
  $ celocli identity:current-attestation-services

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)
```

_See code: [packages/cli/src/commands/identity/current-attestation-services.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/current-attestation-services.ts)_

### Identifier

Queries ODIS for the on-chain identifier and pepper corresponding to a given phone number.

```
USAGE
  $ celocli identity:identifier

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
  --context=context                                  mainnet (default), alfajores, or alfajoresstaging
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address from which to perform the query

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --phoneNumber=+14152223333                         (required) The phone number for which to query the identifier.
                                                     Should be in e164 format with country code.

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  identifier --phoneNumber +14151231234 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631 --context alfajores
```

_See code: [packages/cli/src/commands/identity/identifier.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/identifier.ts)_

### Test-attestation-service

Tests whether the account has setup the attestation service properly by calling the test endpoint on it

```
USAGE
  $ celocli identity:test-attestation-service

OPTIONS
  -k, --privateKey=privateKey                        Use a private key to sign local transactions with
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

  --provider=provider                                Test a specific provider (try "twilio" or "nexmo")

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  test-attestation-service --from 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/identity/test-attestation-service.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/test-attestation-service.ts)_
