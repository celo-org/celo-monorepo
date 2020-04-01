---
description: Transfer Celo Gold and Celo Dollars
---

## Commands

### Dollars

Transfer Celo Dollars to a specified address.

```
USAGE
  $ celocli transfer:dollars

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver
  --value=value                                      (required) Amount to transfer (in wei)

EXAMPLE
  dollars --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  1000000000000000000
```

_See code: [packages/cli/src/commands/transfer/dollars.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/dollars.ts)_

### Gold

Transfer Celo Gold to a specified address.

```
USAGE
  $ celocli transfer:gold

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address of the sender
  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Address of the receiver
  --value=value                                      (required) Amount to transfer (in wei)

EXAMPLE
  transfergold --from 0xa0Af2E71cECc248f4a7fD606F203467B500Dd53B --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --value
  10000000000000000000
```

_See code: [packages/cli/src/commands/transfer/gold.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/gold.ts)_

### Trace

Trace a transaction

```
USAGE
  $ celocli transfer:trace

OPTIONS
  --blockNumber=blockNumber  Block number to trace
  --tracer=tracer            Tracer name
  --tracerFile=tracerFile    File containing javascript tracer code
  --transaction=transaction  Transaction hash to trace
```

_See code: [packages/cli/src/commands/transfer/trace.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/transfer/trace.ts)_
