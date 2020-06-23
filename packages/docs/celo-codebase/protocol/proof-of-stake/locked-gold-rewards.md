# Rewards to Locked Gold

Holders of Locked Gold that voted in the previous epoch for a group that elected one or more validators and have activated their votes are eligible for rewards. Rewards are added directly to the Locked Gold voting for that group, and re-applied as votes for that same group, so future rewards are compounded without the account holder needing to take any action. The voting process is described further [here](locked-gold.md).

Rewards to Locked Gold are totally independent from validator and validator group rewards, and are not subject to the ‘group share’.

![](https://storage.googleapis.com/celo-website/docs/locked-gold-rewards.jpg)

First, an on-target reward rate is determined. The protocol has a target for the proportion of circulating CELO that is locked and used for voting, and adjusts the reward rate to increase or reduce the attractiveness of locking up additional supply. This aims to balance having sufficient liquidity for CELO, while making it more challenging to buy enough CELO to meaningfully influence the outcome of a validator election.

Adjusting the on-target reward rate to account for under- or over-spending against the target schedule gives a baseline reward, essentially the percentage increase for a unit of Locked CELO voting for a group eligible for rewards.

The reward for activated Locked Gold voting for a given group is determined as follows. First, if the group elected no validators in the current epoch, rewards are zero. Otherwise, the baseline reward rate factors in two deductions. It is multiplied by the slashing penalty for the group, and by the average epoch uptime score for validators in the group elected in the current epoch. Finally, the group's activated pool of Locked Gold is increased by this rate.
