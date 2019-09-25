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

  --noticePeriod=noticePeriod                        (required) Notice period of the Locked Gold commitment. Specify
                                                     multiple notice periods to use the sum of the commitments.

  --publicKey=0x                                     (required) Public Key

  --url=url                                          (required)

EXAMPLE
  register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myName --noticePeriod 5184000
  --noticePeriod 5184001 --url "http://validator.com" --publicKey
  0xc52f3fab06e22a54915a8765c4f6826090cfac5e40282b43844bf1c0df83aaa632e55b67869758f2291d1aabe0ebecc7cbf4236aaa45e3e0cfbf
  997eda082ae19d3e1d8f49f6b0d8e9a03d80ca07b1d24cf1cc0557bdcc04f5e17a46e35d02d0d411d956dbd5d2d2464eebd7b74ae30005d223780d
  785d2abc5644fac7ac29fb0e302bdc80c81a5d45018b68b1045068a4b3a4861c93037685fd0d252d7405011220a66a6257562d0c26dabf64485a1d
  96bad27bb1c0fd6080a75b0ec9f75b50298a2a8e04b02b2688c8104fca61fb00
```

_See code: [packages/cli/src/commands/validator/register.ts](https://github.com/celo-org/celo-monorepo/tree/master/packages/cli/src/commands/validator/register.ts)_

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
