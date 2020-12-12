# Oracles

As mentioned in the previous section, the stability mechanism needs to know the market price of CELO with respect to the US dollar. This value is made available on-chain in the SortedOracles smart contract.

Through governance, a whitelist of reporters is selected. These addresses are allowed to make reports to the SortedOracles smart contract. The smart contract keeps a list of most recent reports from each reporter. To make it difficult for a dishonest reporter to manipulate the oraclized rate, the official value of the oracle is taken to be the _median_ of this list.

To ensure the oracle's value doesn't go stale due to inactive reporters, any reports that are too old can be removed from the list. "Too old" here is defined based on a protocol parameter that can be modified via governance.

