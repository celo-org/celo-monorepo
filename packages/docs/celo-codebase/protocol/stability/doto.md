# Stability Algorithm \(Mento\)

This section discusses the mechanism by which the supply of the Celo Dollar is achieved in the Celo protocol - the constant-product decentralized one-to-one mechanism \(CP-DOTO\). On a high level, Mento \(previously known as CP-DOTO\) allows user demand to determine the supply of celo stable assets by enabling users to create, for example, a new Celo Dollar by sending 1 US Dollar worth of CELO to the reserve, or to burn a Celo Dollar by redeeming it for 1 US Dollar worth of CELO. The mechanism requires an accurate [Oracle](oracles.md) value of the CELO to US Dollar market rate to work.

This creates incentives such that when demand for the Celo Dollar rises and the market price is above the peg, users can profit using their own efforts by buying 1 US Dollar worth of CELO on the market, exchanging it with the protocol for one Celo Dollar, and selling that Celo Dollar for the market price. Similarly, when demand for the Celo Dollar falls and the market price is below the peg, users can profit using their own efforts by purchasing Celo Dollar at the market price, exchanging it with the protocol for 1 US Dollar worth of CELO, and selling the CELO to the market.

In cases in which the CELO to US Dollar oracle value is not an accurate reflection of the market price, exploiting such discrepancies can lead to a depletion of the reserve. Mento, inspired by the [Uniswap](https://uniswap.io/) system, mitigates this risk of depletion as follows: The Celo protocol maintains two virtual buckets of CELO and Celo Dollar. The amounts in these virtual buckets are recalibrated every time the reported oracle value is updated, provided the difference between the current time and the oracle timestamp is less than $$oracle\_staleness\_threshold$$. The equation for the constant-product-market-maker model fixes the product of the wallet quantities

$$
G_t \times D_t = k
$$

where $$G_t$$ and $$D_t$$denote the quantities in the CELO and Celo Dollar buckets respectively and $$k$$ is some constant. Given the above rule, it can be shown that the price of CELO, to be paid in Celo Dollar units, is

$$
P_t = \frac{D_t}{G_t}
$$

for traded amounts that are small relative to the bucket quantities. Whenever the CELO to US Dollar oracle rate is updated, the protocol adjusts the bucket quantities such that they equalize the on-chain CELO to Celo Dollar exchange rate $$P_t$$ to the current oracle rate. During such a reset, the CELO bucket must remain smaller than the total reserve gold balance. To achieve this, the CELO bucket size is defined as the total reserve balance times $$gold\_bucket\_size$$, with $$0<gold\_bucket\_size<1$$ and the Celo Dollar bucket size is then chosen such that $$P_t$$ mirrors the oracle price. To discourage excessive on-chain trading, a transaction fee is imposed by adding small spread around the above exchange rate.

If the oracle precisely mirrors the market rate, the on-chain CELO to Celo Dollar rate will equal the CELO to US Dollar market rate and no profit opportunity will exist as long as Celo Dollar precisely tracks the US Dollar. If the oracle price is imprecise, the two rates will differ, and a profit opportunity will be present even if Celo Dollar accurately tracks the US Dollar. However, as traders exploit this opportunity, the on-chain price $$P_t$$ will dynamically adjust in response to changes in the tank quantities until the opportunity ceases to exist. This limits the depletion potential in Mento in the case of imprecise or manipulated oracle rates.

For a more detailed explanation, read the article [Zooming in on the Celo Expansion & Contraction Mechanism](https://medium.com/celoorg/zooming-in-on-the-celo-expansion-contraction-mechanism-446ca7abe4f).

## Multi-mento Deployment

Many instances of mento can be deployed in parallel for different stable assets. Currently, `cEUR` and `cUSD` live side-by-side, with independent buckets and oracle reports \(although both of them are using the same `SortedOracles` instance\). They all fill the CELO bucket with funds from the Reserve, but not necessarily at the same time.

