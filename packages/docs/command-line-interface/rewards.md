---
description: Show rewards information about a voter, registered Validator, or Validator Group
---

## Commands

### Show

Show rewards information about a voter, registered Validator, or Validator Group

```
USAGE
  $ celocli rewards:show

OPTIONS
  --epochs=epochs                                         [default: 1] Show results for the last N epochs
  --group=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      Validator Group to show rewards for
  --slashing                                              Show rewards for slashing
  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Validator to show rewards for
  --voter=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      Voter to show rewards for

EXAMPLE
  show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/rewards/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/rewards/show.ts)_

### Slasher

Slashes for downtime

```
USAGE
  $ celocli rewards:slasher

OPTIONS
  --automatic                                                        Automatically monitor and slash for downtime
  --dryRun                                                           Dry run
  --endBlock=endBlock                                                Stop monitoring after block

  --forDowntimeBeginningAtBlock=forDowntimeBeginningAtBlock          Manually slash validator for downtime beginning at
                                                                     block

  --forDowntimeEndingAtBlock=forDowntimeEndingAtBlock                Manually slash validator for downtime ending at
                                                                     block

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d                  (required) Slasher's address

  --gas=gas                                                          Gas to supply for slashing transactions

  --maxSlashAttempts=maxSlashAttempts                                Attempt slashing a max of N times

  --slashAgainAfter=slashAgainAfter                                  Slash same validator again after N blocks

  --slashValidator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d        Manually slash this validator address

  --slashValidatorSigner=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Manually slash this validator address

  --slashableDowntime=slashableDowntime                              Overrides downtime threshold for automatically
                                                                     slashing

  --startBlock=startBlock                                            Start monitoring on block instead of tip

EXAMPLE
  slasher --from 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --automatic
```

_See code: [packages/cli/src/commands/rewards/slasher.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/rewards/slasher.ts)_
