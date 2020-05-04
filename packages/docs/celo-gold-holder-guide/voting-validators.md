# Voting on Validator Groups

## Proof of Stake Election Essentials

Validators play a critical role in the Celo protocol, determining which transactions get applied and producing new blocks. Selecting organizations that operate well-run infrastructure to perform this role effectively is essential for Celo's long-term success.

The Celo community makes these decisions through elections for [Validator Groups](../celo-codebase/protocol/proof-of-stake/validator-groups.md), intermediaries between voters and validators. Every validator group has an ordered list of up to 5 candidate validators. Some organizations may operate a group with their own validators in it; some may operate a group to which they have added validators run by others. Since validator group rewards and penalties are closely tied to those of the validators themselves, the best groups will carefully audit and support their validators.

If you hold Celo Gold (or are a beneficiary of a [`ReleaseGold` contract](release-gold.md) that allows voting), you can vote for Validator Groups. This page discusses considerations in choosing groups to vote for, and details the steps to do this using the Celo CLI.

Celo Gold that you lock and use to vote for a group that elects one or more validators receives [epoch rewards](../celo-codebase/protocol/proof-of-stake/epoch-rewards.md) every epoch (approximately every day) once the community passes a governance proposal enabling rewards. The initial level of rewards is anticipated to be around 6% per annum equivalent (but is subject to change).

Unlike a number of Proof of Stake protocols, Celo Gold used for voting is never at risk. The actions of the validator groups or validators you vote for can cause you to receive lower or higher rewards, but the Celo Gold you locked will always be available to be unlocked in the future.

