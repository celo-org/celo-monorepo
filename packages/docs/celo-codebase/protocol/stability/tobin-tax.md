# Tobin Tax

If the Celo reserve becomes under-collateralized, a small tax is levied on Celo Gold transfers. This fee is transferred to the `Reserve` smart contract. There is no gas charged for this transfer. This fee is currently set to `0.5%`, and is governable.

The reserve is considered collateralized if its holding of Celo Gold are greater than or equal to the value \(in Celo Gold\) of the Celo Dollar supply, i.e.:

```
ReserveBalance >= CeloDollarSupply * ExchangeRate
```

where `ExchangeRate` comes from the [price oracle](oracles.md) in the `SortedOracles` smart contract.
