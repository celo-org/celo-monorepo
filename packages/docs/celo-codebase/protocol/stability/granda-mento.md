# Granda Mento

Granda Mento, described in [CIP 38](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0038.md), is a mechanism for exchanging large amounts of CELO for Celo stable tokens that aren't suitable for [Mento](doto.md) or over-the-counter (OTC).

Mento has proven effective at maintaining the stability of Celo's stable tokens, but the intentionally limited liquidity of its constant-product market maker results in meaningful slippage when exchanging tens of thousands of tokens at a time. Slippage is the price movement experienced by a trade. Generally speaking, larger volume trades will incur more slippage and execute at a less favorable price for the trader.

Similar to Mento, exchanges through Granda Mento are effectively made against the reserve. Purchased stable tokens are created into existence ("minted"), and sold stable tokens are destroyed ("burned"). Purchased CELO is taken from the reserve, and sold CELO is given to the reserve. For example, a sale of 50,000 CELO in exchange for 100,000 cUSD would involve the 50,000 CELO being transferred to the reserve and the 100,000 cUSD being created and given to the exchanger.

At the time of writing, exchanging about 50,000 cUSD via Mento results in a slippage of about 2%. Without Granda Mento, all launched Celo stable tokens can only be minted and burned using Mento, with the exception of cUSD that is minted as validator rewards each epoch. Granda Mento was created to enable institutional-grade liquidity to mint or burn millions of stable tokens at a time.

The mainnet Granda Mento contract address is `0x03f6842B82DD2C9276931A17dd23D73C16454a49` ([link](https://explorer.celo.org/address/0x03f6842B82DD2C9276931A17dd23D73C16454a49)).

## How it works

A Granda Mento exchange requires rough consensus from the Celo community and, unlike the instant and atomic Mento exchanges, involves the exchanger locking their funds to be sold for multiple days before they are exchanged.

### Design

At a high level, the life of an exchange is:

1. Exchanger creates an "exchange proposal" on-chain that locks their funds to be sold and calculates the amount of the asset being purchased according the current oracle price and a configurable spread.
2. If rough consensus from the community is achieved, a multi-sig (the "approver") that has been set by Governance approves the exchange proposal on-chain.
3. To reduce trust in the approver multi-sig, a veto period takes place where any community member can create a governance proposal to "veto" an approved exchange proposal.
4. After the veto period has elapsed, the exchange is executable by any account. The exchange occurs with the price locked in at stage (1).

### Processes

Processes surrounding Granda Mento exchanges, like how to achieve rough consensus from the community, are outlined in [CIP 46](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0046.md). At the minimum, it takes about 7 days to achieve rough consensus.

### How to create an exchange proposal

Refer to [CIP 46](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0046.md) for information surrounding processes.

The easiest way create an exchange proposal on-chain is using the `celocli grandamento:propose` command ([docs here](https://docs.celo.org/command-line-interface/commands/grandamento#celocli-grandamento-propose)). For example:

```
celocli grandamento:propose --from=0xc1912fEE45d61C87Cc5EA59DaE31190FFFFf232d --sellCelo=true --stableToken=cUSD --value=20000000000000000000000
```

### How to view exchange proposals

Exchange proposal information, including the token and quantities being sold and bought, can be easily viewed using celocli.

To list all exchange proposals that have been proposed and are not yet cancelled, vetoed, or executed, use the `celocli grandamento:list` command ([docs here](https://docs.celo.org/command-line-interface/commands/grandamento#celocli-grandamento-list)). For example:

```
celocli grandamento:list
```

To show a specific exchange proposal regardless of it being proposed, cancelled, vetoed, or executed, use the `celocli grandamento:show` command ([docs here](https://docs.celo.org/command-line-interface/commands/grandamento#celocli-grandamento-show)). For example:

```
celocli grandamento:show --proposalID 1
```

### How to cancel an exchange proposal

The exchanger of an exchange proposal can cancel the exchange proposal if the proposal has not yet been approved. This can be done using the `celocli grandamento:cancel` command ([docs here](https://docs.celo.org/command-line-interface/commands/grandamento#celocli-grandamento-cancel)). For example:

```
celocli grandamento:cancel --proposalID 1
```

If an exchange proposal has already been approved or someone other than the exchanger wishes to cancel (or "veto") an exchange proposal, this must be done by a governance proposal. CIP 46 provides information on the exact details of the governance proposal [here](https://github.com/celo-org/celo-proposals/blob/master/CIPs/cip-0046.md#vetoing-an-exchange-proposal).

### How to view current Granda Mento parameters

Granda Mento's governable parameters can be viewed using the `celocli network:parameters` command ([docs here](https://docs.celo.org/command-line-interface/commands/network#celocli-network-parameters)). For example:

```
celocli network:parameters
```