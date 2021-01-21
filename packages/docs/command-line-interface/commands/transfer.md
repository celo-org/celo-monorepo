# Transfer

Transfer CELO and Celo Dollars

## `celocli transfer:celo`

Transfer CELO to a specified address. \(Note: this is the equivalent of the old transfer:gold\)

```text
Transfer CELO to a specified address. (Note: this is the equivalent of the old transfer:gold)

USAGE
  $ celocli transfer:celo

OPTIONS
  --comment=comment                                  Transfer comment
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

  --value=value                                      (required) Amount to transfer (in
                                                     wei)

EXAMPLE
  celo --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000
```

_See code:_ [_src/commands/transfer/celo.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/celo.ts)

## `celocli transfer:dollars`

Transfer Celo Dollars to a specified address.

```text
Transfer Celo Dollars to a specified address.

USAGE
  $ celocli transfer:dollars

OPTIONS
  --comment=comment                                  Transfer comment
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

  --value=value                                      (required) Amount to transfer (in
                                                     wei)

EXAMPLE
  dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 1000000000000000000
```

_See code:_ [_src/commands/transfer/dollars.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/dollars.ts)

## `celocli transfer:gold`

Transfer CELO to a specified address. _DEPRECATION WARNING_ Use the "transfer:celo" command instead

```text
Transfer CELO to a specified address. *DEPRECATION WARNING* Use the "transfer:celo" command instead

USAGE
  $ celocli transfer:gold

OPTIONS
  --comment=comment                                  Transfer comment
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver

  --value=value                                      (required) Amount to transfer (in
                                                     wei)

EXAMPLE
  gold --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --value 10000000000000000000
```

_See code:_ [_src/commands/transfer/gold.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/gold.ts)

