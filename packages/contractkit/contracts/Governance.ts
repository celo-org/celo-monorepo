import Web3 from 'web3'
import { Governance as GovernanceType } from '../types/Governance'
export default async function getInstance(web3: Web3, account: string | null = null) {
  const contract = (new web3.eth.Contract(
    [
      {
        constant: true,
        inputs: [],
        name: 'stageDurations',
        outputs: [
          {
            name: 'approval',
            type: 'uint256',
          },
          {
            name: 'referendum',
            type: 'uint256',
          },
          {
            name: 'execution',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'concurrentProposals',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'approver',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'initialized',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'minDeposit',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        name: 'refundedDeposits',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [],
        name: 'renounceOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'dequeueFrequency',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'registry',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'owner',
        outputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'queueExpiry',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'isOwner',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: '',
            type: 'address',
          },
        ],
        name: 'voters',
        outputs: [
          {
            name: 'upvotedProposal',
            type: 'uint256',
          },
          {
            name: 'mostRecentReferendumProposal',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'registryAddress',
            type: 'address',
          },
        ],
        name: 'setRegistry',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        name: 'emptyIndices',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        name: 'dequeued',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'lastDequeue',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'proposalCount',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'transferOwnership',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'approver',
            type: 'address',
          },
        ],
        name: 'ApproverSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'concurrentProposals',
            type: 'uint256',
          },
        ],
        name: 'ConcurrentProposalsSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'minDeposit',
            type: 'uint256',
          },
        ],
        name: 'MinDepositSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'queueExpiry',
            type: 'uint256',
          },
        ],
        name: 'QueueExpirySet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'dequeueFrequency',
            type: 'uint256',
          },
        ],
        name: 'DequeueFrequencySet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'approvalStageDuration',
            type: 'uint256',
          },
        ],
        name: 'ApprovalStageDurationSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'referendumStageDuration',
            type: 'uint256',
          },
        ],
        name: 'ReferendumStageDurationSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'executionStageDuration',
            type: 'uint256',
          },
        ],
        name: 'ExecutionStageDurationSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'destination',
            type: 'address',
          },
          {
            indexed: true,
            name: 'functionId',
            type: 'bytes4',
          },
          {
            indexed: false,
            name: 'numerator',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'ConstitutionSet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
          {
            indexed: true,
            name: 'proposer',
            type: 'address',
          },
          {
            indexed: false,
            name: 'transactionCount',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'deposit',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'timestamp',
            type: 'uint256',
          },
        ],
        name: 'ProposalQueued',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
          {
            indexed: true,
            name: 'account',
            type: 'address',
          },
          {
            indexed: false,
            name: 'upvotes',
            type: 'uint256',
          },
        ],
        name: 'ProposalUpvoted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
          {
            indexed: true,
            name: 'account',
            type: 'address',
          },
          {
            indexed: false,
            name: 'revokedUpvotes',
            type: 'uint256',
          },
        ],
        name: 'ProposalUpvoteRevoked',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'timestamp',
            type: 'uint256',
          },
        ],
        name: 'ProposalDequeued',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'ProposalApproved',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
          {
            indexed: true,
            name: 'account',
            type: 'address',
          },
          {
            indexed: false,
            name: 'value',
            type: 'uint256',
          },
          {
            indexed: false,
            name: 'weight',
            type: 'uint256',
          },
        ],
        name: 'ProposalVoted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'ProposalExecuted',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'ProposalExpired',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'registryAddress',
            type: 'address',
          },
        ],
        name: 'RegistrySet',
        type: 'event',
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: 'previousOwner',
            type: 'address',
          },
          {
            indexed: true,
            name: 'newOwner',
            type: 'address',
          },
        ],
        name: 'OwnershipTransferred',
        type: 'event',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'registryAddress',
            type: 'address',
          },
          {
            name: '_approver',
            type: 'address',
          },
          {
            name: '_concurrentProposals',
            type: 'uint256',
          },
          {
            name: '_minDeposit',
            type: 'uint256',
          },
          {
            name: '_queueExpiry',
            type: 'uint256',
          },
          {
            name: '_dequeueFrequency',
            type: 'uint256',
          },
          {
            name: 'approvalStageDuration',
            type: 'uint256',
          },
          {
            name: 'referendumStageDuration',
            type: 'uint256',
          },
          {
            name: 'executionStageDuration',
            type: 'uint256',
          },
        ],
        name: 'initialize',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_approver',
            type: 'address',
          },
        ],
        name: 'setApprover',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_concurrentProposals',
            type: 'uint256',
          },
        ],
        name: 'setConcurrentProposals',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_minDeposit',
            type: 'uint256',
          },
        ],
        name: 'setMinDeposit',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_queueExpiry',
            type: 'uint256',
          },
        ],
        name: 'setQueueExpiry',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: '_dequeueFrequency',
            type: 'uint256',
          },
        ],
        name: 'setDequeueFrequency',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'approvalStageDuration',
            type: 'uint256',
          },
        ],
        name: 'setApprovalStageDuration',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'referendumStageDuration',
            type: 'uint256',
          },
        ],
        name: 'setReferendumStageDuration',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'executionStageDuration',
            type: 'uint256',
          },
        ],
        name: 'setExecutionStageDuration',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'destination',
            type: 'address',
          },
          {
            name: 'functionId',
            type: 'bytes4',
          },
          {
            name: 'numerator',
            type: 'uint256',
          },
          {
            name: 'denominator',
            type: 'uint256',
          },
        ],
        name: 'setConstitution',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'values',
            type: 'uint256[]',
          },
          {
            name: 'destinations',
            type: 'address[]',
          },
          {
            name: 'data',
            type: 'bytes',
          },
          {
            name: 'dataLengths',
            type: 'uint256[]',
          },
        ],
        name: 'propose',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: true,
        stateMutability: 'payable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
          {
            name: 'lesser',
            type: 'uint256',
          },
          {
            name: 'greater',
            type: 'uint256',
          },
        ],
        name: 'upvote',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'lesser',
            type: 'uint256',
          },
          {
            name: 'greater',
            type: 'uint256',
          },
        ],
        name: 'revokeUpvote',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'approve',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
          {
            name: 'index',
            type: 'uint256',
          },
          {
            name: 'value',
            type: 'uint8',
          },
        ],
        name: 'vote',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'execute',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: false,
        inputs: [],
        name: 'withdraw',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getApprovalStageDuration',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getReferendumStageDuration',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getExecutionStageDuration',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'destination',
            type: 'address',
          },
          {
            name: 'functionId',
            type: 'bytes4',
          },
        ],
        name: 'getConstitution',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'proposalExists',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'getProposal',
        outputs: [
          {
            name: '',
            type: 'address',
          },
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'getProposalTransaction',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'address',
          },
          {
            name: '',
            type: 'bytes',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'isApproved',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'getVoteTotals',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'account',
            type: 'address',
          },
          {
            name: 'index',
            type: 'uint256',
          },
        ],
        name: 'getVoteRecord',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getQueueLength',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'getUpvotes',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getQueue',
        outputs: [
          {
            name: '',
            type: 'uint256[]',
          },
          {
            name: '',
            type: 'uint256[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [],
        name: 'getDequeue',
        outputs: [
          {
            name: '',
            type: 'uint256[]',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'account',
            type: 'address',
          },
        ],
        name: 'getUpvotedProposal',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'account',
            type: 'address',
          },
        ],
        name: 'getMostRecentReferendumProposal',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'account',
            type: 'address',
          },
        ],
        name: 'isVoting',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: false,
        inputs: [],
        name: 'dequeueProposalsIfReady',
        outputs: [],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'isQueued',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'proposalId',
            type: 'uint256',
          },
        ],
        name: 'isProposalPassing',
        outputs: [
          {
            name: '',
            type: 'bool',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'dequeueTime',
            type: 'uint256',
          },
        ],
        name: 'getDequeuedProposalStage',
        outputs: [
          {
            name: '',
            type: 'uint8',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
      {
        constant: true,
        inputs: [
          {
            name: 'dequeueTime',
            type: 'uint256',
          },
          {
            name: 'stage',
            type: 'uint8',
          },
        ],
        name: 'stageStartTime',
        outputs: [
          {
            name: '',
            type: 'uint256',
          },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
      },
    ],
    '0xC6aa5cA6B25A15F7e277231c2A4eBF6ED5BC3E1D'
  ) as unknown) as GovernanceType
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}
