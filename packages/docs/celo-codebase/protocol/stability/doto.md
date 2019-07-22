# Stability Algorithm \(CP-DOTO\)

This section discussed the mechanism by which adjustments of monetary supply are achieved in the Celo protocol - the constant-product decentralized one-to-one mechanism \(CP-DOTO\). This mechanism can be seen as the decentralized version of the one-to-one issuance and redemption mechanisms of most fiat-backed stablecoins. On a high level, CP-DOTO allows users to create new Celo Dollar by sending 1 US Dollar worth of Celo Gold to the reserve, or to burn Celo Dollar by redeeming them for 1 US Dollar worth of Celo Gold. This creates incentives such that when demand for the Celo Dollar rises and the market price is above the peg, a profit can be achieved by buying 1 US Dollar worth of Celo Gold on the market, exchanging it with the protocol for one Celo Dollar, and selling that Celo Dollar for the market price. Similarly, when demand for the Celo Dollar falls and the market price is below the peg, a profit can be achieved by purchasing Celo Dollar at the market price, exchanging it with the protocol for 1 US Dollar worth of Celo Gold, and selling the Celo Gold to the market.

For the above mechanism to work, a precise oracle value of the Celo Gold to US Dollar market rate is required at every point in time. In cases in which the Celo Gold to US Dollar oracle value is imprecise, profit opportunities exist even if Celo Dollar is perfectly pegged and such unintended profit opportunities can lead to a depletion of the reserve. The Celo protocol, therefore, uses a constant-product-market-maker model, inspired by the [Uniswap](https://uniswap.io/) system, to mitigate the depletion potential of one-to-one issuances and redemptions. This mechanism works as follows: The reserve maintains two virtual buckets of Celo Gold and Celo Dollar. These virtual buckets are reset every time the reported oracle value is updated, provided the difference between the current time and the oracle timestamp is less than $$oracle\_staleness\_threshold$$. The central equation for the constant-product-market-maker model fixes the product of the wallet quantities

$$
G_t \times D_t = k
$$

where $$G_t$$ and $$D_t$$denote the quantities in the Celo Gold and Celo Dollar buckets respectively and $$k$$ is some constant. Given the above rule, it can be shown that the price of Celo Gold, to be paid in Celo Dollar units, is

$$
P_t = \frac{D_t}{G_t}
$$

for traded amounts that are small relative to the bucket quantities. Whenever the Celo Gold to US Dollar oracle rate is updated, the protocol adjusts the bucket quantities such that they lead to an on-chain Celo Gold to Celo Dollar exchange rate $$P_t$$which equals the current oracle rate. During such a reset, the Celo Gold bucket must remain smaller than the total reserve gold balance. To achieve this, the Celo Gold bucket size is defined as the total reserve balance times $$gold\_bucket\_size$$, with $$0<gold\_bucket\_size<1$$ and the Celo Dollar bucket size is then chosen such that $$P_t$$ mirrors the oracle price. To mitigate excessive on-chain trading, a small spread around the above exchange rate is added.

If the oracle precisely mirrors the market rate, the on-chain Celo Gold to Celo Dollar rate will equal the Celo Gold to US Dollar market rate and no profit opportunity will exist as long as Celo Dollar is pegged. If the oracle price is imprecise, the two rates will differ, and a profit opportunity will be present even if Celo Dollar is pegged. However, as traders exploit this opportunity, the on-chain price $$P_t$$ will dynamically adjust in response to changes in the tank quantities until the opportunity ceases to exist. This limits the depletion potential in the CP-DOTO mechanism in the case of imprecise or manipulated oracle rates.
