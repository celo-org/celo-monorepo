# Slashing

{% hint style="success" %}
**Roadmap:** Implementation of the design in this section is underway and is subject to change.
{% endhint %}

## Overview

Slashing accomplishes punishment of misbehaving validators by seizing a portion of their stake. Without these punishments, for example, the Celo Protocol would be subject to the [nothing at stake](https://github.com/ethereum/wiki/wiki/Proof-of-Stake-FAQ#what-is-the-nothing-at-stake-problem-and-how-can-it-be-fixed) problem. Validator misbehavior is classified as a set of slashing conditions below.

## Enforcement Mechanisms

The protocol has three means of recourse for validator misbehavior. Each slashing condition applies a combination of these, as described below.

* **Slashing of validator and group stake -** Some slashing conditions take a fixed amount of the Locked Gold stake put up by a validator. In these cases, the group through which that validator was elected for the epoch in which the slashing condition was proven is also slashed the same fixed amount.

* **Suppression of future rewards -** Every validator group has a **slashing penalty**, initially `1.0`. All rewards to the group and to voters for the group are weighted by this factor. If a validator is slashed, the group through which that validator was elected for the epoch in which it misbehaved has the value of its slashing penalty halved. So long as no further slashing occurs, the slashing penalty is reset to `1.0` after `slashing_penalty_reset_epochs` epochs.

* **Ejection -** When a validator is slashed, it is immediately removed from the group of which it is currently a member (even if this group is not the group that elected the validator at the point the misbehavior was recorded). Since no changes in the active validator set are made during an epoch, this means an elected validator continues participate in consensus until the end of the epoch. The group can choose to re-add the validator at any point, provided the usual conditions are met (including that the validator has sufficient Locked Gold as stake).

## Slashing Conditions

There are three categories of slashing conditions:

* Automatic \(initiated and verified on-chain\)
* Provable \(initiated off-chain, verifiable on-chain\)
* Governed \(verified only by off-chain knowledge\)

### Automatic

Automatic slashing conditions are enforced entirely through the protocol, and require no external information. Any Celo Gold slashed from stakes is transferred to the [Community Fund](community-fund.md).

**Persistent downtime -** If the absolute number of signatures for an elected validator during an epoch is less than a small fraction of total blocks in the epoch, the protocol automatically slashes the validator and group 100 Celo Gold, suppresses future rewards, and (most importantly in this case) ejects the validator from its current group.

### Provable

Provable slashing conditions cannot be initiated automatically on chain but information provided from an external source can be definitively verified on-chain.

In exchange for sending a transaction which initiates a successful provable slashing condition  on-chain, the initiator receives a portion of the slashed amount (which will always be greater than the gas costs of the proof). The remainder of the slashed amount is sent to the [Community Fund](community-fund.md).

**Double Signing -** A validator which can be shown to have produced BLS signatures for 2 distinct blocks at the same height but with different parent hashes will be slashed. Details are work in progress.

### **Governed**

For misbehavior which is harder to formally classify and requires some off-chain knowledge, slashing can be performed via [governance proposals](../governance.md). These conditions are important for preventing nuanced validator attacks.
