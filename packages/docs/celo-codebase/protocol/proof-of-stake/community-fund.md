# Community Fund

The Community Fund provides for general upkeep of the Celo platform. Celo Gold holders decide how to allocate these funds through governance proposals. Funds might be used to pay bounties for bugs or vulnerabilities, security audits, or grants for protocol development.

The Community Fund receives assets from three sources:

- The Community Fund obtains a desired epoch reward defined as a fraction of the total desired epoch rewards \(governable, initially planned to be $$25\%$$\). This amount is subject to adjustment up or down in the event of under- or over-spending against the epoch rewards target schedule. The Community Fund epoch rewards may be redirected to [bolster the Reserve](#bolster-reserve).

- The Community Fund is the default destination for slashed assets.

- The Community Fund also receives the 'base' portion of [transaction fees](../transactions/gas-pricing.md).

## <a name="bolster-reserve"></a>Bolstering the Reserve

The rewards to the Community Fund are automatically redirected to the reserve during times in which the reserve ratio \(the ratio of reserve value over stablecoin market capitalization\) is below a cutoff value. This cutoff reduces from two to one over the first of 25 years in a linear fashion and remains at one afterwards.
