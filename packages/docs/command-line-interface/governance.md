---
description: Interact with on-chain governance proposals and hotfixes
---

## Commands

### Dequeue

Try to dequeue governance proposal

```
USAGE
  $ celocli governance:dequeue

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) From address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  dequeue --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/dequeue.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/dequeue.ts)_

### Execute

Execute a passing governance proposal

```
USAGE
  $ celocli governance:execute

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Executor's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --proposalID=proposalID                            (required) UUID of proposal to execute

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  execute --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/execute.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/execute.ts)_

### Executehotfix

Execute a governance hotfix prepared for the current epoch

```
USAGE
  $ celocli governance:executehotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Executors's address
  --jsonTransactions=jsonTransactions                (required) Path to json transactions

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --salt=salt                                        (required) Secret salt associated with hotfix

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  executehotfix --jsonTransactions ./transactions.json --salt
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/executehotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/executehotfix.ts)_

### Hashhotfix

Hash a governance hotfix specified by JSON and a salt

```
USAGE
  $ celocli governance:hashhotfix

OPTIONS
  --jsonTransactions=jsonTransactions            (required) Path to json transactions of the hotfix

  --ledgerAddresses=ledgerAddresses              [default: 1] If --useLedger is set, this will get the first N addresses
                                                 for local signing

  --ledgerConfirmAddress                         Set it to ask confirmation for the address of the transaction from the
                                                 ledger

  --ledgerCustomAddresses=ledgerCustomAddresses  [default: [0]] If --useLedger is set, this will get the array of index
                                                 addresses for local signing. Example --ledgerCustomAddresses "[4,99]"

  --salt=salt                                    (required) Secret salt associated with hotfix

  --useLedger                                    Set it to use a ledger wallet

EXAMPLE
  hashhotfix --jsonTransactions ./transactions.json --salt
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658
```

_See code: [packages/cli/src/commands/governance/hashhotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/hashhotfix.ts)_

### List

List live governance proposals (queued and ongoing)

```
USAGE
  $ celocli governance:list

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/governance/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/list.ts)_

### Preparehotfix

Prepare a governance hotfix for execution in the current epoch

```
USAGE
  $ celocli governance:preparehotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Preparer's address
  --hash=hash                                        (required) Hash of hotfix transactions

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  preparehotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/preparehotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/preparehotfix.ts)_

### Propose

Submit a governance proposal

```
USAGE
  $ celocli governance:propose

OPTIONS
  --deposit=deposit                                  (required) Amount of Gold to attach to proposal

  --descriptionURL=descriptionURL                    (required) A URL where further information about the proposal can
                                                     be viewed

  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Proposer's address

  --jsonTransactions=jsonTransactions                (required) Path to json transactions

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  propose --jsonTransactions ./transactions.json --deposit 10000 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
  --descriptionURL https://gist.github.com/yorhodes/46430eacb8ed2f73f7bf79bef9d58a33
```

_See code: [packages/cli/src/commands/governance/propose.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/propose.ts)_

### Revokeupvote

Revoke upvotes for queued governance proposals

```
USAGE
  $ celocli governance:revokeupvote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Upvoter's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  revokeupvote --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/revokeupvote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/revokeupvote.ts)_

### Upvote

Upvote a queued governance proposal

```
USAGE
  $ celocli governance:upvote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Upvoter's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --proposalID=proposalID                            (required) UUID of proposal to upvote

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  upvote --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/upvote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/upvote.ts)_

### View

View governance proposal information from ID

```
USAGE
  $ celocli governance:view

OPTIONS
  --proposalID=proposalID  (required) UUID of proposal to view
  --raw                    Display proposal in raw bytes format

EXAMPLES
  view --proposalID 99
  view --proposalID 99 --raw
```

_See code: [packages/cli/src/commands/governance/view.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/view.ts)_

### Viewhotfix

View information associated with hotfix

```
USAGE
  $ celocli governance:viewhotfix

OPTIONS
  --hash=hash        (required) Hash of hotfix transactions
  --nonwhitelisters  If set, displays validators that have not whitelisted the hotfix.
  --whitelisters     If set, displays validators that have whitelisted the hotfix.

EXAMPLES
  viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658
  viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --whitelisters
  viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --nonwhitelisters
```

_See code: [packages/cli/src/commands/governance/viewhotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/viewhotfix.ts)_

### Vote

Vote on an approved governance proposal

```
USAGE
  $ celocli governance:vote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --proposalID=proposalID                            (required) UUID of proposal to vote on

  --useLedger                                        Set it to use a ledger wallet

  --value=(Abstain|No|Yes)                           (required) Vote

EXAMPLE
  vote --proposalID 99 --value Yes --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/vote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/vote.ts)_

### Whitelisthotfix

Whitelist a governance hotfix

```
USAGE
  $ celocli governance:whitelisthotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Whitelister's address
  --hash=hash                                        (required) Hash of hotfix transactions

  --ledgerAddresses=ledgerAddresses                  [default: 1] If --useLedger is set, this will get the first N
                                                     addresses for local signing

  --ledgerConfirmAddress                             Set it to ask confirmation for the address of the transaction from
                                                     the ledger

  --ledgerCustomAddresses=ledgerCustomAddresses      [default: [0]] If --useLedger is set, this will get the array of
                                                     index addresses for local signing. Example --ledgerCustomAddresses
                                                     "[4,99]"

  --useLedger                                        Set it to use a ledger wallet

EXAMPLE
  whitelisthotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/whitelisthotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/whitelisthotfix.ts)_
