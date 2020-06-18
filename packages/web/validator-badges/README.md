# Validator Badges

To help Celo Gold holders vote for secure, mission-aligned validator groups, the [Celo Validators Explorer](https://celo.org/validators/explore) will feature The Great Celo Stake Off, genesis, and Celo Foundation badges.

## Current Validator Badge Types

Currently, there are 7 types of validator badges:

|Badge ID|Badge|Description|Mapped to|
|--- |--- |--- |--- |
|001|Stake Off - Founder Validator|Participated in the Stake Off|Validator addresses|
|002|Stake Off - Attestation Maven|Ran reliable attestation services|Validator addresses|
|003|Stake Off - Master Validator|Passed security audit|Validator addresses|
|004|Genesis - Validator|Stood up Celo Mainnet|Validator addresses|
|005|Genesis - 1st Proposer|Proposed the 1st block on Celo Mainnet|Validator Group address|
|006|Genesis - 1st Transaction|Sent the 1st transaction on Celo Mainnet|Validator Group address|
|007|Celo Foundation - Vote Recipient|Currently receives Foundation votes|Validator Group address|

Note:
- If all validators in a group have Master Validator badge, then the validator group receives the Master Valdiator badge.
- If at least 1 validator in a group is a Genesis Validator or a Stake Off Validator, then the group receives the badge.

## How to Claim Your Validator Badge

1. If you are awarded with validator badge(s), check if your Validator Group address is present in the corresponding markdown files. If so, proceed to the next section; if not, proceed to step 2.
2. Append your Valdiator Group address (starting with `0x`) as a new line to the corresponding markdown files in this current folder.
3. Make a single pull request (PR) that contains all of your changes and is named `[Validator Badge] <your-validator-group-name>`.
4. Validator badge PRs are reviewed once a week and once approved, your badges will be shown on the [Celo Validators Explorer](https://celo.org/validators/explore).

## How to Use Your Validator Badge

After claiming your badge(s), you may put your validator badge(s) on your website, social media, and other places.

You can download badges in `.jpg`, `.png`, and `.svg` formats in the corresponding folders.
