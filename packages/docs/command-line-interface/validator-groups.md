# Validator Groups

The **validatorgroup** module provides information about validator groups and tools to manage and vote for them.

### **List**

To display the validator groups that exist in the Celo ecosystem use the **list** command.

USAGE

`$ celocli validatorgroup:list`

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

### **Register**

To register an account as a new validator group use the **register** command. A validator group id, name, minimum notice period of 60 days for the bonded deposit, and a url are required as parameters. In addition, prior to registering as a validator group an account must have a minimum bonded deposit of one Celo Gold.

USAGE

`$ celocli validatorgroup:register`

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

`--from=ADDRESS` \(required\) Address for the Validator Group

`--id=id` \(required\)

`--name=name` \(required\)

`--noticePeriod=noticePeriod` \(required\) Notice Period for the Bonded deposit to use

`--url=url` \(required\)

EXAMPLE

`celocli validatorgroup:register --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --id myID --name myNAme --noticePeriod 5184000 --url "http://vgroup.com"`

### **Member**

For validator group owners that want to manage the list of validators in their group should use the **member** command. They can either accept an incoming affiliation with **`--accept`** flag or remove a validator from their list with the **`--remove`** flag. This command takes a valiator’s address as parameter.

USAGE

`$ celocli validatorgroup:member VALIDATORADDRESS`

ARGUMENTS

`VALIDATORADDRESS` Validator's address

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

`--accept` Accept a validator whose affiliation is already set to the group

`--from=ADDRESS` \(required\) ValidatorGroup's address

`--remove` Remove a validator from the members list

EXAMPLES

`celocli validatorgroup:member --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --accept 0x97f7333c51897469e8d98e7af8653aab468050a3`

`celocli validatorgroup:member --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --remove 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95`

### **Show**

To see information about validators in a group use the **show** command. The following information for each validator is shown: address, id, name, url, and member list. This command takes a validator group account address as a parameter.

USAGE

`$ celocli validatorgroup:show GROUPADDRESS`

ARGUMENTS

`GROUPADDRESS` ValidatorGroup's address

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

EXAMPLE

`celocli validatorgroup:show 0x97f7333c51897469E8D98E7af8653aAb468050a3`

### **Vote**

Celo Gold holders can vote a validation group using the **vote** command. An Celo Gold holder can vote for at most one group per epoch. This command takes a voter and validator group addresses as parameters.

USAGE

`$ celocli validatorgroup:vote`

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

`--current` Show voter's current vote

`--for=ADDRESS` Set vote for ValidatorGroup's address

`--from=ADDRESS` \(required\) Voter's address

`--revoke` Revoke voter's current vote

EXAMPLES

`celocli validatorgroup:vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --for 0x932fee04521f5fcb21949041bf161917da3f588b`

`celocli validatorgroup:vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --revoke`

`celocli validatorgroup:vote --from 0x4443d0349e8b3075cba511a0a87796597602a0f1 --current`
