---
description: >-
  Celo Gold holders can earn rewards by bonding Celo Gold pending they are also
  participating in validator elections and governance proposals. The bonds
  module provides tools to manage bonded deposits.
---

# Bonded Deposits

## **Commands**

### **Register**

Celo Gold holders that want to start earning rewards should use the register command to create an account.

USAGE

`$ celocli bonds:register`

OPTIONS

`--from <address>` \(required\) account address to sign transaction with

EXAMPLE

`celocli bonds:register --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d`

### **Deposit**

After account registration, account holders must put up a staking value and define a notice period using the deposit command. This command takes a Celo Gold amount and notice period as parameters. Upon transaction confirmation, a corresponding bonded deposit will be created on-chain.

USAGE

`$ celocli bonds:deposit`

OPTIONS

`--goldAmount <integer>` \(required\) unit amount of gold token \(cGLD\)

`--noticePeriod <integer>` \(required\) duration \(seconds\) from notice to withdrawable; doubles as ID of a bonded deposit

`--from <address>` \(required\) account address to sign transaction with

EXAMPLE

`celocli bonds:deposit --goldAmount=1000000000000000000 --noticePeriod=8640 --from= 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95`

### **Rewards**

To manage rewards accrued by bonded deposits, account holders can use the rewards command. Rewards can be delegated to an account managed by an ephemeral PPK pair with the delegate flag.

USAGE

`$ celocli bonds:rewards`

OPTIONS

`-d, --delegate <address>` Delegate rewards to provided account

`--from <address>` \(required\) account address to sign transaction with

EXAMPLES

`celocli bonds:rewards --delegate 0x56e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95`

### **Notify**

Account holders who want to revoke their bonded deposits should use the notify command to convert a bonded deposit to a notified deposit. Since bonded deposits are keyed by notice period, this command takes a notice period to identify the bond for which to withdraw the Celo Gold amount. The remainder of the Celo Gold remains bonded with the same notice period.

USAGE

`$ celocli bonds:notify`

OPTIONS

`--goldAmount <integer>` \(required\) unit amount of gold token \(cGLD\)

`--noticePeriod <integer>` \(required\) duration \(seconds\) from notice to withdrawable; doubles as ID of a bonded deposit

`--from <address>` \(required\) account address to sign transaction with

EXAMPLE

`celocli bonds:notify --goldAmount=500 --noticePeriod=3600 --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95`

### **Withdraw**

After a notified deposits' notice period has elapsed, Celo Gold holders can use the withdraw command to receive the Celo Gold that was scheduled for withdrawal. This command takes an availability time as a parameter, which equates to \(time of notice + notice period\). These times should be retrieved using the list/show commands.

USAGE

`$ celocli bonds:withdraw AVAILABILITYTIME`

ARGUMENTS

`AVAILABILITYTIME <timestamp>` unix timestamp at which withdrawable; doubles as ID of a notified deposit

OPTIONS

`--from <address>` \(required\) account address to sign transaction with

EXAMPLE

`celocli bonds:withdraw 1562206887 --from=0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95`

### **List**

To view information about all bonded and notified deposits for an account, users can use the list command. This command takes an account address as a parameter.

USAGE

`$ celocli bonds:list ACCOUNT`

ARGUMENTS

`ACCOUNT <address>` registered account address to query deposits for

EXAMPLE

`celocli bonds:list 0x5409ed021d9299bf6814279a6a1411a7e866a631`

### **Show**

To view specific information about an account's individual bonded or notified deposits, Celo Gold holders can use the show command. This command takes a notice period or availability time and an account address as parameters.

USAGE

`$ celocli bonds:show ACCOUNT`

ARGUMENTS

`ACCOUNT <address>` registered account address to query deposits for

OPTIONS

`--noticePeriod <integer>` duration \(seconds\) from notice to withdrawable; doubles as ID of a bonded deposit

`--availabilityTime <timestamp>` unix timestamp at which withdrawable; doubles as ID of a notified deposit

EXAMPLES

`celocli bonds:show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --noticePeriod=3600`

`celocli bonds:show 0x5409ed021d9299bf6814279a6a1411a7e866a631 --availabilityTime=1562206887`
