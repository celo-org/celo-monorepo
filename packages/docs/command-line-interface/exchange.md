---
description: Commands for interacting with the Exchange
---

## Commands

### List

List information about tokens on the exchange (all amounts in wei)

```
USAGE
  $ celocli exchange:list

OPTIONS
  --amount=amount  [default: 1000000000000000000] Amount of sellToken (in wei) to report rates for

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/exchange/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/list.ts)_

### Selldollar

Sell Celo dollars for Celo gold on the exchange

```
USAGE
  $ celocli exchange:selldollar SELLAMOUNT MINBUYAMOUNT FROM

ARGUMENTS
  SELLAMOUNT    the amount of sellToken (in wei) to sell
  MINBUYAMOUNT  the minimum amount of buyToken (in wei) expected
  FROM

EXAMPLE
  selldollar 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/selldollar.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/selldollar.ts)_

### Sellgold

Sell Celo gold for Celo dollars on the exchange

```
USAGE
  $ celocli exchange:sellgold SELLAMOUNT MINBUYAMOUNT FROM

ARGUMENTS
  SELLAMOUNT    the amount of sellToken (in wei) to sell
  MINBUYAMOUNT  the minimum amount of buyToken (in wei) expected
  FROM

EXAMPLE
  sellgold 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/sellgold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/sellgold.ts)_
