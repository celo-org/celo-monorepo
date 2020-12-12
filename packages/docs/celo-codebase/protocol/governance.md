# Governance

Celo uses a formal on-chain governance mechanism to manage and upgrade the protocol such as for upgrading smart contracts, adding new stable currencies, or modifying the reserve target asset allocation. All changes must be agreed upon by CELO holders. A quorum threshold model is used to determine the number of votes needed for a proposal to pass.

## Stakeholder Proposal Process

Changes are managed via the Celo `Governance` smart contract. This contract acts as an "owner" for making modifications to other protocol smart contracts. Such smart contracts are termed **governable**. The `Governance` contract itself is governable, and owned by itself.

The change procedure happens in the following phases:

1. Proposal
2. Approval
3. Referendum
4. Execution

### Overview of Phases

Each proposal starts on the **Proposal Queue** where it may receive upvotes to move forward in the queue relative to other queued proposals. Three proposals from the top of the queue are dequeued and promoted to the approval stage per day. Any proposal that remains in the queue for 4 weeks will expire. **Approval** lasts 1 days, during which the proposal must be approved by the Approver. Approved proposals are promoted to the Referendum stage. **Referendum** lasts five days, during which owners of Locked Celo vote yes or no on the proposal. Proposals that satisfy the necessary quorum are promoted to the execution phase. **Execution** lasts up to three days, during which anybody may trigger the execution of the proposal.

### Proposal

Any user may submit a Proposal to the `Governance` smart contract, along with a small deposit of CELO. This deposit is required to avoid spam proposals, and is refunded to the proposer if the proposal reaches the Approval stage. A Proposal consists of a list of transactions, and a description URL where voters can get more information about the proposal. It is encouraged that this description URL points to a CGP document in the [celo-org/celo-proposals](https://github.com/celo-org/celo-proposals) repository. Transaction data in the proposal includes the destination address, data, and value. If the proposal passes, the included transactions will be executed by the `Governance` contract.

Submitted proposals are added to the queue of proposals. While a proposal is on this queue, voters may use their [Locked Celo](proof-of-stake/locked-gold.md) to **upvote** the proposal. Once per day the top three proposals, by weight of the Locked Gold upvoting them, are dequeued and moved into the Approval phase. Note that if there are fewer than three proposals on the queue, all may be dequeued even if they have no upvotes. If a proposal has been on the queue for for more than 4 weeks, it expires and the deposit is forfeited.

### Approval

Every day the top three proposals at the head of the queue are pop off and move to the Approval phase. At this time, the original proposers are eligible to reclaim their Locked Gold deposit. In this phase, the proposal needs to be approved by the Approver. The Approver is initially a 3 of 9 multi-signature address held by individuals selected by the Celo Foundation, and will move to a DAO in the future. The Approval phase lasts 1 day and if the proposal is not approved in this window, it is considered expired and does not move on to the “Referendum” phase.

### Referendum

Once the Approval phase is over, approved proposals graduate to the referendum phase. Any user may vote yes, no, or abstain on these proposals. Their vote's weight is determined by the weight of their Locked Gold. After the Referendum phase is over, which lasts five days, each proposal is marked as passed or failed as a function of the votes and the corresponding passing function parameters.

In order for a proposal to pass, it must meet a minimum threshold for **participation**, and **agreement**:

* Participation is the minimum portion of Locked Gold which must cast a vote for a proposal to pass. It exists to prevent proposals passing with very low participation. The participation requirement is calculated as a governable portion of the participation baseline, which is an exponential moving average of final participation in past governance proposals.
* Agreement is the portion of votes cast that must be "yes" votes for a proposal to pass. Each contract and function can define a required level of agreement, and the required agreement for a proposal is the maximum requirement among its constituent transactions.

### Execution

Proposals that graduate from the Referendum phase to the Execution phase may be executed by anyone, triggering a `call` operation code with the arguments defined in the proposal, originating from the `Governance` smart contract. Proposals expire from this phase after three days.

## Smart Contract Upgradeability

​ Smart contracts deployed to an EVM blockchain like Celo are immutable. To allow for improvements, new features, and bug fixes, the Celo codebase uses the [Proxy Upgrade Pattern](https://docs.openzeppelin.com/upgrades-plugins/1.x/proxies). All of the core contracts owned by Governance are proxied. Thus, a smart contract implementation can be upgraded using the standard on-chain governance process. ​

### Upgrade risks

​ The core contracts define critical behavior of the Celo network such as CELO and Celo Dollar asset management or validator elections and rewards. Malicious or inadvertent contract bugs could compromise user balances or potentially cause harm, irreversible without a blockchain hard fork.

Great care must be taken to ensure that any Governance proposal that modifies smart contract code will not break the existing system. To this end, the contracts have a well defined [release process](../../community/release-process/smart-contracts.md), which includes soliciting security audits from reputable third-party auditors.

As Celo is a decentralized network, all Celo network participants are invited to participate in the governance proposals discussions on the [forum](https://forum.celo.org/c/governance/12).

## Validator Hotfix Process

The cadence and transparency of the standard on-chain governance protocol make it poorly suited for proposals that patch issues that may compromise the security of the network, especially when the patch would reveal an exploitable bug in one of the core contracts. Instead, these sorts of changes are better suited for the more responsive, and less transparent, hotfix protocol.

Anyone can make a proposal in the hotfix protocol by submitting the hash of their proposal to the `Governance` smart contract. If that hash is approved by the `approver` and a quorum of validators, the proposer can execute the contents of that proposal immediately.

Note that this means the validators may not always know the contents of the proposal that they are voting on. Revealing the contents of the proposal to all validators may compromise the integrity of the hotfix protocol, as only one validator would need to be malicious in order to exploit the vulnerability or share it publicly. Instead, to convince the validators that the hash represents a proposal that should be executed via the hotfix protocol, the proposer should consider contacting reputable, third party, security firms to publicly vouch for the contents of the proposal.

## Celo Blockchain Software Upgrades

Some changes cannot be made through the on-chain governance process \(via proposal or hotfix\) alone. Examples include changes to the underlying consensus protocol and changes which would result in a hard-fork. When Celo Blockchain software upgrades are required to continue operating correctly on the network, a "Minimum Client Version" parameter is set to indicate the minimum version that it required.

