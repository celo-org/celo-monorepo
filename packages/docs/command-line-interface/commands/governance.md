# Governance

Interact with on-chain governance proposals and hotfixes

## `celocli governance:build-proposal`

Interactively build a governance proposal

```text
Interactively build a governance proposal

USAGE
  $ celocli governance:build-proposal

OPTIONS
  --afterExecutingID=afterExecutingID              Governance proposal identifier which
                                                   will be executed prior to proposal
                                                   being built

  --afterExecutingProposal=afterExecutingProposal  Path to proposal which will be
                                                   executed prior to proposal being
                                                   built

  --globalHelp                                     View all available global flags

  --output=output                                  [default: proposalTransactions.json]
                                                   Path to output

EXAMPLE
  build-proposal --output ./transactions.json
```

_See code:_ [_src/commands/governance/build-proposal.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/build-proposal.ts)

## `celocli governance:dequeue`

Try to dequeue governance proposal

```text
Try to dequeue governance proposal

USAGE
  $ celocli governance:dequeue

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) From address
  --globalHelp                                       View all available global flags

EXAMPLE
  dequeue --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/dequeue.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/dequeue.ts)

## `celocli governance:execute`

Execute a passing governance proposal

```text
Execute a passing governance proposal

USAGE
  $ celocli governance:execute

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Executor's address
  --globalHelp                                       View all available global flags

  --proposalID=proposalID                            (required) UUID of proposal to
                                                     execute

EXAMPLE
  execute --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/execute.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/execute.ts)

## `celocli governance:executehotfix`

Execute a governance hotfix prepared for the current epoch

```text
Execute a governance hotfix prepared for the current epoch

USAGE
  $ celocli governance:executehotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Executors's address
  --globalHelp                                       View all available global flags

  --jsonTransactions=jsonTransactions                (required) Path to json
                                                     transactions

  --salt=salt                                        (required) Secret salt associated
                                                     with hotfix

EXAMPLE
  executehotfix --jsonTransactions ./transactions.json --salt
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/executehotfix.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/executehotfix.ts)

## `celocli governance:hashhotfix`

Hash a governance hotfix specified by JSON and a salt

```text
Hash a governance hotfix specified by JSON and a salt

USAGE
  $ celocli governance:hashhotfix

OPTIONS
  --force                              Skip execution check
  --globalHelp                         View all available global flags

  --jsonTransactions=jsonTransactions  (required) Path to json transactions of the
                                       hotfix

  --salt=salt                          (required) Secret salt associated with hotfix

EXAMPLE
  hashhotfix --jsonTransactions ./transactions.json --salt
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658
```

_See code:_ [_src/commands/governance/hashhotfix.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/hashhotfix.ts)

## `celocli governance:list`

List live governance proposals \(queued and ongoing\)

```text
List live governance proposals (queued and ongoing)

USAGE
  $ celocli governance:list

OPTIONS
  -x, --extended          show extra columns
  --columns=columns       only show provided columns (comma-separated)
  --csv                   output is csv format [alias: --output=csv]
  --filter=filter         filter property by partial string matching, ex: name=foo
  --globalHelp            View all available global flags
  --no-header             hide table header from output
  --no-truncate           do not truncate output to fit screen
  --output=csv|json|yaml  output in a more machine friendly format
  --sort=sort             property to sort by (prepend '-' for descending)

EXAMPLE
  list
```

_See code:_ [_src/commands/governance/list.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/list.ts)

## `celocli governance:preparehotfix`

Prepare a governance hotfix for execution in the current epoch

```text
Prepare a governance hotfix for execution in the current epoch

USAGE
  $ celocli governance:preparehotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Preparer's address
  --globalHelp                                       View all available global flags

  --hash=hash                                        (required) Hash of hotfix
                                                     transactions

EXAMPLE
  preparehotfix --hash
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/preparehotfix.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/preparehotfix.ts)

## `celocli governance:propose`

Submit a governance proposal

