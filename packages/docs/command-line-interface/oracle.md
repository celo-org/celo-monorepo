# `celocli oracle`

List oracle addresses for a given token


## `celocli oracle:list TOKEN`

List oracle addresses for a given token

```
List oracle addresses for a given token

USAGE
  $ celocli oracle:list TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to list the oracles for

EXAMPLES
  list StableToken

  list
```

_See code: [src/commands/oracle/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/list.ts)_

## `celocli oracle:remove-expired-reports TOKEN`

Remove expired oracle reports for a specified token (currently just Celo Dollar, aka "StableToken")

```
Remove expired oracle reports for a specified token (currently just Celo Dollar, aka "StableToken")

USAGE
  $ celocli oracle:remove-expired-reports TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to remove expired reports for

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     removing oracle reports

EXAMPLES
  remove-expired-reports StableToken --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1

  remove-expired-reports --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [src/commands/oracle/remove-expired-reports.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/remove-expired-reports.ts)_

## `celocli oracle:report TOKEN`

Report the price of CELO in a specified token (currently just Celo Dollar, aka "StableToken")

```
Report the price of CELO in a specified token (currently just Celo Dollar, aka "StableToken")

USAGE
  $ celocli oracle:report TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to report on

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the oracle
                                                     account

  --value=value                                      (required) Amount of the specified
                                                     token equal to 1 CELO

EXAMPLES
  report StableToken --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1

  report --value 0.99 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [src/commands/oracle/report.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/report.ts)_

## `celocli oracle:reports TOKEN`

List oracle reports for a given token

```
List oracle reports for a given token

USAGE
  $ celocli oracle:reports TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to list the reports for

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLES
  reports StableToken

  reports
```

_See code: [src/commands/oracle/reports.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/reports.ts)_
