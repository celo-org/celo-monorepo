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
  TOKEN  (StableToken) Token to get the rates for

EXAMPLE
  rates StableToken
```

_See code: [packages/cli/src/commands/oracle/rates.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/rates.ts)_

### Report

Report the price of Celo Gold in a specified token (currently just Celo Dollar, aka: "StableToken")

```
USAGE
  $ celocli oracle:report TOKEN

ARGUMENTS
  TOKEN  (StableToken) Token to report on

OPTIONS
  --denominator=denominator                          Amount of cGLD equal to the numerator. Defaults to 1 if left blank
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the oracle account

  --numerator=numerator                              (required) Amount of the specified token equal to the amount of
                                                     cGLD in the denominator

EXAMPLES
  report --token StableToken --numerator 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
  report --token StableToken --numerator 102 --denominator 100 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [packages/cli/src/commands/oracle/report.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/report.ts)_
