# Tobin Tax

If the Celo reserve ratio falls below `tobinTaxReserveRatio`, a small fee is levied on Celo Gold transfers to discourage further depletion of Celo Gold collateral. This fee is transferred to the `Reserve` smart contract. There is no gas charged for this transfer. The `tobinTaxReserveRatio` and the `tobinTax` are initially set to `200%` and `0.5%` respectively and are governable.

The total Celo reserve value, expressed in Celo Gold units, is approximated on-chain by dividing the reserve Celo Gold balance by the Celo Gold target asset allocation weight. The Celo reserve ratio is then computed by dividing the total reserve value by the value of Celo Dollar supply expressed in Celo Gold units.
