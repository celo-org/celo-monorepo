---
description: View and manage validators
---

## Commands

### Affiliate

Affiliate to a ValidatorGroup

```
USAGE
  $ celocli validator:affiliate GROUPADDRESS

ARGUMENTS
  GROUPADDRESS  ValidatorGroup's address

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's address

EXAMPLE
  affiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95 0x97f7333c51897469e8d98e7af8653aab468050a3
```

_See code: [packages/cli/src/commands/validator/affiliate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/affiliate.ts)_

### Deaffiliate

DeAffiliate to a ValidatorGroup

```
USAGE
  $ celocli validator:deaffiliate

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's address

EXAMPLE
  deaffiliate --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validator/deaffiliate.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/deaffiliate.ts)_

### Deregister

Deregister a Validator

```
USAGE
  $ celocli validator:deregister

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Signer or Validator's address

EXAMPLE
  deregister --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validator/deregister.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/deregister.ts)_

### List

List registered Validators

```
USAGE
  $ celocli validator:list

EXAMPLE
  list
```

_See code: [packages/cli/src/commands/validator/list.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/list.ts)_

### Register

Register a new Validator

```
USAGE
  $ celocli validator:register

OPTIONS
  --blsKey=0x                                        (required) BLS Public Key
  --blsPop=0x                                        (required) BLS Proof-of-Possession
  --ecdsaKey=0x                                      (required) ECDSA Public Key
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --ecdsaKey
  0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf
  997eda082ae1 --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4
  db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsPop
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900
```

_See code: [packages/cli/src/commands/validator/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/register.ts)_

### Requirements

Get Requirements for Validators

```
USAGE
  $ celocli validator:requirements

EXAMPLE
  requirements
```

_See code: [packages/cli/src/commands/validator/requirements.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/requirements.ts)_

### Show

Show information about an existing Validator

```
USAGE
  $ celocli validator:show VALIDATORADDRESS

ARGUMENTS
  VALIDATORADDRESS  Validator's address

EXAMPLE
  show 0x97f7333c51897469E8D98E7af8653aAb468050a3
```

_See code: [packages/cli/src/commands/validator/show.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/show.ts)_

### Update-bls-public-key

Update BLS key for a validator

```
USAGE
  $ celocli validator:update-bls-public-key

OPTIONS
  --blsKey=0x                                        (required) BLS Public Key
  --blsPop=0x                                        (required) BLS Proof-of-Possession
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address

EXAMPLE
  update-bls-key --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --blsKey
  0x4fa3f67fc913878b068d1fa1cdddc54913d3bf988dbe5a36a20fa888f20d4894c408a6773f3d7bde11154f2a3076b700d345a42fd25a0e5e83f4
  db5586ac7979ac2053cd95d8f2efd3e959571ceccaa743e02cf4be3f5d7aaddb0b06fc9aff00 --blsPop
  0xcdb77255037eb68897cd487fdd85388cbda448f617f874449d4b11588b0b7ad8ddc20d9bb450b513bb35664ea3923900
```

_See code: [packages/cli/src/commands/validator/update-bls-public-key.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/update-bls-public-key.ts)_
