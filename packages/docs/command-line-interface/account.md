---
description: The account module lets you interact with and monitor your Celo account.
---

# Account

## Commands

### Balance

View token balances given account address

USAGE

`$ celocli account:balance ACCOUNT`

### New

Creates a new account

USAGE

`$ celocli account:new`

### Transferdollar

USAGE

`$ celocli account:transferdollar`

Options

`--amountInWei=amountInWei` \(required\) Amount to transfer \(in wei\)

`--from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d` \(required\) Address of the sender

`--to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d` \(required\) Address of the receiver

### Transfergold

USAGE

`$ celocli account:transfergold`

Options

`--amountInWei=amountInWei` \(required\) Amount to transfer \(in wei\)

`--from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d` \(required\) Address of the sender

`--to=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d` \(required\) Address of the receiver

### Unlock

Unlock an account address to send transactions

USAGE

`$ celocli account:unlock`

Options

`--account=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d` \(required\) Account Address

`--password=password` \(required\)
