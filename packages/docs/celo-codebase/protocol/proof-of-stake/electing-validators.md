# Electing Validators

In addition to bonding funds, Celo Gold account holders must also vote for validators and participate in governance to earn rewards.

Users don’t vote for validators directly. Instead, validators are expected to organize themselves into groups and account holders vote for these validator groups. A validator group is essentially an ordered list of validators, along with metadata like name and URL.

Just as anyone in a democracy can create their own political party, or seek to get selected to represent a party in an election, any Celo user can create a validator group and add themselves to it, or set up a potential validator and work to get an existing validator group to include them. There can be up to 100 validators in a group.

We anticipate that a number of validator groups will emerge, including from organizations that have a long-term interest in the success of the Celo network, and that some will gain a reputation for ensuring their associated validators have known real-world identities, have high uptime, are well maintained and regularly audited.

Validator elections are held once every epoch, which corresponds to approximately once a day. This balances rapidly replacing offline validators with minimizing unnecessary churn in the validator set.

Celo Gold account holders are expected to vote every epoch and are allowed to cast a single vote for a validator group, not a validator. This reduces search costs for account holders as they only have to screen a set of groups instead of a potentially large number of validators. Voting power is proportional to the bonded weight of the account holder. To reduce the burden on users, the same vote is applied to each subsequent election unless and until it is changed. In addition, to avoid keeping keys online, each account may delegate their right to vote to exactly one address as long as that address is not already used as an account and that it has not received other delegations. The election selects validators using a closed party form of proportional representation via the [D’Hondt method](https://medium.com/r/?url=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FD%2527Hondt_method).
