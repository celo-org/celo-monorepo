# Rewards

Show rewards information about a voter, registered Validator, or Validator Group

## `celocli rewards:show`

Show rewards information about a voter, registered Validator, or Validator Group

```text
Show rewards information about a voter, registered Validator, or Validator Group

USAGE
  $ celocli rewards:show

OPTIONS
  -x, --extended                                          show extra columns

  --columns=columns                                       only show provided columns
                                                          (comma-separated)

  --csv                                                   output is csv format [alias:
                                                          --output=csv]

  --epochs=epochs                                         [default: 1] Show results for
                                                          the last N epochs

  --estimate                                              Estimate voter rewards from
                                                          current votes

  --filter=filter                                         filter property by partial
                                                          string matching, ex: name=foo

  --globalHelp                                            View all available global
                                                          flags

  --group=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      Validator Group to show
                                                          rewards for

  --no-header                                             hide table header from output

  --no-truncate                                           do not truncate output to fit
                                                          screen

  --output=csv|json|yaml                                  output in a more machine
                                                          friendly format

  --slashing                                              Show rewards for slashing

  --sort=sort                                             property to sort by (prepend
                                                          '-' for descending)

  --validator=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  Validator to show rewards for

  --voter=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d      Voter to show rewards for

EXAMPLE
  show --address 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/rewards/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/rewards/show.ts)

