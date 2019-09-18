pragma solidity ^0.5.8;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "solidity-bytes-utils/contracts/BytesLib.sol";

import "../common/FixidityLib.sol";

/**
 * @title A library operating on Celo Governance proposals.
 */
library Proposals {

  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;
  using BytesLib for bytes;

  enum Stage {
    None,
    Queued,
    Approval,
    Referendum,
    Execution,
    Expiration
  }

  enum VoteValue {
    None,
    Abstain,
    No,
    Yes
  }

  struct StageDurations {
    uint256 approval;
    uint256 referendum;
    uint256 execution;
  }

  // TODO(asa): Reduce storage usage here.
  struct VoteTotals {
    uint256 yes;
    uint256 no;
    uint256 abstain;
  }

  struct Transaction {
    uint256 value;
    address destination;
    bytes data;
  }

  struct Proposal {
    address proposer;
    uint256 deposit;
    uint256 timestamp;
    VoteTotals votes;
    Transaction[] transactions;
    bool approved;
    uint256 networkWeight;
  }

  /**
   * @notice Constructs a proposal.
   * @param proposal The proposal struct to be constructed.
   * @param values The values of Celo Gold to be sent in the proposed transactions.
   * @param destinations The destination addresses of the proposed transactions.
   * @param data The concatenated data to be included in the proposed transactions.
   * @param dataLengths The lengths of each transaction's data.
   * @param proposer The proposer.
   * @param deposit The proposal deposit.
   */
  function make(
    Proposal storage proposal,
    uint256[] memory values,
    address[] memory destinations,
    bytes memory data,
    uint256[] memory dataLengths,
    address proposer,
    uint256 deposit
  )
    public
  {
    require(values.length == destinations.length && destinations.length == dataLengths.length);
    uint256 transactionCount = values.length;

    proposal.proposer = proposer;
    proposal.deposit = deposit;
    // solhint-disable-next-line not-rely-on-time
    proposal.timestamp = now;

    uint256 dataPosition = 0;
    for (uint256 i = 0; i < transactionCount; i = i.add(1)) {
      proposal.transactions.push(
        Transaction(values[i], destinations[i], data.slice(dataPosition, dataLengths[i]))
      );
      dataPosition = dataPosition.add(dataLengths[i]);
    }
  }

  /**
   * @notice Adds or changes a vote on a proposal.
   * @param proposal The proposal struct.
   * @param weight The weight of the vote.
   * @param previousVote The vote to be removed, or None for a new vote.
   * @param currentVote The vote to be set.
   */
  function updateVote(
    Proposal storage proposal,
    uint256 weight,
    VoteValue previousVote,
    VoteValue currentVote
  )
    public
  {
    // Subtract previous vote.
    if (previousVote == VoteValue.Abstain) {
      proposal.votes.abstain = proposal.votes.abstain.sub(weight);
    } else if (previousVote == VoteValue.Yes) {
      proposal.votes.yes = proposal.votes.yes.sub(weight);
    } else if (previousVote == VoteValue.No) {
      proposal.votes.no = proposal.votes.no.sub(weight);
    }

    // Add new vote.
    if (currentVote == VoteValue.Abstain) {
      proposal.votes.abstain = proposal.votes.abstain.add(weight);
    } else if (currentVote == VoteValue.Yes) {
      proposal.votes.yes = proposal.votes.yes.add(weight);
    } else if (currentVote == VoteValue.No) {
      proposal.votes.no = proposal.votes.no.add(weight);
    }
  }

  /**
   * @notice Executes the proposal.
   * @param proposal The proposal struct.
   * @dev Reverts if any transaction fails.
   */
  function execute(Proposal storage proposal) public {
    for (uint256 i = 0; i < proposal.transactions.length; i = i.add(1)) {
      require(
        externalCall(
          proposal.transactions[i].destination,
          proposal.transactions[i].value,
          proposal.transactions[i].data.length,
          proposal.transactions[i].data
        )
      );
    }
  }

  /**
   * @notice Computes the support ratio for a proposal with the quorum condition:
   *   If the total number of votes (yes + no + abstain) is less than the required number of votes,
   *   "no" votes are added to increase particiption to this level. The ratio of yes / (yes + no)
   *   votes is returned.
   * @param proposal The proposal struct.
   * @param quorum The minimum participation at which "no" votes are not added.
   * @return The support ratio with the quorum condition.
   */
  function getSupportWithQuorumPadding(
    Proposal storage proposal,
    FixidityLib.Fraction memory quorum
  )
    internal
    view
    returns (FixidityLib.Fraction memory)
  {
    uint256 yesVotes = proposal.votes.yes;
    if (yesVotes == 0) {
      return FixidityLib.newFixed(0);
    }
    uint256 noVotes = proposal.votes.no;
    uint256 totalVotes = yesVotes.add(noVotes).add(proposal.votes.abstain);
    uint256 requiredVotes = quorum.multiply(
        FixidityLib.newFixed(proposal.networkWeight)
    ).fromFixed();
    if (requiredVotes > totalVotes) {
      noVotes = noVotes.add(requiredVotes.sub(totalVotes));
    }
    return FixidityLib.newFixedFraction(yesVotes, yesVotes.add(noVotes));
  }

  /**
   * @notice Returns the stage of a dequeued proposal.
   * @param proposal The proposal struct.
   * @param stageDurations The durations of the dequeued proposal stages.
   * @return The stage of the dequeued proposal.
   * @dev Must be called on a dequeued proposal.
   */
  function getDequeuedStage(
    Proposal storage proposal,
    StageDurations storage stageDurations
  )
    internal
    view
    returns (Stage)
  {
    uint256 stageStartTime = proposal.timestamp.add(stageDurations.approval).add(
      stageDurations.referendum
    ).add(stageDurations.execution);
    // solhint-disable-next-line not-rely-on-time
    if (now >= stageStartTime) {
      return Stage.Expiration;
    }
    stageStartTime = stageStartTime.sub(stageDurations.execution);
    // solhint-disable-next-line not-rely-on-time
    if (now >= stageStartTime) {
      return Stage.Execution;
    }
    stageStartTime = stageStartTime.sub(stageDurations.referendum);
    // solhint-disable-next-line not-rely-on-time
    if (now >= stageStartTime) {
      return Stage.Referendum;
    }
    return Stage.Approval;
  }

  /**
   * @notice Returns the number of votes cast on the proposal over the total number
   *   of votes in the network as a fraction.
   * @param proposal The proposal struct.
   * @return The participation of the proposal.
   */
  function getParticipation(
    Proposal storage proposal
  ) 
    internal 
    view 
    returns (FixidityLib.Fraction memory) 
  {
    uint256 totalVotes = proposal.votes.yes.add(proposal.votes.no).add(proposal.votes.abstain);
    return FixidityLib.newFixedFraction(totalVotes, proposal.networkWeight);
  }

  /**
   * @notice Returns a specified transaction in a proposal.
   * @param proposal The proposal struct.
   * @param index The index of the specified transaction in the proposal's transaction list.
   * @return The specified transaction.
   */
  function getTransaction(
    Proposal storage proposal,
    uint256 index
  )
    public
    view
    returns (uint256, address, bytes memory)
  {
    require(index < proposal.transactions.length);
    Transaction storage transaction = proposal.transactions[index];
    return (transaction.value, transaction.destination, transaction.data);
  }

  /**
   * @notice Returns an unpacked proposal struct with its transaction count.
   * @param proposal The proposal struct.
   * @return The unpacked proposal with its transaction count.
   */
  function unpack(
    Proposal storage proposal
  )
    internal
    view
    returns (address, uint256, uint256, uint256)
  {
    return (
      proposal.proposer,
      proposal.deposit,
      proposal.timestamp,
      proposal.transactions.length
    );
  }

  /**
   * @notice Returns the referendum vote totals for a proposal.
   * @param proposal The proposal struct.
   * @return The yes, no, and abstain vote totals.
   */
  function getVoteTotals(
    Proposal storage proposal
  )
    internal
    view
    returns (uint256, uint256, uint256)
  {
    return (proposal.votes.yes, proposal.votes.no, proposal.votes.abstain);
  }

  /**
   * @notice Returns whether or not a proposal has been approved.
   * @param proposal The proposal struct.
   * @return Whether or not the proposal has been approved.
   */
  function isApproved(Proposal storage proposal) internal view returns (bool) {
    return proposal.approved;
  }

  /**
   * @notice Returns whether or not a proposal exists.
   * @param proposal The proposal struct.
   * @return Whether or not the proposal exists.
   */
  function exists(Proposal storage proposal) internal view returns (bool) {
    return proposal.timestamp > 0;
  }

  // call has been separated into its own function in order to take advantage
  // of the Solidity's code generator to produce a loop that copies tx.data into memory.
  /**
   * @notice Executes a function call.
   * @param value The value of Celo Gold to be sent with the function call.
   * @param destination The destination address of the function call.
   * @param dataLength The length of the data to be included in the function call.
   * @param data The data to be included in the function call.
   */
  function externalCall(
    address destination,
    uint value,
    uint dataLength,
    bytes memory data
  )
    private
    returns (bool)
  {
    bool result;
    /* solhint-disable no-inline-assembly */
    assembly {
      /* solhint-disable max-line-length */
      let x := mload(0x40)   // "Allocate" memory for output (0x40 is where "free memory" pointer is stored by convention)
      let d := add(data, 32) // First 32 bytes are the padded length of data, so exclude that
      result := call(
        sub(gas, 34710),   // 34710 is the value that solidity is currently emitting
                           // It includes callGas (700) + callVeryLow (3, to pay for SUB) + callValueTransferGas (9000) +
                           // callNewAccountGas (25000, in case the destination address does not exist and needs creating)
        destination,
        value,
        d,
        dataLength,        // Size of the input (in bytes) - this is what fixes the padding problem
        x,
        0                  // Output is ignored, therefore the output size is zero
      )
      /* solhint-enable max-line-length */
    }
    /* solhint-enable no-inline-assembly */
    return result;
  }
}
