# Penalties

## Overview

Slashing accomplishes punishment of misbehaving validators by seizing a portion of their stake. Without these punishments, for example, the Celo Protocol would be subject to the [nothing at stake](https://github.com/ethereum/wiki/wiki/Proof-of-Stake-FAQ#what-is-the-nothing-at-stake-problem-and-how-can-it-be-fixed) problem. Validator misbehavior is classified as a set of slashing conditions below.

## Enforcement Mechanisms

The protocol has three means of recourse for validator misbehavior. Each slashing condition applies a combination of these, as described below.

* **Slashing of validator and group stake -** Some slashing conditions take a fixed amount of the Locked Gold stake put up by a validator. In these cases, the group through which that validator was elected for the epoch in which the slashing condition was proven is also slashed the same fixed amount. A validator or group's stake may be forfeit while it is registered or, after being deregistered, during the notice period \(60 days for validators, 180 days for groups\) and before the amount is withdrawn from the `LockedGold` contract.
* **Suppression of future rewards -** Every validator group has a **slashing penalty**, initially `1.0`. All rewards to the group and to voters for the group are weighted by this factor. If a validator is slashed, the group through which that validator was elected for the epoch in which it misbehaved has the value of its slashing penalty halved. So long as no further slashing occurs, the slashing penalty is reset to `1.0` after `slashing_penalty_reset_epochs` epochs.
* **Ejection -** When a validator is slashed, it is immediately removed from the group of which it is currently a member \(even if this group is not the group that elected the validator at the point the misbehavior was recorded\). Since no changes in the active validator set are made during an epoch, this means an elected validator continues participate in consensus until the end of the epoch. The group can choose to re-add the validator at any point, provided the usual conditions are met \(including that the validator has sufficient Locked Gold as stake\).

## Slashing Conditions

There are three categories of slashing conditions:

* Provable \(initiated off-chain, verifiable on-chain\)
* Governed \(verified only by off-chain knowledge\)

### Provable

Provable slashing conditions cannot be initiated automatically on chain but information provided from an external source can be definitively verified on-chain.

In exchange for sending a transaction which initiates a successful provable slashing condition on-chain, the reporter receives a "reward", a portion of the slashed amount \(which will always be greater than the gas costs of the proof\). The reward is added to the reporter's balance of non-voting LockedGold. The remainder of the slashed amount is sent to the [Community Fund](epoch-rewards/community-fund.md).

* **Persistent downtime -** A validator which can be shown to be absent from 8640 consecutive BLS signatures will be slashed 100 CELO, have future rewards suppressed, and \(most importantly in this case\) will be ejected from its current group.
* **Double Signing -** A validator which can be shown to have produced BLS signatures for 2 distinct blocks at the same height and in the same consensus round but with different hashes will be slashed 9000 CELO, have future rewards suppressed, and will be ejected from its current group. Note that unlike some proof-of-stake networks, Celo does not penalize validators for double signing regular consensus messages. In particular, one side-effect of how Celo provides liveness can result in cases where honest validators may legitimately double sign blocks across different rounds at the same height \(Cosmos terms this [amnesia](https://github.com/tendermint/spec/blob/fa3430ad163a2a0ed77aa3f624a70cd9b8b84b78/spec/consensus/signing.md#other-rules) and also specifically excludes it from slashing\).

### **Governed**

For misbehavior which is harder to formally classify and requires some off-chain knowledge, slashing can be performed via [governance proposals](../governance.md). These conditions are important for preventing nuanced validator attacks.

