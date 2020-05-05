# Voting on Validator Groups

## Proof of Stake Election Essentials

Validators play a critical role in the Celo protocol, determining which transactions get applied and producing new blocks. Selecting organizations that operate well-run infrastructure to perform this role effectively is essential for Celo's long-term success.

The Celo community makes these decisions through elections for [Validator Groups](../celo-codebase/protocol/proof-of-stake/validator-groups.md), intermediaries between voters and Validators. Every Validator Group has an ordered list of up to 5 candidate Validators. Some organizations may operate a group with their own Validators in it; some may operate a group to which they have added Validators run by others.

[Validator elections](../celo-codebase/protocol/proof-of-stake/validator-elections.md) are held every epoch (approximately once per day). The protocol elects a maximum of 100 Validators. At each epoch, every elected Validator must be re-elected to continue. Validators are selected [in proportion](../celo-codebase/protocol/proof-of-stake/validator-elections.md#Running-the-Election) to votes received for each Validator Group.

If you hold Celo Gold, or are a beneficiary of a [`ReleaseGold` contract](release-gold.md) that allows voting, you can vote for Validator Groups. A single account can split their LockedGold balance to have outstanding votes for up to 10 groups.

Celo Gold that you lock and use to vote for a group that elects one or more Validators receives [epoch rewards](../celo-codebase/protocol/proof-of-stake/epoch-rewards.md) every epoch (approximately every day) once the community passes a governance proposal enabling rewards. The initial level of rewards is anticipated to be around 6% per annum equivalent (but is subject to change).

Unlike a number of Proof of Stake protocols, Celo Gold used for voting is never at risk. The actions of the Validator Groups or Validators you vote for can cause you to receive lower or higher rewards, but the Celo Gold you locked will always be available to be unlocked in the future.

## Validator and Validator Group Explorers

The Celo ecosystem includes a number of great services for browsing registered Validator Groups and Validators.

{% hint style="warning" %}
**Warning**: Exercise caution in relying on Validator-supplied names to determine their real-world identity. Malicious participants may attempt to impersonate other Validators in order to attract votes.

Validators and groups can also supply [verifiable DNS claims](../operations-manual/validator-explorer.md), and the Celo Validator Explorer displays these. You can use these to securely identify that the same entity has access both to the account of a Validator or group and the supplied DNS records.
{% endhint %}

### [Celo Validator Explorer](https://validators.celo.org) (cLabs)

The Celo Validator Explorer has tabs to show either Release Candidate or Baklava networks.

The list shows Validator Groups and, when you expand each group, the Validators that are affiliated to that group.

A white check mark next to the name of a Validator Group shows that there is one or more DNS metadata claims verified for that group (see below).

The Votes Available column shows:

- On the left: Votes made for the group, as a percentage of the total Locked Gold

- On the right: The voting cap of that group, as a percentage of the total Locked Gold

- In the middle: votes made for the group as a proportion of the voting cap

### [TheCelo](https://thecelo.com) (Bi23 Labs)

TheCelo contains a range of valuable information on the Celo project and active Celo networks. The "Groups" tab shows a detailed view of Validator Groups. Click on a group to drilldown to see group metadata and affiliated Validators.

### [Celo Whale](https://celowhale.com) (DSRV)

Celo Whale shows detailed metadata and statistics around Validators but does not presently offer a view centered on Validator Groups.

_Please raise a Pull Request against [this page](https://github.com/celo-org/celo-monorepo/blob/master/packages/docs/celo-gold-holder-guide/voting-validators.md) to add/amend details of any community services!_

## Choosing a Validator Group

You might consider these factors when choosing a Validator Group for whom to vote:

- **Proven identity:** You are sure the Validator Group (and their associated Validators) are who they say they are using DNS claims, described above.

- **Can receive votes**: Validator Groups can receive votes up to a certain [voting cap](../celo-codebase/protocol/proof-of-stake/validator-elections.md#group-voting-caps). You cannot vote for groups with a balance that would put it beyond its cap.

- **Participated in The Great Celo Stake Off**: [The Great Celo Stake Off](https://forum.celo.org/t/the-great-celo-stake-off-the-details/136) was a Validator challenge that ran on the [Baklava Testnet](../getting-started/baklava-testnet.md) between November 2019 and March 2020. Its aims were to help organizations interested in operating Celo Validators build operational experience. Validators that participated have had an opportunity to build tooling, understand the Celo protocol, and in many cases undergo a security audit. The [final Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true) is public, although addresses that Validators used for the Stake Off are different to those on the Mainnet Release Candidate network.

- **Will get elected**: Locked Gold only receives voter rewards during an epoch if it is used to vote for a Validator Group that elects at least one Validator during that epoch. Put another way, your vote does not contribute to securing the network or earning you rewards if your group does not receive enough other votes to elect a Validator.

- **Secure**: The operational security of Validators is essential for everyone's use of the Celo network. All Validators that participated in the Stake Off were eligible for a [security audit](https://medium.com/celoorg/the-celo-Validator-community-security-audits-and-lessons-learned-e67b78cd4123). You can see scores under the "Master Validator Challenge" column in the [Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true). Scores of 80% or greater were awarded the "Master Validator" badge, indiciating a serious proven commitment to operational security.

- **Reliable**: Celo's consensus protocol relies on two-thirds of elected Validators being available in order to produce blocks and process transactions. Voter rewards are directly tied to the [uptime score](../celo-codebase/protocol/proof-of-stake/validator-rewards.md#calculating-uptime-score) of all elected Validators in the group for which the vote was made. Any period of consecutive downtime greater than a minute reduces a Validator's uptime score.

- **No recent slashing:** When Validators and groups register, their Locked Gold becomes "staked", in that it is subject to penalties for conduct that could seriously adversely affect the health of the network. Voters' Locked Gold is never slashed, but voter rewards are affected by a group's [slashing penalty](../celo-codebase/protocol/proof-of-stake/validator-rewards.md#calculating-slashing-penalty), which is halved when a group or one of its Validators is slashed. Look for groups with a last slashing time long in the past, ideally `0` (never), and a slashing penalty value of `1.0`.

- **Runs an Attestation Service**: The [Attestation Service](../celo-codebase/protocol/identity/README.md) is an important service that Validators can run that allows users to verify that they have access to a phone number and map it to an address. Supporting Validators that run this service makes it easier for new users to begin using Celo.

- **Runs a Validator on Baklava**: A group that runs a Validator on the [Baklava Testnet](../getting-started/baklava-testnet.md) has more opportunity to improve their setup and verify that upgrades to the Celo Blockchain software can be deployed smoothly. They are also contributing to a community resource.

- **Receives Celo Foundation votes**: The Celo Foundation has a [Validator Group voting policy](../operations-manual/celo-foundation-voting-policy.md) that it applies in order to promote the long-term security and decentralization of the network. You may weigh the Celo Foundation's judgement as one factor in selecting a Validator Group.

- **Promotes the Celo mission**: Celo's mission is to [build a monetary system that creates the conditions of prosperity for all](https://medium.com/celoorg/an-introductory-guide-to-celo-b185c62d3067). Consider Validator Groups that further this mission through their own activities or initiatives around financial inclusion, education and sustainability.

- **Broadens Diversity**: The Celo community aims to be inclusive to the largest number of contributors, with the most varied and diverse backgrounds possible. Support that diversity by considering what new perspectives and strengths the teams you support offer. As well as the backgrounds and experiences of the team, consider that the network security and availability is improved by Validators operating at different network locations, on different platforms, and with different toolchains.

- **Participates in the community:** Support Validator Groups that strengthen the Celo developer community, for example through building or operating services for the Celo ecosystem, participating actively in on-chain governance, and answering questions and supporting others, on [Discord](https://chat.celo.org) or the [Forum](https://forum.celo.org).
