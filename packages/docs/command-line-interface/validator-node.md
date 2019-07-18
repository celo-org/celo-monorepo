# Validator Node

The **validator** module provides information about validators and tools to manage them.

### **List**

To display the validators that exist in the Celo ecosystem use the **list** command.

USAGE

`$ celocli validator:list`

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

### **Register**

To register an account as a new validator use the **register** command. A validator id, name, minimum notice period of 60 days for the bonded deposit, a public key corresponding to the one used for participating in consensus, and a url are required as parameters. In addition, prior to registering as a validator group an account must have a minimum bonded deposit of one Celo Gold.

USAGE

`$ celocli validator:register`

OPTIONS

`-h, --help show CLI help`

`-l, --logLevel=logLevel`

`--from=ADDRESS` \(required\) Address for the Validator

`--id=id` \(required\)

`--name=name` \(required\)

`--noticePeriod=noticePeriod` \(required\) Notice Period for the Bonded deposit to use

`--publicKey=0x` \(required\) Public Key

`--url=url` \(required\)

### **Show**

To see information about a validator use the **show** command. This command takes a validator address as a parameter. The following information is displayed: address, id, name, public key used for consensus, and url.

USAGE

`$ celocli validator:show VALIDATORADDRESS`

ARGUMENTS

`VALIDATORADDRESS` Validator's address

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

### **Affiliation**

A validator must join a validator group to be eligible to participate in consensus. Validators can request to join a validator group with the **affiliation** command. Group membership is confirmed once the validator group owner accepts the affiliation request. This command takes a validator group address and validator address as parameters.

USAGE

`$ celocli validator:affiliation`

OPTIONS

`-h, --help` show CLI help

`-l, --logLevel=logLevel`

`--from=ADDRESS` \(required\) Validator's address

`--set=ADDRESS` set affiliation to given address

`--unset` clear affiliation field

EXAMPLES

`celocli validator:affiliation --set 0x97f7333c51897469e8d98e7af8653aab468050a3 --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95`

`celocli validator:affiliation --unset --from 0x47e172f6cfb6c7d01c1574fa3e2be7cc73269d95`
