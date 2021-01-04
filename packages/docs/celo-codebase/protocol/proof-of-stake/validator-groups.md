# Validator Groups

Celo's proof-of-stake mechanism introduces the concept of **Validator Groups** as intermediaries between voters and validators.

## Overview

A validator group has **members**, an ordered list of candidate validators. There is a fixed limit to the number of members that a group may have.

Validator groups can help mitigate the information disparity between voters and validators. It is anticipated that groups might emerge that do not necessarily operate validators themselves but attract votes for their reputation for ensuring their associated validators have known real-world identities, have high uptime, are well maintained and regularly audited. Since every validator needs to be accepted by a single group to stand for election, that group will be more able to build up long-term judgements on their validators’ operational practices and security setups than each of the numerous CELO holders that might vote for it would.

Equally, a number of organizations may want to attempt to field multiple validators under their own control, or be able to interchange the specific machines or keys under which they validate in the case of hardware or connectivity failure. By switching out validators in the list, groups can accomplish this without users having to change their votes.

Validator groups can have no more than a small, fixed maximum number of validators -- currently 5 in Mainnet. This means an organization wanting to get more validators elected than this maximum has the added challenge of managing multiple group identities and reputations simultaneously. This further promotes decentralization and strengthens operational security, making it more likely that the validator set will be composed of nodes operated in different fashions by independent individuals and organizations.

## Registration

Any account that has at least the minimum stake requirement in Locked Gold, whether voting or non-voting, can register an empty validator group. If a validating key is specified it may be used for this registration.

## Deregistration

The account that creates a validator group is able to deregister that group if it has no members.

While an account has a registered validator group, or for up to a `deregistrationPeriod` after it is deregistered, attempts to `unlock` the account's amount of Locked Gold will fail if they would cause the remaining amount to fall below the minimum stake requirement.

## Group Share

Validator groups are compensated by taking a share \(the 'Group Share'\) of the [validator rewards](epoch-rewards/validator-rewards.md) from any of its member validators that are elected during an epoch. This value is set at registration time and can be changed later.

## Changing Group Members

The account owner controls the list of validators in their group and can at any time add, remove, or re-order validators.

For a validator to be added to a group, several conditions must hold: the number of members in the group must be less than the maximum; the Locked Gold balance of the group's account must be sufficient \(the stake is per-member validator\); and the validator must first have set its affiliation to the group.

This means that while a group can unilaterally remove a validator, and a validator can unilaterally leave by changing its affiliation, both parties have to agree before a validator can become a member of a group.

## Votes and Voting Cap

Validator Groups can receive votes from Locked Gold up to a [voting cap](validator-elections.md#group-voting-caps). This value is set to be the number of votes that would be needed to elect all of its validators, plus one more validator. The cap is enforced at the point of voting: a user can only cast a vote for a group if it currently has fewer votes than this cap.

## Slashing Penalty

A [slashing penalty](penalties.md), initially `1.0`, is also tracked for each validator group. This value may be reduced as a penalty for misbehavior of the validator in the group. It affects the future rewards of the group, its validators, and Locked Gold holders receiving rewards for voting for the group.

## Metadata

Both validators and validator groups can use [Accounts Metadata](../identity/metadata.md) to provide unverified metadata \(such as name and organizational affiliation\) as well as claims that can be verified off-chain for control of third-party accounts. All validators are encouraged to make a verifiable claim for [domain names](../../../validator-guide/validator-explorer.md).

