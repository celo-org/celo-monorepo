---
description: Approve a dequeued governance proposal
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
```

_See code: [packages/cli/src/commands/governance/executehotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/executehotfix.ts)_

### Preparehotfix

Prepare a governance hotfix for execution in the current epoch

```
USAGE
  $ celocli governance:preparehotfix

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Preparer's address
  --hash=hash                                        (required) Hash of hotfix transactions
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
```

_See code: [packages/cli/src/commands/governance/upvote.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/upvote.ts)_

### Vote

Vote on an approved governance proposal

```
USAGE
  $ celocli governance:vote

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Voter's address
  --proposalID=proposalID                            (required) UUID of proposal to vote on
  --vote=(Abstain|No|Yes)                            (required) Vote
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
```

_See code: [packages/cli/src/commands/governance/whitelisthotfix.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/governance/whitelisthotfix.ts)_