```text
Submit a governance proposal

USAGE
  $ celocli governance:propose

OPTIONS
  --deposit=deposit                                  (required) Amount of Gold to attach
                                                     to proposal

  --descriptionURL=descriptionURL                    (required) A URL where further
                                                     information about the proposal can
                                                     be viewed

  --force                                            Skip execution check

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Proposer's address

  --globalHelp                                       View all available global flags

  --jsonTransactions=jsonTransactions                (required) Path to json
                                                     transactions

EXAMPLE
  propose --jsonTransactions ./transactions.json --deposit 10000 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631 --descriptionURL
  https://gist.github.com/yorhodes/46430eacb8ed2f73f7bf79bef9d58a33
```

_See code:_ [_src/commands/governance/propose.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/propose.ts)

## `celocli governance:revokeupvote`

Revoke upvotes for queued governance proposals

```text
Revoke upvotes for queued governance proposals

USAGE
  $ celocli governance:revokeupvote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Upvoter's address
  --globalHelp                                       View all available global flags

EXAMPLE
  revokeupvote --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/revokeupvote.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/revokeupvote.ts)

## `celocli governance:show`

Show information about a governance proposal, hotfix, or account.

```text
Show information about a governance proposal, hotfix, or account.

USAGE
  $ celocli governance:show

OPTIONS
  --account=account                    Address of account or voter
  --globalHelp                         View all available global flags
  --hotfix=hotfix                      Hash of hotfix proposal
  --jsonTransactions=jsonTransactions  Output proposal JSON to provided file

  --nonwhitelisters                    If set, displays validators that have not
                                       whitelisted the hotfix.

  --notwhitelisted                     List validators who have not whitelisted the
                                       specified hotfix

  --proposalID=proposalID              UUID of proposal to view

  --raw                                Display proposal in raw bytes format

  --whitelisters                       If set, displays validators that have whitelisted
                                       the hotfix.

ALIASES
  $ celocli governance:show
  $ celocli governance:showhotfix
  $ celocli governance:showaccount
  $ celocli governance:view
  $ celocli governance:viewhotfix
  $ celocli governance:viewaccount

EXAMPLES
  show --proposalID 99

  show --proposalID 99 --raw

  show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658

  show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658
  --whitelisters

  show --hotfix 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658
  --nonwhitelisters

  show --account 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code:_ [_src/commands/governance/show.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/show.ts)

## `celocli governance:upvote`

Upvote a queued governance proposal

```text
Upvote a queued governance proposal

USAGE
  $ celocli governance:upvote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Upvoter's address
  --globalHelp                                       View all available global flags

  --proposalID=proposalID                            (required) UUID of proposal to
                                                     upvote

EXAMPLE
  upvote --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/upvote.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/upvote.ts)

## `celocli governance:vote`

Vote on an approved governance proposal

```text
Vote on an approved governance proposal

USAGE
  $ celocli governance:vote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --globalHelp                                       View all available global flags

  --proposalID=proposalID                            (required) UUID of proposal to vote
                                                     on

  --value=(Abstain|No|Yes)                           (required) Vote

EXAMPLE
  vote --proposalID 99 --value Yes --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/vote.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/vote.ts)

## `celocli governance:whitelisthotfix`

Whitelist a governance hotfix

```text
Whitelist a governance hotfix

USAGE
  $ celocli governance:whitelisthotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Whitelister's address
  --globalHelp                                       View all available global flags

  --hash=hash                                        (required) Hash of hotfix
                                                     transactions

EXAMPLE
  whitelisthotfix --hash
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/whitelisthotfix.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/whitelisthotfix.ts)

## `celocli governance:withdraw`

Withdraw refunded governance proposal deposits.

```text
Withdraw refunded governance proposal deposits.

USAGE
  $ celocli governance:withdraw

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Proposer's address
  --globalHelp                                       View all available global flags

EXAMPLE
  withdraw --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code:_ [_src/commands/governance/withdraw.ts_](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/withdraw.ts)

