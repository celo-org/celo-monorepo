# Becoming a Validator

To participate in the network, an operator must put up a slashable commitment of locked CELO, register as a validator, and join a validator group. A minimum stake of one CELO and a notice period of 60 days is required to be a validator in the Alfajores Testnet.

Any account that meets the minimum stake and notice period requirements can register as a validator. By doing so, the locked funds on that account become ‘at risk’: a fraction of the stake can be slashed automatically for an evolving set of misbehaviors. In addition, the community can use governance proposals to slash funds, which avoids having to anticipate and encode in the protocol every possible misbehavior. As long as the CELO staked for a validator account is not slashed, it’s eligible to earn rewards like any other Locked Gold account.

A validator joins a validator group by affiliating itself with it. However, to avoid untrusted or malicious validators joining a group, the validator group must accept the affiliation. Once done, the validator is added to the list of validators in the group. A validator can remove itself from a validator group at any time. Changes only take effect at the next subsequent election, so if the validator is currently participating in consensus, it’s expected to do so until the end of the epoch in which it deregisters itself.
