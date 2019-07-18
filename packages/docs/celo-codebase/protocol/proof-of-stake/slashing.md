---
description: Validators are held accountable for misbehavior with slashing.
---

# Slashing

{% hint style="success" %}
**Roadmap:** This section is subject to change.
{% endhint %}

### Overview

Slashing accomplishes punishment of misbehaving validators by seizing a portion of their stake. Without these punishments, for example, the Celo Protocol would be subject to the [nothing at stake](https://github.com/ethereum/wiki/wiki/Proof-of-Stake-FAQ#what-is-the-nothing-at-stake-problem-and-how-can-it-be-fixed) problem. Validator misbehavior is classified as a set of slashing conditions below.

{% hint style="warning" %}
**Alfajores Testnet:** Slashing of validator stakes will not be deployed throughout the course of the alpha network phase.
{% endhint %}

### Slashing Conditions

There are two categories of slashing conditions:

- Provable \(verifiable on-chain\)
- Governed \(using some off-chain knowledge\)

#### Provable

**Double Signing -** Validator which produces 2 separate signatures for blocks at the same height will be slashed by \[TBD\] percentage of their stake.

#### **Governed**

For misbehavior which is harder to formally classify and requires some off-chain knowledge, slashing can be performed via [governance proposals](../governance.md). These conditions are important for preventing nuanced validator attacks.

### Enforcement

To motivate enforcement of slashing conditions, positive incentives are introduced which encourage network participants to police validators. In exchange for sending a transaction which performs a successful slashing condition proof on-chain, enforcers receive a slice of the slash which is always greater than the gas costs of the proof. The remainder of the slash pie is sent to the reserve to bolster the stability mechanism.
