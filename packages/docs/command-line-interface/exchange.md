---
description: >-
  The exchange module allows you to interact with the Exchange -  the smart
  contract that ensures Celo Dollar’s stability and provides an always-liquid
  Celo Dollar - Celo Gold decentralized exchange.
---

# Exchange

## Commands

### List

List information about tokens on the exchange \(all amounts in wei\).

USAGE

`$ celocli exchange:list`

Options

`--amount=amount` amount of sellToken to report rates for \(defaults to 1000000000000000000\)

### Selldollar, sellgold

Commands for trading on the exchange.

USAGE

`$ celocli exchange:selldollar SELLAMOUNT MINBUYAMOUNT FROM`

`$ celocli exchange:sellgold SELLAMOUNT MINBUYAMOUNT FROM`

EXAMPLE

`celocli exchange:selldollar 100 300 0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d`
