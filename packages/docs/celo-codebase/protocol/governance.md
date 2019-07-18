# Governance

Celo uses a formal on-chain governance mechanism to manage and upgrade the protocol such as for upgrading smart contracts, adding new stable currencies, or modifying the reserve target asset allocation. All changes must be agreed upon by Celo Gold holders using a “bonded-stake” weighted vote. A quorum threshold model is used to determine the number of votes needed for a proposal to pass.

### **How it works**

Changes are managed via the Celo governance smart contract that acts as an “owner” for making modifications to other protocol smart contracts. This governance contract will at first be owned by a multi-signature wallet. In the future, when we have a better understanding of DAOs \(Distributed Autonomous Organizations\) and when the platform has proven to be stable and secure, it will be owned by Celo Gold holders effectively acting as a DAO.

The change procedure happens in the following phases:

1.  Proposal
2.  Approval
3.  Referendum
4.  Execution

Note: the timings mentioned in the rest of this section are for the Alfajores Testnet. It’s expected that mainnet timings will be much longer to allow for proper proposal review and engagement.

### **Proposal**

Any user may submit a “Proposal” to the Celo Governance smart contract, along with a bonded deposit of Celo Gold. This bonded deposit is required to avoid spam proposals. A “Proposal” consists of a timestamp and the information needed to the “call” the operation code that will run if the proposal is accepted. This information includes an address, data, and value. Submitted proposals are added to the queue of proposals and expire from this list after one week.

Once added to the queue, a proposal needs to get voted on by Celo Gold holders to pass to the next “Approval” phase. Every Celo Gold holder with a deposit account may vote for at most one proposal and in order to be eligible to do so, the account must put up a bonded deposit, which involves sending Celo Gold to a smart contract and specifying a notice period to wait once the withdrawal is requested. This bonded deposit can be the same as the bonded funds used for validator elections and earning epoch rewards. Each account’s vote is proportional to its bonded weight at the time the proposal expires from the queue where the bonded weight is defined as:

`Bonded weight = Amount of Celo Gold bonded * 1+sqrt(notice period in days) / 30`

The list of proposals is sorted by the weight of the votes they’ve received.

### **Approval**

Every day the top three proposals at the head of the queue are popped off and move to the approval phase. At this time, the original proposers are eligible to reclaim their bonded deposit. In this phase graduated proposals need to be approved by the approver within the current approval phase of a day. The approver is initially a multi-signature address and will move to a DAO in the future. If a proposal is not approved within this phase, it is considered expired and does not move on to the “Referendum” phase.

### **Referendum**

Once the Approval phase is over, approved proposals graduate to the referendum phase. Any user may vote yes, no, or abstain on these proposals, and the weight of their vote is equal to their bonded weight. After the Referendum phase is over, which lasts two days, each proposal is marked as passed or failed as a function of the votes and the corresponding passing function parameters. These parameters specify what is required for specific proposals to pass. In the Alfajores testnet, this is a simple majority, but in future the voting threshold will adapt based on participation levels.

### **Execution**

Proposals that graduate from the Referendum phase to the execution phase may be executed by anyone, triggering a “call” operation code with the arguments defined in the proposal, originating from the Governance smart contract. Proposals expire from this phase after two days.