Validator Groups can receive votes up to a [voting cap](../celo-codebase/protocol/proof-of-stake/validator-validator-elections.md#group-voting-caps). You can only cast a vote for a group if it currently has fewer votes than this cap.

A single account can have outstanding votes for up to 10 groups.

## Identities

The canonical identifier for validators and validator groups is their address.

The Celo protocol also supports [account metadata](../celo-codebase/protocol/identity/metadata.md) that allows accounts to make verifiable as well as non-verifiable claims about their identity.

Validators and groups can supply non-verifiable human-readable names, and these are what is shown on most validator explorers.

{% hint style="warning" %}
**Warning**: Malicious participants may attempt to impersonate other validators in order to attract votes. Exercise caution in relying on validator-supplied names to determine their real-world identity.
{% endhint %}

Validators and groups can also supply [verifiable DNS claims](../operations-manual/validator-explorer.md), and the Celo Validator Explorer displays these. You can use these to securely identify that the same entity has access both to the account of a validator or group and the supplied DNS records.

## Validator and Validator Group Explorers

The Celo ecosystem includes a number of great services for browsing registered Validator Groups and Validators.

### [Celo Validator Explorer](https://validators.celo.org) (cLabs)

The Celo Validator Explorer has tabs to show either Release Candidate or Baklava networks.

The list shows Validator Groups and, when you expand each group, the Validators that are affiliated to that group.

A white check mark next to the name of a Validator Group shows that there is one or more DNS metadata claims verified for that group (see below).

The Votes Available column shows:

- On the left: Votes made for the group, as a percentage of the total Locked Gold

- On the right: The voting cap of that group, as a percentage of the total Locked Gold

- In the middle: votes made for the group as a proportion of the voting cap

### [TheCelo](https://thecelo.com) (Bi23 Labs)

TheCelo contains a range of valuable information on the Celo project and active Celo networks. The "Groups" tab shows a detailed view of Validator Groups. Click on a group to drilldown to see group metadata and affiliated validators.

### [Celo Whale](https://celowhale.com) (DSRV)

Celo Whale shows detailed metadata and statistics around validators but does not presently offer a view centered on validator groups.

_Please raise a Pull Request against [this page](https://github.com/celo-org/celo-monorepo/blob/master/packages/docs/celo-gold-holder-guide/voting-validators.md) to add/amend details of any community services!_

## Choosing a Validator Group

You might consider these factors when choosing a validator group for whom to vote:

- **Proven identity:** You are sure the validator group (and their associated validators) are who they say they are using DNS claims, described above.

- **Participated in The Great Celo Stake Off**: [The Great Celo Stake Off](https://forum.celo.org/t/the-great-celo-stake-off-the-details/136) was a validator challenge that ran on the [Baklava Testnet](../getting-started/baklava-testnet.md) between November 2019 and March 2020. Its aims were to help organizations interested in operating Celo validators build operational experience. Validators that participated have had an opportunity to build tooling, understand the Celo protocol, and in many cases undergo a security audit. The [final Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true) is public, although addresses that validators used for the Stake Off are different to those on the Mainnet Release Candidate network.

- **Will get elected**: Locked Gold only receives voter rewards during an epoch if it is used to vote for a Validator Group that elects at least one validator during that epoch. Put another way, your vote is wasted if you vote for a group that does not elect a validator.

- **Secure**: The operational security of validators is essential for everyone's use of the Celo network. All validators that participated in the Stake Off were eligible for a [security audit](https://medium.com/celoorg/the-celo-validator-community-security-audits-and-lessons-learned-e67b78cd4123). You can see scores under the "master validator challenge" column in the [Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true). Scores of 80% or greater were awarded the "Master Validator" badge, indiciating a serious proven commitment to operational security.

- **Reliable**: Celo's consensus protocol relies on two-thirds of elected validators being available in order to produce blocks and process transactions. Voter rewards are directly tied to the [uptime score](../celo-codebase/protocol/proof-of-stake/validator-rewards.md#calculating-uptime-score) of all elected validators in the group for which the vote was made. Any period of consecutive downtime greater than a minute reduces a validator's uptime score.

- **No recent slashing:** When validators and groups register, their Locked Gold becomes "staked", in that it is subject to penalties for conduct that could seriously adversely affect the health of the network. Voters' Locked Gold is never slashed, but voter rewards are affected by a group's [slashing penalty](../celo-codebase/protocol/proof-of-stake/validator-rewards.md#calculating-slashing-penalty), which is halved when a group or one of its validators is slashed. Look for groups with a last slashing time long in the past, ideally `0` (never), and a slashing penalty value of `1.0`.

- **Runs an Attestation Service**: The [Attestation Service]() is an important service that validators can run that allows users to verify that they have access to a phone number and map it to an address. Supporting validators that run this service makes it easier for new users to begin using Celo.

- **Runs a validator on Baklava**: A group that runs a validator on the [Baklava Testnet](../getting-started/baklava-testnet.md) has more opportunity to improve their setup and verify that upgrades to the Celo Blockchain software can be deployed smoothly. They are also contributing to a community resource.

- **Receives Celo Foundation votes**: The Celo Foundation has a [validator group voting policy](../operations-manual/celo-foundation-voting-policy.md) that it applies in order to promote the long-term security and decentralization of the network. You may weigh the Celo Foundation's judgement as one factor in selecting a validator group.

- **Promotes the Celo mission**: Celo's mission is to [build a monetary system that creates the conditions of prosperity for all](https://medium.com/celoorg/an-introductory-guide-to-celo-b185c62d3067). Consider validator groups that further this mission through their own activities or initiatives around financial inclusion, education and sustainability.

- **Broadens Diversity**: The Celo community aims to be inclusive to the largest number of contributors, with the most varied and diverse backgrounds possible. Support that diversity by considering what new perspectives and strengths the teams you support offer. As well as the backgrounds and experiences of the team, consider that the network security and availability is improved by validators operating at different network locations, on different platforms, and with different toolchains.

- **Participates in the community:** Support validator groups that strengthen the Celo developer community, for example through building or operating services for the Celo ecosystem, participating actively in on-chain governance, and answering questions and supporting others, on [Discord](https://chat.celo.org) or the [Forum](https://forum.celo.org).

## Voting with the Celo CLI

# Lock Celo Gold

Each unit of Celo Gold corresponds to one vote. First, you must lock a balance at the `LockedGold` smart contract. This ensures that each unit only votes once.


![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p1.jpg)

Once you have placed a vote for a group, you can [activate](#TODO) it to begin to receive [voter epoch rewards](../celo-codebase/protocol/proof-of-stake/epoch-rewards.md) in the event that a validator in that group is elected.

![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p2.jpg)


![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p3.jpg)

### Revoke Votes

{% hint style="info" %}
* For the following commands, make sure that your Ledger device with the voter signer keys is unlocked.  * The Ledger `Celo app` will ask you to confirm the transaction. Follow instructions on the device's screen to do this.
{% endhint %}

At any point you can revoke votes cast for a validator group. For example, if a group is performing poorly and affecting your rewards, or if you’d prefer to vote for another group, or if you’d like to unlock your gold to transfer it to another address.

{% hint style="info" %}
When you revoke your votes you will stop receiving voter rewards.
{% endhint %}

Use your vote signer key to revoke your votes to specify the amount of Celo Gold (cGLD) you wish to revoke (don’t include the  `< >`  braces). All cGLD amounts should be expressed in 18 decimal places. For example, 1 cGLD = 1000000000000000000.

```bash
# Using the Ledger device where your vote signer keys are stored
celocli election:revoke --from $CELO_VOTE_SIGNER_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --value <CELO-GOLD-AMOUNT> --useLedger --ledgerConfirmAddress 
```

### Unlock Locked Celo Gold

![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p4.jpg)
