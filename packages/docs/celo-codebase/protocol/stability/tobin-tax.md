# Tobin Tax

If the Celo reserve becomes undercollateralized, a small tax is levied on Celo gold transfers. Currently this is set to 0.5% and this parameter is modifiable via governance. This fee goes to the reserve smart contract.

The reserve is considered collateralized if its holding of Celo gold are greater than or equal to the value \(in Celo gold\) of the Celo dollar supply, i.e.

$$ReserveBalance \geq CeloDollarSupply \times ExchangeRate$$

where $$ExchangeRate$$comes from the SortedOracles smart contract, described in a previous section.
