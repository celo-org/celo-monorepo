# Voting on Validator Groups

## Choosing a Validator Group

A single account can place votes for up to 10 validator groups at any one time.

You might consider these factors when choosing a validator group for whom to vote:

- **Participated in The Great Celo Stake Off**: [The Great Celo Stake Off](https://forum.celo.org/t/the-great-celo-stake-off-the-details/136) was a validator challenge that ran on the [Baklava Testnet](../getting-started/baklava-testnet.md) between November 2019 and March 2020. Its aims were to help organizations interested in operating Celo validators build operational experience. Validators that participated have had an opportunity to build tooling, understand the Celo protocol, and in many cases undergo a security audit. The [final Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true) is public, although addresses that validators used for the Stake Off are different to those on the Mainnet Release Candidate network.

- **Will get elected**: Locked Gold only receives voter rewards during an epoch if it is used to vote for a Validator Group that elects at least one validator during that epoch. Put another way, your vote is wasted if you vote for a group that does not elect a validator.

- **Secure**: The operational security of validators is essential for everyone's use of the Celo network. All validators that participated in the Stake Off were eligible for a [security audit](https://medium.com/celoorg/the-celo-validator-community-security-audits-and-lessons-learned-e67b78cd4123). You can see scores under the "master validator challenge" column in the [Stake Off leaderboard](https://docs.google.com/spreadsheets/d/e/2PACX-1vQwk10o6YV0uriR8LuYfLqB1irjmOX_-L6Jljn3BtKlmz_R_TsUU8aI-pMqGVlu4HQKIQlQaFkUhsyl/pubhtml?gid=1970613133&single=true). Scores of 80% or greater were awarded the "Master Validator" badge, indiciating a serious proven commitment to operational security.

- **Reliable**: Celo's consensus protocol relies on two-thirds of elected validators being available in order to produce blocks and process transactions. Voter rewards are directly tied to the [uptime score](../celo-codebase/protocol/proof-of-stake/validator-rewards.md#calculating-uptime-score) of all elected validators in the group for which the vote was made. Any period of consecutive downtime greater than a minute reduces a validator's uptime score.

- **No recent slashing penalty:** When validators and groups register, their Locked Gold becomes "staked", in that it is subject to penalties for conduct that could seriously adversely affect the health of the network. Voters' Locked Gold is never slashed, but voter rewards directly factor in a group's [slashing penalty](../celo-codebase/protocol/proof-of-stake/validator-rewards.md#calculating-slashing-penalty), which is halved when a group or one of its validators is slashed. Look for groups with a slashing penalty value of `1.0`.

- **Runs an Attestation Service**: The [Attestation Service]() is an important service that validators can run that allows users to verify that they have access to a phone number and map it to an address. Supporting validators that run this service makes it easier for new users to begin using Celo.

- **Runs a validator on Baklava**: A group that runs a validator on the [Baklava Testnet](../getting-started/baklava-testnet.md) has more opportunity to improve their setup and verify that upgrades to the Celo Blockchain software can be deployed smoothly. They are also contributing to a community resource.

- **Receives Celo Foundation votes**: The Celo Foundation has a [validator group voting policy](../operations-manual/celo-foundation-voting-policy.md) that it applies in order to promote the long-term security and decentralization of the network. You may weigh the Celo Foundation's judgement as one factor in selecting a validator group.

- **Promotes the Celo mission**:

- **Broadens Diversity**: Network presence. esp not cloud. Geographic. Mission. 

- **Community participation:**


<!-- - **Runs Full nodes**: -->

<!-- 
## Voting with the Celo CLI

![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p1.jpg)

![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p2.jpg)

![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p3.jpg)

![](https://storage.googleapis.com/celo-website/docs/locked-gold-flow-p4.jpg)
-->