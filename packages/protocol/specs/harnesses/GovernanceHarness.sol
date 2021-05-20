pragma solidity ^0.5.13;

import "contracts/governance/Governance.sol";
import "contracts/governance/Proposals.sol";
import "./LockedGoldHarness.sol";

contract GovernanceHarness is Governance {
  using Proposals for Proposals.Proposal;
  constructor(bool test) public Governance(test) {}

  function getDequeuedLength() public view returns (uint256) {
    return dequeued.length;
  }

  function getFromDequeued(uint256 index) public view returns (uint256) {
    return dequeued[index]; // note that this can revert if index is unchecked
  }

  // VoteValue
  function getNoneVoteEnum() public pure returns (uint256) {
    return uint256(VoteValue.None);
  }
  function getAbstainVoteEnum() public pure returns (uint256) {
    return uint256(VoteValue.Abstain);
  }
  function getYesVoteEnum() public pure returns (uint256) {
    return uint256(VoteValue.Yes);
  }
  function getNoVoteEnum() public pure returns (uint256) {
    return uint256(VoteValue.No);
  }

  function init_state() public {}

  /* Override */
  LockedGoldHarness lockedGold;
  function getLockedGold() internal view returns (ILockedGold) {
    return lockedGold;
  }

  function getTotalLockedGold() public view returns (uint256) {
    return lockedGold.getTotalLockedGold();
  }
  /*
	// requires linkage of registry
	// TODO: Note in the harness we assume already that getAddressFor always returns just the registry address
	
	*/
  /*function _getVoterFromAccount(address account) public view returns (address) {
		ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		return lockedGold.getDelegateFromAccountAndRole(account, ILockedGold.DelegateRole.Voting); 
	}*/
  /*
	function getAccountFromVoter(address voter) public view returns (address) {
		ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		return lockedGold.getAccountFromVoter(voter);
	}
	*/

  // overriding get account weight
  /*function getAccountWeight(address account) public view returns (uint256) {
		ILockedGold lockedGold = ILockedGold(registry.getAddressFor(LOCKED_GOLD_REGISTRY_ID));
		return lockedGold.getAccountWeight(account);
	}*/

  function getUpvotedProposal(address account) public view returns (uint256) {
    uint256 proposalId;
    uint256 weight;
    (proposalId, weight) = this.getUpvoteRecord(account);
    return proposalId;
  }

  function getVoteSigner(address account) public view returns (address) {
    return getAccounts().getVoteSigner(account);
  }

  function getAccountFromVoteSigner(address voter) public view returns (address) {
    return getAccounts().voteSignerToAccount(voter);
  }

  function getProposalSlim(uint256 proposalId)
    external
    view
    returns (address, uint256, uint256, uint256)
  {
    Proposals.Proposal storage proposal = proposals[proposalId];
    return (proposal.proposer, proposal.deposit, proposal.timestamp, proposal.transactions.length);
  }

  // override for performance - do nothing
  function dequeueProposalsIfReady() public {}
}
