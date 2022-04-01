# `celocli exchange`

Exchange Celo Dollars and CELO via the stability mechanism

## `celocli exchange:celo`

Exchange CELO for StableTokens via the stability mechanism. (Note: this is the equivalent of the old exchange:gold)

```
Exchange CELO for StableTokens via the stability mechanism. (Note: this is the equivalent of the old exchange:gold)

USAGE
  $ celocli exchange:celo

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum
                                                     value of StableTokens to receive in
                                                     return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with CELO to
                                                     exchange

  --globalHelp                                       View all available global flags

  --stableToken=(cUSD|cusd|cEUR|ceur|cREAL|creal)    [default: cUSD] Name of the stable
                                                     to receive

  --value=10000000000000000000000                    (required) The value of CELO to
                                                     exchange for a StableToken

EXAMPLES
  celo --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d

  celo --value 5000000000000 --forAtLeast 100000000000000 --from
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cStableTokenSymbol
```

_See code: [src/commands/exchange/celo.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/celo.ts)_

## `celocli exchange:dollars`

Exchange Celo Dollars for CELO via the stability mechanism

```
Exchange Celo Dollars for CELO via the stability mechanism

USAGE
  $ celocli exchange:dollars

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum
                                                     value of CELO to receive in return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with Celo
                                                     Dollars to exchange

  --globalHelp                                       View all available global flags

  --value=10000000000000000000000                    (required) The value of Celo
                                                     Dollars to exchange for CELO

EXAMPLES
  dollars --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d

  dollars --value 10000000000000 --forAtLeast 50000000000000 --from
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [src/commands/exchange/dollars.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/dollars.ts)_

## `celocli exchange:euros`

Exchange Celo Euros for CELO via the stability mechanism

```
Exchange Celo Euros for CELO via the stability mechanism

USAGE
  $ celocli exchange:euros

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum
                                                     value of CELO to receive in return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with Celo
                                                     Euros to exchange

  --globalHelp                                       View all available global flags

  --value=10000000000000000000000                    (required) The value of Celo Euros
                                                     to exchange for CELO

EXAMPLES
  euros --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d

  euros --value 10000000000000 --forAtLeast 50000000000000 --from
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [src/commands/exchange/euros.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/euros.ts)_

## `celocli exchange:gold`

Exchange CELO for StableTokens via the stability mechanism. _DEPRECATION WARNING_ Use the "exchange:celo" command instead

```
Exchange CELO for StableTokens via the stability mechanism. *DEPRECATION WARNING* Use the "exchange:celo" command instead

USAGE
  $ celocli exchange:gold

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum
                                                     value of StableTokens to receive in
                                                     return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with CELO to
                                                     exchange

  --globalHelp                                       View all available global flags

  --stableToken=(cUSD|cusd|cEUR|ceur|cREAL|creal)    [default: cUSD] Name of the stable
                                                     to receive

  --value=10000000000000000000000                    (required) The value of CELO to
                                                     exchange for a StableToken

EXAMPLES
  gold --value 5000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d

  gold --value 5000000000000 --forAtLeast 100000000000000 --from
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cUSD
```

_See code: [src/commands/exchange/gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/gold.ts)_

## `celocli exchange:reals`

Exchange Celo Brazilian Real (cBRL) for CELO via the stability mechanism

```
Exchange Celo Brazilian Real (cBRL) for CELO via the stability mechanism

USAGE
  $ celocli exchange:reals

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum
                                                     value of CELO to receive in return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with Celo
                                                     Brazilian Real to exchange

  --globalHelp                                       View all available global flags

  --value=10000000000000000000000                    (required) The value of Celo
                                                     Brazilian Real to exchange for CELO

EXAMPLES
  reals --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d

  reals --value 10000000000000 --forAtLeast 50000000000000 --from
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
```

_See code: [src/commands/exchange/reals.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/reals.ts)_

## `celocli exchange:show`

Show the current exchange rates offered by the Exchange

```
Show the current exchange rates offered by the Exchange

USAGE
  $ celocli exchange:show

OPTIONS
  --amount=amount  [default: 1000000000000000000] Amount of the token being exchanged to
                   report rates for

  --globalHelp     View all available global flags

EXAMPLE
  list
```

_See code: [src/commands/exchange/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/show.ts)_

## `celocli exchange:stable`

Exchange Stable Token for CELO via the stability mechanism

```
Exchange Stable Token for CELO via the stability mechanism

USAGE
  $ celocli exchange:stable

OPTIONS
  --forAtLeast=10000000000000000000000               [default: 0] Optional, the minimum
                                                     value of CELO to receive in return

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) The address with the
                                                     Stable Token to exchange

  --globalHelp                                       View all available global flags

  --stableToken=(cUSD|cusd|cEUR|ceur|cREAL|creal)    Name of the stable token to be
                                                     transfered

  --value=10000000000000000000000                    (required) The value of Stable
                                                     Tokens to exchange for CELO

EXAMPLES
  stable --value 10000000000000 --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d
  --stableToken cStableTokenSymbol

  stable --value 10000000000000 --forAtLeast 50000000000000 --from
  0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --stableToken cStableTokenSymbol
```

_See code: [src/commands/exchange/stable.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/exchange/stable.ts)_
