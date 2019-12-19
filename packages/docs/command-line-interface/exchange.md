---
description: Exchange Celo Dollars and Celo Gold via the stability mechanism
---

## Commands

### Dollars

Exchange Celo Dollars for Celo Gold via the stability mechanism

```
USAGE
  $ celocli exchange:dollars

OPTIONS
  --for=10000000000000000000000                      (required) The minimum value of Celo Gold to receive in return
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with Celo Dollars to exchange
  --value=10000000000000000000000                    (required) The value of Celo Dollars to exchange for Celo Gold

EXAMPLE
  dollars --value 10000000000000 --for 50000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/dollars.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/dollars.ts)_

### Gold

Exchange Celo Gold for Celo Dollars via the stability mechanism

```
USAGE
  $ celocli exchange:gold

OPTIONS
  --for=10000000000000000000000                      (required) The minimum value of Celo Dollars to receive in return
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with Celo Gold to exchange
  --value=10000000000000000000000                    (required) The value of Celo Gold to exchange for Celo Dollars

EXAMPLE
  gold --value 5000000000000 --for 100000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [packages/cli/src/commands/exchange/gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/gold.ts)_

### Show

Show the current exchange rates offered by the Exchange

```
USAGE
  $ celocli exchange:show

OPTIONS
  --amount=amount  [default: 1000000000000000000] Amount of the token being exchanged to report rates for

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/exchange/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/show.ts)_
