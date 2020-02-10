---
description: Interact with on-chain governance proposals and hotfixes
---

## Commands

### Approve

Approve a dequeued governance proposal

```
USAGE
  $ celocli governance:approve

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Approver's address
  --proposalID=proposalID                            (required) UUID of proposal to approve

EXAMPLE
  approve --proposalID 99 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/approve.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/approve.ts)_

### Approvehotfix

Approve a governance hotfix

```
USAGE
  $ celocli governance:approvehotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Approver's address
  --hash=hash                                        (required) Hash of hotfix transactions

EXAMPLE
  approvehotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/approvehotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/approvehotfix.ts)_

### Execute

Execute a passing governance proposal

```
USAGE
  $ celocli governance:execute

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Executor's address
  --proposalID=proposalID                            (required) UUID of proposal to execute

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
  --salt=salt                                        (required) Secret salt associated with hotfix

EXAMPLE
  executehotfix --jsonTransactions ./transactions.json --salt
  0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/executehotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/executehotfix.ts)_

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
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Proposer's address
  --jsonTransactions=jsonTransactions                (required) Path to json transactions

EXAMPLE
  propose --jsonTransactions ./transactions.json --deposit 10000 --from 0x5409ed021d9299bf6814279a6a1411a7e866a631
  --descriptionURL https://gist.github.com/yorhodes/46430eacb8ed2f73f7bf79bef9d58a33
```

_See code: [packages/cli/src/commands/governance/propose.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/propose.ts)_

### Upvote

Upvote a queued governance proposal

```
USAGE
  $ celocli governance:upvote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Upvoter's address
  --proposalID=proposalID                            (required) UUID of proposal to upvote

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
  --hash=hash  (required) Hash of hotfix transactions
  --notyet     Whether to list validators who have or have not yet whitelisted

EXAMPLES
  viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658
  viewhotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --notyet
```

_See code: [packages/cli/src/commands/governance/viewhotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/viewhotfix.ts)_

### Vote

Vote on an approved governance proposal

```
USAGE
  $ celocli governance:vote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --proposalID=proposalID                            (required) UUID of proposal to vote on
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

EXAMPLE
  whitelisthotfix --hash 0x614dccb5ac13cba47c2430bdee7829bb8c8f3603a8ace22e7680d317b39e3658 --from
  0x5409ed021d9299bf6814279a6a1411a7e866a631
```

_See code: [packages/cli/src/commands/governance/whitelisthotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/whitelisthotfix.ts)_
