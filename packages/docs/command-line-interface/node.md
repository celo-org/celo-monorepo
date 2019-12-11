---
description: Manage your Celo node
---

## Commands

### Accounts

List the addresses that this node has the private keys for.

```
USAGE
  $ celocli node:accounts

OPTIONS
  --[no-]truncate  Truncate fields to fit line
```

_See code: [packages/cli/src/commands/node/accounts.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/node/accounts.ts)_

### Synced

Check if the node is synced

```
USAGE
  $ celocli node:synced

OPTIONS
  --[no-]truncate  Truncate fields to fit line
  --verbose        output the full status if syncing
```

_See code: [packages/cli/src/commands/node/synced.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/node/synced.ts)_
