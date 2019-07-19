---
description: 'Working proposal, subject to change.'
---

# Epoch Rewards

## **Overview**

This section describes the current working proposal for how epoch rewards are distributed in Celo. Epoch rewards are similar to the familiar notion of block rewards in other blockchains; inflation of the currency as blocks are produced. They are minted and distributed on the last block of every epoch to different recipients, namely: Stakers, validators, the community fund and the reserve.

A total of 400 million Celo Gold will be released for epoch rewards over time. Celo Gold is one of Celo’s reserve currencies and can be used as utility token in Celo. It has a fixed total supply and in the long term will exhibit deflationary characteristics like Bitcoin.

The size of the disbursements is determined at the end of every epoch via a two-step-process: In step one, economically desired payments are derived. In step two, these desired payments are adjusted to generate a drift towards a predefined target epoch rewards schedule. This two-step-process aims at solving the tradeoff between paying reasonable rewards in terms of purchasing power and avoiding excessive over- or underspending with respect to a predefined epoch rewards schedule. More detail about the two steps is provided below.

## **Step 1: Determine desired payments**

### **Validators**

The proposed scheme to determine the desired epoch rewards for validators aims at incentivizing validator uptime performance while ensuring that payments are economically reasonable in size independent of fluctuations of the price of Celo Gold .

Validators are eligible for epoch payments if they proposed at least one block during the epoch. The desired epoch rewards to validators are determined by a flat fee in Celo Dollar times a validator specific performance factor. The flat fee can be varied by governance but it is supposed to cover reasonable cost plus a margin for validators. Celo starts with a flat fee of 75,000 Celo Dollar \(subject to change\) per year per validator which is derived from the following assumptions:

- The annual cost of running and securing a validator node, including overhead: 60,000 Celo Dollar
- Profit margin: $$20\%$$
- Flat fee to validators : $$annual\_val\_fee = \frac{60,000}{1 - 0.2} = 75,\!000$$ Celo Dollar

The flat fee is multiplied by a $$performance\_factor$$ that accounts for the validators’ uptime performance during the epoch. Desired validator epoch rewards thus results as:

$$
des\_val\_rewards =

performance\_factor \frac{annual\_val\_fee}{epochs\_per\_annum}
$$

Validator epoch rewards are distributed in Celo Dollars and the reserve receives the equivalent amount of Celo Gold as compensation for minting the required Celo Dollars disbursements.

### **Stakers**

The proposed scheme to determine desired rewards for staking aims at achieving a target Celo Gold bonding percentage while incentivizing stakers to vote for performant groups.

Stakers are eligible for epoch payments if they voted for a validator group that had a validator elected during the epoch. The total desired epoch payments to stakers are calculated with respect to the difference between the target percentage of Celo Gold bonded and the current percentage of Celo Gold bonded \(relative to outstanding Celo Gold\). The target percentage of bonded Celo Gold is governable and set to 50% initially. The protocol dynamically increases \(decreases\) the rewards for staking if the current percentage of bonded Celo Gold is below \(above\) the target. Additionally, the total rewards, defined as a percentage of total bonded Celo Gold, are constrained to remain in a governable interval $$[y_{min}, y_{max}]$$.

The total rewards for staking are distributed proportional to the bonded weight of the each account and adjusted by a $$group\_performance\_factor$$ that accounts for the uptime performance of the elected validator group.

### Community Fund & Reserve

The Community Fund obtains a desired epoch payment defined as a fraction of the total desired epoch rewards \(governable, initially planned to be $$25\%$$\). The community decides how to allocate these funds further through governance proposals. Funds might be used to pay bounties for bugs or vulnerabilities, security audits, or grants for development.

The reserve automatically receives a fraction of the desired epoch payments to the Community Fund during times in which the reserve ratio \(the ratio of reserve value over stablecoin market capitalization\) is below a predefined target schedule. The size of the epoch payment to the reserve is calculated based on a half-life calculation to bring the reserve back to its target level. The reserve ratio target schedule as well as the half-life period \(initially planned to be 10 years\) are governable.

### **Step 2: Adjust desired payments to track target schedule**

There is a target schedule for the release of Celo Gold epoch rewards. The proposed target curve \(subject to change\) of remaining epoch rewards declines linearly over 15 years to 50% of the initial 400 million Celo Gold and experiences an exponential decay with half life of $$h = ln(2)\times15 =10.3$$ afterwards. The choice of $$h$$ guarantees a smooth transition from the linear to the exponential regime.

![](https://storage.googleapis.com/celo-website/docs/epoch-rewards-schedule.png)

The total rewards paid out at the end of a given epoch result from multiplying the total desired epoch rewards \(derived in step 1\) with an adjustment factor. This adjustment factor is a function of the percentage deviation of the remaining epoch rewards from the target epoch rewards remaining. It evaluates to 1 if the remaining epoch rewards are at the target and to smaller \(larger\) than 1 if the remaining rewards are below \(above\) the target. This creates a drag towards the target schedule. The sensitivity of the adjustment factor to the percentage deviation from the target is governable.

The proposed scheme for calculating desired staking rewards aims achieving a target Celo Gold bonding percentage while also incentivizing to vote for performant validator groups.

Stakers are eligible for epoch payments if they voted for a validator group that had a validator elected during the epoch. The total desired epoch payments to stakers are calculated with respect to the difference between the target percentage of Celo Gold bonded and the current overall percentage of Celo Gold bonded \(relative to outstanding Celo Gold\). The target percentage of bonded Celo Gold is governable and set to 50% initially. The protocol dynamically increases \(decreases\) the rewards for staking if the current percentage of bonded Celo Gold is below \(above\) the target. Additionally, the total rewards, as a percentage of total bonded Celo Gold, are constrained to remain in the interval $$[y_{min}, y_{max}]$$.
