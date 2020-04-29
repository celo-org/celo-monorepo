# Voting on Governance Proposals

Celo uses a formal on-chain governance mechanism to manage and upgrade the protocol. More information about the Governance system can be found in the [Governance section of the protocol documentation](../celo-codebase/protocol/governance.md).
Here, we will discuss using the [Celo CLI](../command-line-interface/introduction.md) to participate in Governance as a voter as well as how to create a proposal.

{% hint style="info" %}
In the following commands `<VARIABLE>` is used as a placeholder for something you should specify on the command line.
{% endhint %}

## Viewing Proposals

A list of active proposals can be viewed with the following command:

```bash
celocli governance:list
```

Included will be three lists of proposals by status:
* **Queued** proposals have been submitted, but are not yet being considered. Voters can upvote proposals in this list, and proposals with the most votes from this list will be moved from the queue to be considered.
* **Dequeued** proposals are actively being considered and will pass through the Approval, Referendum, and Execution stages, as discussed in the [protocol documentation](../celo-codebase/protocol/governance.md).
* **Expired** proposals are no longer being considered.

## Understanding Proposal Details

You can view information about a specific proposal with:

```bash
celocli governance:view --proposalID=<PROPOSAL_ID>
```

For example, the first proposal on the Mainnet Release Candidate network was as follows:

```
Running Checks:
   ✔  1 is an existing proposal
proposal:
  0:
    contract: Freezer
    function: unfreeze
    args:
      0: 0x8D6677192144292870907E3Fa8A5527fE55A7ff6
    params:
      target: 0x8D6677192144292870907E3Fa8A5527fE55A7ff6
    value: 0
  1:
    contract: EpochRewards
    function: setCarbonOffsettingFund
    args:
      0: 0x0ba9f5B3CdD349aB65a8DacDA9A38Bc525C2e6D6
      1: 1000000000000000000000
    params:
      partner: 0x0ba9f5B3CdD349aB65a8DacDA9A38Bc525C2e6D6
      value: 1000000000000000000000
    value: 0
  2:
    contract: Freezer
    function: unfreeze
    args:
      0: 0x07F007d389883622Ef8D4d347b3f78007f28d8b7
    params:
      target: 0x07F007d389883622Ef8D4d347b3f78007f28d8b7
    value: 0
metadata:
  proposer: 0xF3EB910DA09B8AF348E0E5B6636da442cFa79239
  deposit: 100000000000000000000 (~100 10^18)
  timestamp: 1588120122
  transactionCount: 3
  descriptionURL: https://gist.github.com/aslawson/a1f693f0e4c5fd391eac463237c4182a
stage: Approval
upvotes: 0
votes:
  Yes: 0
  No: 0
  Abstain: 0
passing: false
requirements:
  participation: 50000000000000000000000 (~50000 10^18)
  agreement: 80%
isApproved: true
isProposalPassing: false
secondsUntilStages:
  referendum: 27745
  execution: 200545
  expiration: 459745
```

<!-- TODO Details of proposal -->

## Voting on Proposals

When a proposal is Queued, you can upvote the proposal to indicate you'd like it to be considered.

```bash
celocli governance:upvote --proposalID=<PROPOSAL_ID> --from=<YOUR-VALIDATOR-VOTE-SIGNER-ADDRESS>
```

At a defined frequency, which can be checked with the `celocli network:parameters` command, proposals can be dequeued, with the highest upvoted proposals being dequeued first.

After a proposal is dequeued, it will first enter the Approval phase. In this phase, the [Governance Approver](../celo-codebase/protocol/governance.md#approval) may choose to approve the proposal, which will allow it to proceed to the Referendum phase after a given amount of time.

Once a proposal has reached the Referendum phase, it is open to community for voting. 

```bash
celocli governance:vote --proposalID=<PROPOSAL_ID> --value=<Abstain|Yes|No> --from=<YOUR-VALIDATOR-VOTE-SIGNER-ADDRESS>
```

## Executing a Proposal

If a Governance Proposal receives enough votes and passes in the Referendum phase, it can be executed by anyone.

```bash
celocli governance:execute --proposalID:<PROPOSAL_ID> --from=<YOUR_VOTER_ADDRESS>
```

<!--
## Creating a Proposal

{% hint style="warning" %}
**Under construction** guide to creating a proposal is coming soon
{% endhint %}
-->
