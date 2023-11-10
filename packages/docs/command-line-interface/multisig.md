# `celocli multisig`

Approves an existing transaction on a multi-sig contract


## `celocli multisig:approve`

Approves an existing transaction on a multi-sig contract

```
Approves an existing transaction on a multi-sig contract

USAGE
  $ celocli multisig:approve

OPTIONS
  --for=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   (required) Address of the multi-sig
                                                     contract

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Account approving the
                                                     multi-sig transaction

  --globalHelp                                       View all available global flags

  --tx=tx                                            (required) Transaction to approve

EXAMPLE
  approve --from 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --for
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --tx 3
```

_See code: [src/commands/multisig/approve.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/multisig/approve.ts)_

## `celocli multisig:show ADDRESS`

Shows information about multi-sig contract

```
Shows information about multi-sig contract

USAGE
  $ celocli multisig:show ADDRESS

OPTIONS
  --all         Show info about all transactions
  --globalHelp  View all available global flags
  --raw         Do not attempt to parse transactions
  --tx=tx       Show info for a transaction

EXAMPLES
  show 0x5409ed021d9299bf6814279a6a1411a7e866a631

  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --tx 3

  show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --all --raw
```

_See code: [src/commands/multisig/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/multisig/show.ts)_

## `celocli multisig:transfer ADDRESS`

Ability to approve CELO transfers to and from multisig. Submit transaction or approve a matching existing transaction

```
Ability to approve CELO transfers to and from multisig. Submit transaction or approve a matching existing transaction

USAGE
  $ celocli multisig:transfer ADDRESS

OPTIONS
  --amount=amount                                      (required) Amount to transfer,
                                                       e.g. 10e18

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d    (required) Account transferring
                                                       value to the recipient

  --globalHelp                                         View all available global flags

  --sender=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Identify sender if performing
                                                       transferFrom

  --to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      (required) Recipient of transfer

  --transferFrom                                       Perform transferFrom instead of
                                                       transfer in the ERC-20 interface

EXAMPLES
  transfer <multiSigAddr> --to 0x5409ed021d9299bf6814279a6a1411a7e866a631 --amount
  200000e18 --from 0x123abc

  transfer <multiSigAddr> --transferFrom --sender 0x123abc --to
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --amount 200000e18 --from 0x123abc
```

_See code: [src/commands/multisig/transfer.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/multisig/transfer.ts)_
