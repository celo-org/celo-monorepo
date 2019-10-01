---
description: Change the URL of the attestation service in a local metadata file
---

## Commands

### Change-attestation-service-url

Change the URL of the attestation service in a local metadata file

```
USAGE
  $ celocli identity:change-attestation-service-url FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --url=htttps://www.celo.org  (required) The url you want to claim

EXAMPLE
  change-attestation-service-url ~/metadata.json
```

_See code: [packages/cli/src/commands/identity/change-attestation-service-url.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/change-attestation-service-url.ts)_

### Change-domain

Change the domain in a local metadata file

```
USAGE
  $ celocli identity:change-domain FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --domain=domain  (required) The domain you want to claim

EXAMPLE
  change-domain ~/metadata.json
```

_See code: [packages/cli/src/commands/identity/change-domain.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/change-domain.ts)_

### Change-name

Change the name in a local metadata file

```
USAGE
  $ celocli identity:change-name FILE

ARGUMENTS
  FILE  Path of the metadata file

OPTIONS
  --name=name  (required) The name you want to claim

EXAMPLE
  change-name ~/metadata.json
```

_See code: [packages/cli/src/commands/identity/change-name.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/change-name.ts)_

### Create-metadata

Create an empty metadata file

```
USAGE
  $ celocli identity:create-metadata FILE

ARGUMENTS
  FILE  Path where the metadata should be saved

EXAMPLE
  create-metadata ~/metadata.json
```

_See code: [packages/cli/src/commands/identity/create-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/create-metadata.ts)_

### Get-metadata

Show information about an address

```
USAGE
  $ celocli identity:get-metadata ADDRESS

ARGUMENTS
  ADDRESS  Address to get metadata for

EXAMPLE
  get-metadata 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/identity/get-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/get-metadata.ts)_

### Register-metadata

Register metadata about an address

```
USAGE
  $ celocli identity:register-metadata

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Addess of the account to set metadata for
  --url=htttps://www.celo.org                        (required) The url to the metadata you want to register

EXAMPLE
  register-metadata --url https://www.celo.org --from 0x0
```

_See code: [packages/cli/src/commands/identity/register-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/register-metadata.ts)_

### Show-metadata

Show the data in a local metadata file

```
USAGE
  $ celocli identity:show-metadata FILE

ARGUMENTS
  FILE  Path of the metadata file

EXAMPLE
  show-metadata ~/metadata.json
```

_See code: [packages/cli/src/commands/identity/show-metadata.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/identity/show-metadata.ts)_
