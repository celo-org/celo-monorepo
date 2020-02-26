---
description: Get the current set oracle-reported rates for the given token
---

## Commands

### Rates

Get the current set oracle-reported rates for the given token

```
USAGE
  $ celocli oracle:rates TOKEN

ARGUMENTS
  TOKEN  (StableToken) [default: StableToken] Token to get the rates for

EXAMPLES
  rates StableToken
  rates
```

_See code: [packages/cli/src/commands/oracle/rates.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/rates.ts)_

### Report

Report the price of Celo Gold in a specified token (currently just Celo Dollar, aka: "StableToken")

```
USAGE
  $ celocli oracle:report TOKEN

ARGUMENTS
  TOKEN  (StableToken) [default: StableToken] Token to report on

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the oracle account
  --value=value                                      (required) Amount of the specified token equal to 1 cGLD

EXAMPLES
  report StableToken --value 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
  report --value 0.99 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [packages/cli/src/commands/oracle/report.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/report.ts)_
