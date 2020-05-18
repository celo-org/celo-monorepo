# Governance

Celo uses a formal on-chain governance mechanism to manage and upgrade the protocol such as for upgrading smart contracts, adding new stable currencies, or modifying the reserve target asset allocation. All changes must be agreed upon by Celo Gold holders. A quorum threshold model is used to determine the number of votes needed for a proposal to pass.

## How it works

Changes are managed via the Celo `Governance` smart contract. This contract acts as an "owner" for making modifications to other protocol smart contracts. Such smart contracts are termed **governable**. The `Governance` contract will at first be owned by a multi-signature wallet. In the future, when the community's experience of DAOs \(Distributed Autonomous Organizations\) has evolved and when the platform has proven to be stable and secure, it will be owned by Celo Gold holders effectively acting as a DAO.

The change procedure happens in the following phases:

1.  Proposal
2.  Approval
3.  Referendum
4.  Execution

{% hint style="info" %}
**Note:** the timings mentioned in the rest of this section are for the Alfajores Testnet. It is expected that mainnet timings will be much longer to allow for proper proposal review and engagement.
{% endhint %}

## Proposal

Any user may submit a “Proposal” to the `Governance` smart contract, along with a small deposit of Celo Gold. This deposit is required to avoid spam proposals, and is refunded to the proposer if the community decides the proposal is worthy of voting on. A “Proposal” consists of a timestamp and the information needed to the “call” the operation code that will run if the proposal is accepted. This information includes an address, data, and value. Submitted proposals are added to the queue of proposals and expire from this list after one week.

Once added to the queue, a proposal needs to get voted on by Celo Gold holders to pass to the next “Approval” phase. Every Celo Gold holder with a Locked Gold account may vote for at most one proposal and in order to be eligible to do so, the account must put up a commitment, which involves sending Celo Gold to a smart contract and specifying a notice period to wait once the withdrawal is requested. This Locked Gold commitment can be the same as the funds used for validator elections and earning epoch rewards. The list of proposals is sorted by the weight of the votes they have received.

## Approval

Every day the top three proposals at the head of the queue are popped off and move to the approval phase. At this time, the original proposers are eligible to reclaim their Locked Gold commitment. In this phase graduated proposals need to be approved by the approver within the current approval phase of a day. The approver is initially a multi-signature address and will move to a DAO in the future. If a proposal is not approved within this phase, it is considered expired and does not move on to the “Referendum” phase.

## Referendum

Once the Approval phase is over, approved proposals graduate to the referendum phase. Any user may vote yes, no, or abstain on these proposals. Their vote's weight is determined by the weight of their Locked Gold commitment. After the Referendum phase is over, which lasts two days, each proposal is marked as passed or failed as a function of the votes and the corresponding passing function parameters.

In order for a proposal to pass, it must meet a minimum threshold for **participation**, and **agreement**:

* Participation is the minimum portion of Locked Gold which must cast a vote for a proposal to pass. It exists to prevent proposals passing with very low participation. The participation requirement is calculated as a governable portion of the participation baseline, which is an exponential moving average of final participation in past governance proposals.
* Agreement is the portion of votes cast that must be "yes" votes for a proposal to pass. Each contract and function can define a required level of agreement, and the required agreement for a proposal is the maximum requirement among its constituent transactions.

## Execution

Proposals that graduate from the Referendum phase to the execution phase may be executed by anyone, triggering a “call” operation code with the arguments defined in the proposal, originating from the `Governance` smart contract. Proposals expire from this phase after two days.

## Hotfix

The cadence and transparency of the standard on-chain governance protocol make it poorly suited for proposals that patch issues that may compromise the security of the network, especially when the patch would reveal an exploitable bug in one of the core contracts. Instead, these sorts of changes are better suited for the more responsive, and less transparent, hotfix protocol.

Anyone can make a proposal in the hotfix protocol by submitting the hash of their proposal to the `Governance` smart contract. If that hash is approved by the `approver` and a quorum of validators, the proposer can execute the contents of that proposal immediately.

Note that this means the validators may not always know the contents of the proposal that they are voting on. Revealing the contents of the proposal to all validators may compromise the integrity of the hotfix protocol, as only one validator would need to be malicious in order to exploit the vulnerability or share it publicly. Instead, to convince the validators that the hash represents a proposal that should be executed via the hotfix protocol, the proposer should consider contacting reputable, third party, security firms to publicly vouch for the contents of the proposal.

## Celo Blockchain Software Upgrades

Some changes cannot be made through the on-chain governance process alone. Examples include changes to the underlying consensus protocol and changes which would result in a hard-fork. When Celo Blockchain software upgrades are required to continue operating correctly on the network, a "Minimum Client Version" parameter is set to indicate the minimum version that it required.

