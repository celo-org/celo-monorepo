---
description: View validator information and register your own
---

## Commands

### Affiliation

Manage affiliation to a ValidatorGroup

```
USAGE
  $ celocli validator:affiliation

OPTIONS
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Validator's address
  --set=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d   set affiliation to given address
  --unset                                            clear affiliation field

EXAMPLES
  affiliation --set 0x97f7333c51897469e8d98e7af8653aab468050a3 --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
  affiliation --unset --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95
```

_See code: [packages/cli/src/commands/validator/affiliation.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/affiliation.ts)_

### List

List existing Validators

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
  --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d  (required) Address for the Validator
  --id=id                                            (required)
  --name=name                                        (required)
  --noticePeriod=noticePeriod                        (required) Notice Period for the Bonded deposit to use
  --publicKey=0x                                     (required) Public Key
  --url=url                                          (required)

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myNAme --noticePeriod 5184000 --url
  "http://validator.com" --publicKey
  0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf
  997eda082ae1
```

_See code: [src/commands/validator/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/register.ts)_

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
