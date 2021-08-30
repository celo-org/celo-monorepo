# Rewards for Validators and Validator Groups

The protocol aims to incentivize validator uptime performance and penalize past poor behavior in future rewards, while ensuring that payments are economically reasonable in size independent of fluctuations of the price of CELO.

Five factors affect validator and group rewards:

* The on-target reward amount for this epoch
* The protocol's [overall spending vs target of epoch rewards](./)
* The validator’s ‘uptime score’
* The current value of the slashing penalty for the group of which it was a member at the last election
* The group share for the group of which it was a member at the last election

Epoch rewards to validators and validator groups are denominated in Celo Dollars, since it is anticipated that most of their expenses will be incurred in fiat currencies, allowing organizations to understand their likely return regardless of volatility in the price of CELO. To enable this, the protocol mints new Celo Dollars that correspond to the epoch reward equivalent of CELO which are maintained on chain to preserve the collateralization ratio. Of course, the effect on the target schedule depends on the prevailing exchange rate.

![](https://storage.googleapis.com/celo-website/docs/validator-rewards.jpg)

## On-target Rewards

The on-target validator reward is a constant value \(as block rewards typically would be\) and is intended to cover costs plus an attractive margin for amortized capital and operating expenses associated with a recommended set up that includes redundant hosts with hardware wallets in a secure co-lo facility, proxy nodes at cloud or edge hosting providers, as well as security audits. As with most parameters of the Celo protocol, it can be changed by governance proposal.

In the usual case where no validator in the group has been slashed recently, and the validator has signed almost every block in the epoch, then the validator receives the full amount of the on-target reward, less the fraction sent to the validator group based on the group share. Unlike in some other proof-of-stake schemes, epoch rewards to validators do not depend on the number of votes the validator’s group has received.

## Calculating Uptime Score

The Celo protocol tracks an ‘uptime score’ for each validator. When a validator proposes a block, it also includes in the block body every signature that it has received from validators committing the previous block.

![](https://storage.googleapis.com/celo-website/docs/uptime-score.jpg)

For a validator to be ‘up’ at a given block, it must have its signature included in at least one in the previous twelve blocks. This cannot be done during the first 11 blocks of the epoch. At each epoch, this counter is reset to 0. Because the proposer order is shuffled at each election, it is very hard for a malicious actor withholding an honest validator’s signatures to affect this measure.

Then, a validator’s uptime for the epoch is the proportion of blocks in the epoch for which it is ‘up’: `U = counter/ (epoch_size - 11)`. Its epoch uptime score `S_ve = u ^ k`, where `k` is a governable constant. This means that downtime of less than around a minute does not count against the validator, but that longer periods begin to reduce the score rapidly.

The validator’s overall uptime score is an exponential moving average of the uptime score from this and previous epochs. `S_{v} = min(S_ve, S_ve * x + S_{v-1} * (1 -x))` where `0 < x < 1` and is governable. Since `S_v` starts out at zero, validators have a disincentive to change identities and an incentive to prioritize activities that improve long-term availability.

## Calculating Slashing Penalty

The protocol also tracks for each group a ‘slashing penalty’, initially equal to one but successively reduced on each occasion a validator in that group is slashed. The penalty returns to one 30 days after it was last reduced.

This factor is applied to all rewards to validators in that group, to the group itself, and to voters for the group.

The slashing penalty gives groups a further incentive to vet validators they accept as members, not only to avoid reducing their own future rewards from existing validators but to attract and retain the best validators.

Validators have an incentive to be elected through groups with a high value, so a recent slashing makes a group less attractive. Validators also have an incentive to select groups where they believe careful vetting processes are in place, because poor vetting of other validators in the group reduces their own expectation of future rewards.

When a validator is slashed, reduced rewards may lead other validators in the same group to consider equivalently ‘safe’ slots in other groups, if they are available. A validator disassociating from the group would cause the group’s rewards to further decline. While that may cause churn in the set of groups through which validators are elected, it is unlikely that a validator would move to a group where they could not be elected \(since in this case they would receive no rewards, as opposed to fewer rewards\), hence making the votes by which they were previously elected unproductive.

## Group Share

Validator groups are compensated by taking a share of the rewards allocated to validators. Validator groups set a **group share** rate when they register, and can change that at any time. The protocol automatically deducts this share, sending that portion of the epoch rewards to the validator group of which they were a member at the time of the last election.

Since the sum of a validator’s reward and its validator group’s reward are the same regardless of the ‘group share’ that the group chooses, no side-channel collusion is possible to avoid deductions for downtime or previous slashing.

