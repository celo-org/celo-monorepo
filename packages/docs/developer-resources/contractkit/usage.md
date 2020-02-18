# ContractKit Usage

## Setting Default Tx Options

`kit` allows you to set default transaction options:

```ts
import { CeloContract } from '@celo/contractkit'

// default from
kit.defaultAccount = myAddress
// paid gas in cUSD
await kit.setFeeCurrency(CeloContract.StableToken)
```

## Getting the Total Balance

```ts
await kit.getTotalBalance(myAddress)
```


