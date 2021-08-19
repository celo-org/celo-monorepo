# Granda Mento

Granda Mento, described in [CIP 38](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0038.md), is a mechanism for exchanging large amounts of CELO for Celo stable tokens that aren't suitable for [Mento](doto.md) or over-the-counter (OTC).

Mento has proven effective at maintaining the stability of Celo's stable tokens, but the intentionally limited liquidity of its constant-product market maker results in meaningful slippage when exchanging tens of thousands of tokens at a time. Slippage is the price movement experienced by a trade-- generally speaking, larger volume trades will have more slippage and execute at a less favorable price for the trader.

Similar to Mento, exchanges through Granda Mento are effectively made against the reserve. Purchased stable tokens are created into existence ("minted"), and sold stable tokens are destroyed ("burned"). Purchased CELO is taken from the reserve, and sold CELO is given to the reserve. For example, a sale of 50,000 CELO in exchange for 100,000 cUSD would involve the 50,000 CELO being transferred to the reserve and the 100,000 cUSD being created and given to the exchanger.

At the time of writing, exchanging about 50,000 cUSD via Mento results in a slippage of about 2%. Without Granda Mento, all launched Celo stable tokens can only be minted and burned using Mento (with the exception of cUSD that is minted as validator rewards each epoch). Granda Mento was created to enable institutional-grade liquidity to mint or burn millions of stable tokens at a time.

## How it works

A Granda Mento exchange requires rough consensus from the Celo community and, unlike the instant and atomic Mento exchanges, involves the exchanger locking their funds to be sold for multiple days before they are exchanged.

### High level design

At a high level, the life of an exchange is:

1. Exchanger creates an "exchange proposal" on-chain that locks their funds to be sold and locks-in the current oracle price.
2. If rough consensus from the community is achieved, a multi-sig (the "approver") that has been set by Governance approves the exchange proposal on-chain.
3. To reduce trust in the approver multi-sig veto period takes place where community members can create a governance proposal to "veto" an exchange proposal.
4. After the veto period has elapsed, anyone can execute the exchange. The exchange occurs with the price locked in at stage (1).

### Processes

Processes surrounding Granda Mento exchanges are outlined in a Meta CIP, CIP XX.

#### How to submit an exchange proposal

