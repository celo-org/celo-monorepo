# Validator Elections

The active validator set is updated by running an election in the final block of each epoch, after processing transactions and [Epoch Rewards](epoch-rewards/).

## Group Voting Caps

One way to consider the security of a proof-of-stake system is the marginal cost of getting a malicious validator elected. In a steady state, assuming the Celo community set the incentives appropriately, a full complement of validators is likely to be elected, which means the attack cost is the cost of acquiring sufficient CELO to receive more votes than the currently elected validator with fewest votes, and thereby supplant it.

As such, the objective of Celo’s validator elections differs from real-world elections: they aim to translate voter preferences into representation while promoting decentralization and creating a moat around existing, well-performing elected validators. Two design choices influence this: a limit on the maximum number of member validator that a group can list, and a **voting cap** on the number of votes that any one group can receive.

Since voting for a group can cause only the group’s member validators to get elected, and no more, votes in excess of the number needed to achieve that are unproductive in the sense that they do not raise the number of votes needed to get the least-voted-for validator elected. This would translate into a lower cost for a malicious actor to acquire enough CELO to supplant that validator. This is particularly true because the protocol limits the maximum number of members in a group, to promote decentralization.

The Celo protocol addresses this by enforcing a per-group vote cap. This cap is set to be the number of votes that would be needed to elect all of its validators, plus one more validator. The cap is enforced at the point of voting: a user can only cast a vote for a group if it currently has fewer votes than this cap. An account holder may not set or increase the amount of gold they have voting for a particular validator group `j`, if it already has at least `[(group_members_j + 1) / min(total_group_members, max_validators)]` of the total Locked Gold.

If a group adds a new validator, or the total amount of voting Locked Gold increases, the group’s cap rises and new votes are permitted. If a group removes a validator or a validator chooses to leave, or the total amount of voting Locked Gold falls, then the group’s cap falls: if it has more votes than this new cap, then new votes are no longer permitted, but all existing votes continue to be counted.

The Celo protocol allows an account to divide its vote between up to ten groups, since there may be cases where the vote cap prevents an account allocating its entire vote to its first choice group.

## Running the Election

![](https://storage.googleapis.com/celo-website/docs/election.jpg)

The `Election` contract is called from the IBFT block finalization code to select the validators for the following epoch. The contract maintains a sorted list of the Locked Gold voting \(either pending or activated\) for each Validator Group. The \[D’Hondt method\]\([https://en.wikipedia.org/wiki/D'Hondt\_method](https://en.wikipedia.org/wiki/D'Hondt_method)\), a closed party list form of proportional representation, is applied to iteratively select validators from the Validator Groups with the greatest associated vote balances.

The list of groups is first filtered to remove those that have not achieved a certain fraction of the votes of the total voting Locked Gold.

Then, in the first iteration, the algorithm assigns the first seat to the group that has at least one member and with the most votes. Thereafter, it assigns the seat to the group that would ‘pay’, if its next validator were elected, the highest vote averaged over its candidates that have been selected so far plus the one under consideration.

There is a minimum target and a maximum cap on the number of active validators that may be selected. If the minimum target is not reached, the election aborts and no change is made to the validator set this epoch.

