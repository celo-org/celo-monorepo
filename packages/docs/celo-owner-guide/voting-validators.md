# Voting for Validator Groups

Validators play a critical role in the Celo protocol, determining which transactions get applied and producing new blocks. Selecting organizations that operate well-run infrastructure to perform this role effectively is essential for Celo's long-term success.

The Celo community makes these decisions by locking CELO and voting for [Validator Groups](../celo-codebase/protocol/proof-of-stake/validator-groups.md), intermediaries that sit between voters and Validators. Every Validator Group has an ordered list of up to 5 candidate Validators. Some organizations may operate a group with their own Validators in it; some may operate a group to which they have added Validators run by others.

{% hint style="info" %}
If you would like to keep up-to-date with all the news happening in the Celo community, including validation, node operation and governance, please sign up to our [Celo Signal mailing list here](https://celo.activehosted.com/f/15).

You can add the [Celo Signal public calendar](https://calendar.google.com/calendar/u/0/embed?src=c_9su6ich1uhmetr4ob3sij6kaqs@group.calendar.google.com) as well which has relevant dates.
{% endhint %}

## Validator Elections

[Validator elections](../celo-codebase/protocol/proof-of-stake/validator-elections.md) are held every epoch \(approximately once per day\). The protocol elects a maximum of 100 Validators. At each epoch, every elected Validator must be re-elected to continue. Validators are selected [in proportion](../celo-codebase/protocol/proof-of-stake/validator-elections.md#Running-the-Election) to votes received for each Validator Group.

If you hold CELO, or are a beneficiary of a [`ReleaseGold` contract](release-gold.md) that allows voting, you can vote for Validator Groups. A single account can split their LockedGold balance to have outstanding votes for up to 10 groups.

CELO that you lock and use to vote for a group that elects one or more Validators receives [epoch rewards](../celo-codebase/protocol/proof-of-stake/epoch-rewards/) every epoch \(approximately every day\) once the community passes a governance proposal enabling rewards. The initial level of rewards is anticipated to be around 6% per annum equivalent \(but is subject to change\).

Unlike a number of Proof of Stake protocols, **CELO used for voting is never at risk**. The actions of the Validator Groups or Validators you vote for can cause you to receive lower or higher rewards, but the CELO you locked will always be available to be unlocked in the future. [Slashing](../getting-started/glossary.md#slashing) in the Celo protocol applies only to Validators and Validator Groups.

## Choosing a Validator Group

As a CELO holder, you have the opportunity to impact the Celo network by voting for Validator Groups. As Validators play an integral role in securing Celo, it is crucial that voters choose groups that contribute to both the technical health of the network, as well as the community. Some factors to consider when deciding which Validator Group to vote for include:

### Technical

* **Proven identity:** Validators and groups can supply [verifiable DNS claims](../validator-guide/validator-explorer.md). You can use these to securely identify that the same entity has access both to the account of a Validator or group and the supplied DNS records.
* **Can receive votes**: Validator Groups can receive votes up to a certain [voting cap](../celo-codebase/protocol/proof-of-stake/validator-elections.md#group-voting-caps). You cannot vote for groups with a balance that would put it beyond its cap.
* **Will get elected**: CELO holders only receive voter rewards during an epoch if their CELO is used to vote for a Validator Group that elects at least one Validator during that epoch. Put another way, your vote does not contribute to securing the network or earning you rewards if your group does not receive enough other votes to elect at least one Validator.
* **Secure**: The operational security of Validators is essential for everyone's use of the Celo network. All Validators that participated in the Stake Off were eligible for a [security audit](https://medium.com/celoorg/the-celo-Validator-community-security-audits-and-lessons-learned-e67b78cd4123). You can see scores under the "Master Validator Challenge" column in the [Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true). Scores of 80% or greater were awarded the "Master Validator" badge, indiciating a serious proven commitment to operational security.
* **Reliable**: Celo's consensus protocol relies on two-thirds of elected Validators being available in order to produce blocks and process transactions. Voter rewards are directly tied to the [uptime score](../celo-codebase/protocol/proof-of-stake/epoch-rewards/validator-rewards.md#calculating-uptime-score) of all elected Validators in the group for which the vote was made. Any period of consecutive downtime greater than a minute reduces a Validator's uptime score.
* **No recent slashing:** When Validators and groups register, their Locked Gold becomes "staked", in that it is subject to penalties for conduct that could seriously adversely affect the health of the network. Voters' Locked Gold is never slashed, but voter rewards are affected by a group's [slashing penalty](../celo-codebase/protocol/proof-of-stake/epoch-rewards/validator-rewards.md#calculating-slashing-penalty), which is halved when a group or one of its Validators is slashed. Look for groups with a last slashing time long in the past, ideally `0` \(never\), and a slashing penalty value of `1.0`.
* **Runs an Attestation Service**: The [Attestation Service](../celo-codebase/protocol/identity/) is an important service that Validators can run that allows users to verify that they have access to a phone number and map it to an address. Supporting Validators that run this service makes it easier for new users to begin using Celo.
* **Runs a Validator on Baklava**: A group that runs a Validator on the [Baklava](../getting-started/baklava-testnet/) helps maintain the testnet and verify that upgrades to the Celo Blockchain software can be deployed smoothly.

### Community

* **Promotes the Celo mission**: Celo's mission is to [build a monetary system that creates the conditions of prosperity for all](https://medium.com/celoorg/an-introductory-guide-to-celo-b185c62d3067). Consider Validator Groups that further this mission through their own activities or initiatives around financial inclusion, education and sustainability.
* **Broadens Diversity**: The Celo community aims to be inclusive to the largest number of contributors, with the most varied and diverse backgrounds possible. Support that diversity by considering what new perspectives and strengths the teams you support offer. As well as the backgrounds and experiences of the team, consider that the network security and availability is improved by Validators operating at different network locations, on different platforms, and with different toolchains.
* **Contributes to Celo:** Support Validator Groups that strengthen the Celo developer community, for example through building or operating services for the Celo ecosystem, participating actively in on-chain governance, and answering questions and supporting others, on [Discord](https://chat.celo.org) or the [Forum](https://forum.celo.org).

## The Celo Foundation Voting Policy

As described above, there are many criteria to consider when deciding which group to vote for. While it is highly recommended that all CELO holders do their independent research when deciding which group to vote for, another option is to vote for Validator Groups that have received votes from the Celo Foundation.

The Celo Foundation has a [Validator Group voting policy](../validator-guide/celo-foundation-voting-policy.md) that it follows when voting with the CELO that it holds. This policy has been developed by the Foundation board and technical advisors with the express goal of promoting the long-term security and decentralization of the network. Validator Groups have an opportunity to apply for Foundation votes every 3 months, and a new cohort is selected based on past performance and contributions.

You can find the [full set of Validator Groups currently receiving votes, and their addresses linked here](https://docs.google.com/spreadsheets/d/1ltVNkQfXW3lIZxXU52R3IXeD6w21oacWFVb3a-FYRBY/edit?usp=sharing).

## Validator Explorers

The Celo ecosystem includes a number of great services for browsing registered Validator Groups and Validators.

{% hint style="warning" %}
**Warning**: Exercise caution in relying on Validator-supplied names to determine their real-world identity. Malicious participants may attempt to impersonate other Validators in order to attract votes.

Validators and groups can also supply [verifiable DNS claims](../validator-guide/validator-explorer.md), and the Celo Validator Explorer displays these. You can use these to securely identify that the same entity has access both to the account of a Validator or group and the supplied DNS records.
{% endhint %}

### [Celo Validator Explorer](https://validators.celo.org) \(cLabs\)

The Celo Validator Explorer has tabs to show either Mainnet or the Baklava Testnet.

The list shows Validator Groups and, when you expand each group, the Validators that are affiliated to that group.

A white check mark next to the name of a Validator Group shows that there is one or more DNS metadata claims verified for that group \(see below\).

The Votes Available column shows:

* On the left: Votes made for the group, as a percentage of the total Locked Gold
* On the right: The voting cap of that group, as a percentage of the total Locked Gold
* In the middle: votes made for the group as a proportion of the voting cap

### [TheCelo](https://thecelo.com) \(Bi23 Labs\)

TheCelo contains a range of valuable information on the Celo project and active Celo networks. The "Groups" tab shows a detailed view of Validator Groups. Click on a group to drilldown to see group metadata and affiliated Validators.

### [Celo Whale](https://celowhale.com) \(DSRV\)

Celo Whale shows detailed metadata and statistics around Validators but does not presently offer a view centered on Validator Groups.

### [Celovote Scores](https://celovote.com/scores) \(WOTrust \| celovote.com\)

Celovote shows ranking of validator groups based on their estimated annual rate of return \(ARR\). Estimate is calculated based on past performance.

### [Cauldron](https://cauldron.pretoriaresearchlab.io/block-map) \( [Pretoria Research Lab GmbH](https://pretoriaresearchlab.io)\)

Cauldron is a tooling site containing a signed blocks explorer for Mainnet and Baklava testnet, visualizing missed blocks and patterns for the validator group set, and developer faucets for the Alfajores and Baklava test networks.

_Please raise a Pull Request against_ [_this page_](https://github.com/celo-org/celo-monorepo/blob/master/packages/docs/celo-holder-guide/voting-validators.md) _to add/amend details of any community services!_

