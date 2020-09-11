---
description: List oracle addresses for a given token
---

## Commands

### List

List oracle addresses for a given token

```
USAGE
  $ celocli oracle:list TOKEN

ARGUMENTS
  TOKEN  (StableToken) [default: StableToken] Token to list the oracles for

OPTIONS
  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)

EXAMPLES
  list StableToken
  list
```

_See code: [packages/cli/src/commands/oracle/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/list.ts)_

### Remove-expired-reports

Remove expired oracle reports for a specified token (currently just Celo Dollar, aka "StableToken")

```
USAGE
  $ celocli oracle:remove-expired-reports TOKEN

ARGUMENTS
  TOKEN  (StableToken) [default: StableToken] Token to remove expired reports for

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account removing oracle reports

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)      Use a specific gas currency for transaction fees (defaults to
                                                     'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLES
  remove-expired-reports StableToken --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
  remove-expired-reports --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [packages/cli/src/commands/oracle/remove-expired-reports.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/remove-expired-reports.ts)_

### Report

Report the price of CELO in a specified token (currently just Celo Dollar, aka "StableToken")

```
USAGE
  $ celocli oracle:report TOKEN

ARGUMENTS
  TOKEN  (StableToken) [default: StableToken] Token to report on

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the oracle account

  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)      Use a specific gas currency for transaction fees (defaults to
                                                     'auto' which uses whatever feeCurrency is available)

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

  --value=value                                      (required) Amount of the specified token equal to 1 CELO

EXAMPLES
  report StableToken --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
  report --value 0.99 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [packages/cli/src/commands/oracle/report.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/report.ts)_

### Reports

List oracle reports for a given token

```
USAGE
  $ celocli oracle:reports TOKEN

ARGUMENTS
  TOKEN  (StableToken) [default: StableToken] Token to list the reports for

OPTIONS
  --gasCurrency=(celo|CELO|cusd|cUSD|auto|Auto)  Use a specific gas currency for transaction fees (defaults to 'auto'
                                                 which uses whatever feeCurrency is available)

EXAMPLES
  reports StableToken
  reports
```

_See code: [packages/cli/src/commands/oracle/reports.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/reports.ts)_
