# Quick Start for Celo Gold Holders

If you are an early holder of Celo Gold on the Celo [Release Candidate](../getting-started/rc1.md) network, this guide will help you access your account and do the setup necessary to earn rewards on those funds.

## Prerequisites

This guide assumes:

- You are self-custodying (you hold the private key to your address), and that you have provided that address directly to cLabs. If you are using a custody provider, please contact them for directions.

- Your address is the beneficiary of a [ReleaseGold](release-gold.md) contract, which releases Celo Gold programmatically to a beneficiary over a period of time.

- You have been informed by cLabs that the `ReleaseGold` instance corresponding to your address has been deployed.

- You have your private key held on a [Ledger Nano S or Ledger Nano X](ledger.md) device, and you have a second such device available for managing a voting key.

{% hint style="warning" %}
**Warning**: Self-custodying keys has associated security and financial risks. Loss or theft of keys can result in irrecovable loss of funds. This guide also requires technical knowledge. You should be comfortable with using a Command Line Interface (CLI) and understand the basics of how cryptographic network accounts work.
{% endhint %}

{% hint style="info" %}
**Release Candidate**: Use of Celo Mainnet Release Candidate network is subject to [these terms](../important-information/rc-network-disclaimer.md). Please note that this network may not graduate to Celo Mainnet, in which case a new network will be stood up, and new `ReleaseGold` contracts deployed with different addresses. You will then need to follow this guide again.
{% endhint %}

## Support

