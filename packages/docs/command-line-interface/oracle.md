---
description: Report the price of Celo Gold in a specified token (currently just Celo Dollar, aka: "StableToken")
---

## Commands

### Report

Report the price of Celo Gold in a specified token (currently just Celo Dollar, aka: "StableToken")

```
USAGE
  $ celocli oracle:report

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the oracle account
  --price=price                                      (required) The amount of the specified token equal to 1 cGLD
  --token=token                                      (required) The token to report on

EXAMPLE
  report --token StableToken --price 1.02 --from 0x8c349AAc7065a35B7166f2659d6C35D75A3893C1
```

_See code: [packages/cli/src/commands/oracle/report.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/oracle/report.ts)_
