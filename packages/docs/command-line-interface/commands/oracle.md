# Oracle

List oracle addresses for a given token

## `celocli oracle:list TOKEN`

List oracle addresses for a given token

```text
List oracle addresses for a given token

USAGE
  $ celocli oracle:list TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to list the oracles for

OPTIONS
  --globalHelp  View all available global flags

EXAMPLES
  list StableToken

  list

  list StableTokenEUR
```

_See code:_ [_src/commands/oracle/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/list.ts)

## `celocli oracle:remove-expired-reports TOKEN`

Remove expired oracle reports for a specified token

```text
Remove expired oracle reports for a specified token

USAGE
  $ celocli oracle:remove-expired-reports TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to remove expired reports for

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the account
                                                     removing oracle reports

  --globalHelp                                       View all available global flags

EXAMPLES
  remove-expired-reports StableToken --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1

  remove-expired-reports --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1

  remove-expired-reports StableTokenEUR --from
  0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code:_ [_src/commands/oracle/remove-expired-reports.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/remove-expired-reports.ts)

## `celocli oracle:report TOKEN`

Report the price of CELO in a specified token

```text
Report the price of CELO in a specified token

USAGE
  $ celocli oracle:report TOKEN

ARGUMENTS
  TOKEN  [default: StableToken] Token to report on

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the oracle
                                                     account

  --globalHelp                                       View all available global flags

  --value=value                                      (required) Amount of the specified
                                                     token equal to 1 CELO

EXAMPLES
  report StableToken --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1

  report --value 0.99 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1

  report StableTokenEUR --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code:_ [_src/commands/oracle/report.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/report.ts)

## `celocli oracle:reports TOKEN`

List oracle reports for a given token

```text
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
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLES
  reports StableToken

  reports

  reports StableTokenEUR
```

_See code:_ [_src/commands/oracle/reports.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/reports.ts)