If you have any questions or need assistance with these instructions, please contact cLabs or ask in the `#celo-gold-holders` channel on [Celo's Discord server](https://chat.celo.org). Remember that Discord is a public channel: never disclose mnemonics, private keys, unsantized log output, or personal information.

Please refer to the [Ledger Troubleshooting](ledger.md#Troubleshooting) for issues using Ledgers with the Celo CLI.

## Outline

In this guide, you will:

- Install the Celo CLI (and optionally, a local node to connect to the network)
- Access the `ReleaseGold` account associated with your address using your existing Ledger
- Authorize a voting key, which you will hold on a new, second Ledger
- Lock some of the Gold in your `ReleaseGold` account
- Use that Locked Gold to vote for validator groups to operate Celo's [Proof of Stake](../celo-codebase/protocol/proof-of-stake/README.md) network (and in doing so be ready to receive epoch rewards of 6% when the community enables them in a forthcoming governance proposal)

## Preparing Ledgers

You will need:

- Your **Beneficiary Ledger**: One Ledger Nano S or X configured with your beneficiary key (used to produce the address you supplied cLabs). Once you have completed this guide, this will become a "cold wallet" that you can keep offline most of the time.

- Your **Vote Signer Ledger:** One Ledger Nano S or X configured with a new, unused key. This will become a "warm wallet" you can use whenever you want to participate in validator elections or governance proposals.

As a first step, follow [these instructions](ledger.md) for both Ledgers to install the Ledger Celo app, obtain and verify the associated addresses, and (recommended) run a test transaction on the Alfajores test network.

The remainder of this guide assumes you are using the first address available on each Ledger. You can add the flags described in the above instructions to commands below to use different addresses.

## Deployment

If you haven't already, open a terminal window and install the Celo CLI:

```bash
 npm install -g @celo/celocli
```

You will now need to point the Celo CLI to a node that is synchronized with the [Release Candidate](../getting-started/rc1.md) network. There are two options:

- **Local Celo Blockchain node**: You can run a full node on your local machine which will communicate
  with other nodes and cryptographically verify all data it receives. Since this approach does not require you to trust the network, it is most secure.

  To do this, follow the tutorial for [running a full node](../getting-started/running-a-full-node-in-rc1.md) (and make sure to pass `--nousb`).

  Then run:

  ```bash
  celocli config:set --node http://localhost:8545
  ```

- **cLabs-operated node**: As an alternative to using your own node, you can use existing an transaction
  nodes service. Forno, operated by cLabs, is one example. While this approach does not require you to deploy a node locally, it requires you to trust cLabs and the remote Forno nodes (in the same way you would trust a centralized web service). An attacker may be able to manipulate data returned to you from the service, which the CLI may rely on to complete operations.

  To use Forno, run this command:

  ```bash
  celocli config:set --node https://rc1-forno.celo-testnet.org
  ```

## Locate and verify your `ReleaseGold` contract address

Next, you will find the address of the `ReleaseGold` contract deployed for your beneficiary address. The `ReleaseGold` contract has its own address and is separate from the beneficiary address, but there are certain aspects of it that can be controlled only by the beneficiary.

Use the mapping from this list (you can use Edit>Find in your browser):

- [RC1 ReleaseGold deployments on 4/23/20 ("Wave 1")](https://gist.githubusercontent.com/timmoreton/704404484cf8f641b5464a237592a341/raw/6ad2615f219c71fe370bac84e5ac7aa1653fffac/CeloRC1ReleaseGoldWave1.json)

- [RC1 ReleaseGold deployments on 4/30/20 ("Wave 1b")](https://gist.githubusercontent.com/timmoreton/32d36dcc48e52a4747df8cfa8e4a4d0f/raw/1557209b59fa863cc8ed9b66e72e6111fbfe3475/CeloRC1ReleaseGoldWave1b.json)

If you have more than one beneficiary address, you'll want to step through this guide for each one.

If you cannot locate your address in these mappings, please contact cLabs.

Record the `Beneficiary` and `ContractAddress` values in environment variables:

```bash
export CELO_BENEFICIARY_ADDRESS=<YOUR-CELO-BENEFICIARY-ADDRESS>
export CELO_RG_ADDRESS=<YOUR-CELO-RELEASEGOLD-ADDRESS>
```

You should find your beneficiary account already has a small Celo Gold balance to pay for transaction fees (values are shown in wei, so For example, 1 cGLD = 1000000000000000000):

```bash
celocli account:balance $CELO_BENEFICIARY_ADDRESS
```

Next, check the details of your `ReleaseGold` contract:

```bash
celocli releasegold:show --contract $CELO_RG_ADDRESS
```

Verify the configuration, balance, and beneficiary details. You can find an explanation of these parameters on the [ReleaseGold](release-gold.md) page.

If any of these details appear to be incorrect, please contact cLabs, and do not proceed with the remainder of this guide.

If the configuration shows `canVote: true`, your contract allows you to participate in electing validator groups for Celo's Proof of Stake protocol, and potentially earn epoch rewards for doing so. Please continue to follow the remainder of this guide (or you can come back and continue at any time).

Otherwise, you're all set. You don't need to take any further action right now.

## Authorize Vote Signer Keys

To allow you to keep your Beneficiary Ledger offline on a day-to-day basis, it’s recommended to use a seperate [Authorized Vote Signer Account](https://docs.celo.org/validator-guide/summary/detailed#authorized-vote-signers) that will vote on behalf of the beneficiary.

This is a two step process. First, you create a "proof of possession" that shows that the holder of the beneficiary key also holds the vote signer key. Then, you will use that when the benficiary signs a transaction authorizing the vote signer key. This proves to the Celo network that a single entity holds both keys.

{% hint style="info" %}

- Connect your **Vote Signer Ledger** now, unlock it, and open the Celo application.
  {% endhint %}

First obtain your vote signer address:

```bash
# Using the Vote Signer Ledger
celocli account:list --useLedger
```

Your address is listed under `Ledger Addresses`. Create an environment variable for your vote signer address.

```bash
export CELO_VOTE_SIGNER_ADDRESS=<YOUR-VOTE-SIGNER-ADDRESS>
```

Then create the proof of possession:

```bash
# Using the Vote Signer Ledger
celocli account:proof-of-possession --signer $CELO_VOTE_SIGNER_ADDRESS --account $CELO_RG_ADDRESS --useLedger
```

The Ledger `Celo app` will ask you to confirm the transaction. Toggle right on the device until you see `Sign Message` on screen. Press both buttons at the same time to confirm.

Take note of the signature produced by the `proof-of-possession` command and create an environment variable for it.

```bash
export CELO_VOTE_SIGNER_SIGNATURE=<YOUR-VOTE-SIGNER-SIGNATURE>
```

Now switch ledgers.

{% hint style="info" %}

- Connect your **Beneficiary Ledger** now, unlock it, and open the Celo application.
  {% endhint %}

Next, designate the `ReleaseGold` contract as a “Locked Gold” account:

```bash
# Using the Beneficiary Ledger
celocli releasegold:create-account --contract $CELO_RG_ADDRESS --useLedger
```

You'll need to press right on the Ledger several times to review details of the transactions, then when the device says "Accept and send" press both buttons together.

Check that the `ReleaseGold` contract address is associated with a registered Locked Gold Account:

```bash
celocli account:show $CELO_RG_ADDRESS
```

Now, using the proof-of-possession you generated above, as the Locked Gold Account account, you will authorize the vote signing key to vote on the Locked Gold Account's behalf:

```bash
# Using the Beneficiary Ledger
celocli releasegold:authorize --contract $CELO_RG_ADDRESS --role=vote --signer $CELO_VOTE_SIGNER_ADDRESS --signature $CELO_VOTE_SIGNER_SIGNATURE --useLedger
```

Verify that your signer was correctly authorized:

```bash
celocli account:show $CELO_RG_ADDRESS
```

The `vote` address under `authorizedSigners` should match `$CELO_VOTE_SIGNER_ADDRESS`.

This operation also transfers 1 cGLD to the vote signer address, for you to use for transaction fees.

## Lock Celo Gold

To vote for validator groups and on governance proposals you will need to lock Celo Gold. This is to keep the network secure by making sure each unit of Celo Gold can only be used to vote once.

Specify the amount of Celo Gold you wish to lock (don’t include the `< >` braces). All amounts are given as wei, i.e units of 10^-18 Celo Gold. For example, 1 cGLD = 1000000000000000000.

```bash
# Using the Beneficiary Ledger
celocli releasegold:locked-gold --contract $CELO_RG_ADDRESS --action lock  --useLedger --value <CELO-GOLD-AMOUNT>
```

Check that your Celo Gold was successfully locked.

```bash
celocli lockedgold:show $CELO_RG_ADDRESS
```

{% hint style="warning" %}
Don't lock the small amounts of Celo Gold in your beneficiary account or vote signer account. You may need this to pay for transaction fees.
{% endhint %}

## Vote for a Validator Group

Celo Gold (cGLD) holders can vote for Validator groups and not validators directly. This is similar to delegating on other cryptographic networks. cGLD holders who vote for an elected validator group may earn [epoch rewards](https://docs.celo.org/getting-started/glossary#epoch-rewards).

A number of community sites are providing information to help choose a validator group. Start with [the cLabs Validator explorer](https://celo.org/validators/explore), or [Bi23 Labs' `thecelo` dashboard](https://thecelo.com).

You can also see registered validator groups through the Celo CLI. This will display a list of validator groups, the number of votes they have received, the number of additional votes they are able to receive, and whether or not they are eligible to elect validators:

```bash
celocli election:list
```

Once you have found one or more validator groups you’d like to vote for, create an environment variable for its group address (don’t include the `< >` braces):

```bash
export CELO_VALIDATOR_GROUP_ADDRESS=<VALIDATOR-GROUP-ADDRESS-TO-VOTE-FOR>
```

To vote, you will use your vote signer key, which is voting _on behalf of_ your Locked Gold account.

For each vote you will need to specify the amount of locked Celo Gold you wish to vote with (don’t include the `< >` braces). All Celo Gold amounts should be expressed in wei: that means 1 cGLD = 1000000000000000000.

{% hint style="info" %}

- Connect your **Vote Signer Ledger** now, unlock it, and open the Celo application.
  {% endhint %}

```bash
# Using the Vote Signer Ledger
celocli election:vote --from $CELO_VOTE_SIGNER_ADDRESS --for $CELO_VALIDATOR_GROUP_ADDRESS --useLedger --value <CELO-GOLD-AMOUNT>
```

Verify that your votes were cast successfully. Since your Vote Signer account votes on behalf of the Celo Locked Gold account, you want to check the election status for that account:

```bash
celocli election:show $CELO_RG_ADDRESS --voter
```

Your locked cGLD votes should be displayed next to `pending` under `votes`.

## The next day: Activate your Vote

Your vote will apply starting at the next Validator Election, held once per day, and will continue to apply at each subsequent election until you change it.

After that election has occurred, you will need to activate your vote. This will allow you to receive epoch rewards if in that election (or at any subsequent one, until you change your vote) the validator group for which you voted elected at least one validator.

{% hint style="info" %}
Epoch lengths in the Mainnet Release Candidate 1 are set to be the number of blocks produced in a day. As a result, votes may need to be activated up to 24 hours after they are cast.
{% endhint %}

Check that your votes were cast in a previous epoch:

```bash
celocli election:show $CELO_RG_ADDRESS --voter
```

Your locked cGLD votes should be displayed next to `active` under `votes`.

{% hint style="info" %}

- Connect your **Vote Signer Ledger** now, unlock it, and open the Celo application.
  {% endhint %}

Now activate your votes:

```bash
# Using the Vote Signer Ledger
# You must do this in an epoch after the one you voted in, this may take up to 24h
celocli election:activate --from $CELO_VOTE_SIGNER_ADDRESS --useLedger
```

Congratulations! You're all set.

## Next Steps

You are now set up to participate in the Celo network!

Epoch rewards are not yet enabled on the Release Candidate network, but as part of the network deployment process the community will approve a governance request that enables them.

Locking Celo Gold also enables you to participate in voting for or against [Governance proposals](voting-governance.md).

You can also read more about how Celo's [Proof of Stake](../celo-codebase/protocol/proof-of-stake/README.md) and on-chain [Governance](../celo-codebase/protocol/governance.md) mechanisms work.

At some point, the terms of your `ReleaseGold` contract will allow you to withdraw funds and transfer them to your beneficiary address. Check back for instructions on how to do this.
