# Voting on Governance

{% hint style="info" %}
If you would like to keep up-to-date with all the news happening in the Celo community, including validation, node operation and governance, please sign up to our [Celo Signal mailing list here](https://celo.activehosted.com/f/15).

You can add the [Celo Signal public calendar](https://calendar.google.com/calendar/u/0/embed?src=c_9su6ich1uhmetr4ob3sij6kaqs@group.calendar.google.com) as well which has relevant dates.
{% endhint %}

Celo uses a formal on-chain governance mechanism to manage and upgrade the protocol. More information about the Governance system can be found in the [Governance section of the protocol documentation](../celo-codebase/protocol/governance.md). Here, we will discuss using the [Celo CLI](../command-line-interface/introduction.md) to participate in Governance as a voter as well as how to create a proposal.

{% hint style="info" %}
In the following commands `<VARIABLE>` is used as a placeholder for something you should specify on the command line.
{% endhint %}

## Viewing Proposals

A list of active proposals can be viewed with the following command:

```bash
celocli governance:list
```

Included will be three lists of proposals by status:

* **Queued** proposals have been submitted, but are not yet being considered. Voters can upvote proposals in this list, and proposals with the most upvotes from this list will be moved from the queue to be considered.
* **Dequeued** proposals are actively being considered and will pass through the Approval, Referendum, and Execution stages, as discussed in the [protocol documentation](../celo-codebase/protocol/governance.md).
* **Expired** proposals are no longer being considered.

## Understanding Proposal Details

You can view information about a specific proposal with:

```bash
celocli governance:show --proposalID=<PROPOSAL_ID>
```

For example, the proposal 14 on Mainnet was as follows:

```text
Running Checks:
   ✔  14 is an existing proposal
proposal:
  0:
    contract: Governance
    function: setBaselineQuorumFactor
    args:
      0: 500000000000000000000000
    params:
      baselineQuorumFactor: 500000000000000000000000 (~5.000e+23)
    value: 0
metadata:
  proposer: 0xF3EB910DA09B8AF348E0E5B6636da442cFa79239
  deposit: 100000000000000000000 (~1.000e+20)
  timestamp: 1609961608 (~1.610e+9)
  transactionCount: 1
  descriptionURL: https://github.com/celo-org/celo-proposals/blob/master/CGPs/0016.md
stage: Referendum
upvotes: 0
votes:
  Yes: 95934607718520408413613056 (~9.593e+25)
  No: 0
  Abstain: 0
passing: true
requirements:
  participation: 0.2009694258486
  agreement: 90%
isApproved: true
isProposalPassing: true
timeUntilStages:
  referendum: past
  execution: 57 minutes, 59 seconds
  expiration: 3 days, 57 minutes, 59 seconds
```

## Voting on Proposals

When a proposal is Queued, you can upvote the proposal to indicate you'd like it to be considered.

{% hint style="info" %}
If you are using a Ledger wallet, make sure to include `--useLedger` and `--ledgerAddresses` in the following commands.
{% endhint %}

```bash
celocli governance:upvote --proposalID=<PROPOSAL_ID> --from=<YOUR_VOTER_ADDRESS>
```

At a defined frequency, which can be checked with the `celocli network:parameters` command, proposals can be dequeued, with the highest upvoted proposals being dequeued first.

After a proposal is dequeued, it will first enter the Approval phase. In this phase, the [Governance Approver](../celo-codebase/protocol/governance.md#approval) may choose to approve the proposal, which will allow it to proceed to the Referendum phase after the configured length of time.

Once a proposal has reached the Referendum phase, it is open to community for voting.

```bash
celocli governance:vote --proposalID=<PROPOSAL_ID> --value=<Abstain|Yes|No> --from=<YOUR_VOTER_ADDRESS>
```

## Executing a Proposal

If a Governance Proposal receives enough votes and passes in the Referendum phase, it can be executed by anyone.

```bash
celocli governance:execute --proposalID=<PROPOSAL_ID> --from=<YOUR_VOTER_ADDRESS>
```

