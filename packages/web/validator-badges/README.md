# Validator Badges

To help Celo Gold holders vote for secure, mission-aligned validator groups, the [Celo Validators Explorer](https://celo.org/validators/explore) will feature The Great Celo Stake Off, genesis, and Celo Foundation badges.

## Current Validator Badge Types

Currently, there are 7 types of validator badges:

|Badge ID|Badge|Mapped to|
|--- |--- |--- |
|001|Stake Off - Founder Validator|Validator addresses|
|002|Stake Off - Attestation Maven|Validator addresses|
|003|Stake Off - Master Validator|Validator addresses|
|004|Genesis - Validator|Validator addresses|
|005|Genesis - 1st Proposer|Validator Group address|
|006|Genesis - 1st Transaction|Validator Group address|
|007|Celo Foundation - Vote Recipient|Validator Group address|

Note:
- If all validators in a group have Master Validator badge, then the validator group receives the Master Valdiator badge.
- If at least 1 validator in a group is a Genesis Validator or a Stake Off Validator, then the group receives the badge.

## How to Claim Your Validator Badge

1. Append your Validator or Valdiator Group address (starting with `0x`) to the corresponding markdown files in this folder.
2. Make a single pull request (PR) that contains all of your changes and is named `[Validator Badge] <your-validator-group-name>`.
3. Validator badge PRs are reviewed once a week and once approved, your badges will be shown on the [Celo Validators Explorer](https://celo.org/validators/explore).