pragma solidity ^0.5.13;

import "../Governance.sol";
import "../Proposals.sol";

contract GovernanceTest is Governance(true) {
  using Proposals for Proposals.Proposal;

  address[] validatorSet;

  // Minimally override core functions from UsingPrecompiles
  function numberValidatorsInCurrentSet() public view returns (uint256) {
    return validatorSet.length;
  }

  function numberValidatorsInSet(uint256) public view returns (uint256) {
    return validatorSet.length;
  }

  function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    return validatorSet[index];
  }

  // Expose test utilities
  function addValidator(address validator) external {
    validatorSet.push(validator);
  }

  function setDeprecatedWeight(address voterAddress, uint256 proposalIndex, uint256 weight)
    external
  {
    Voter storage voter = voters[voterAddress];
    VoteRecord storage voteRecord = voter.referendumVotes[proposalIndex];
    voteRecord.deprecated_weight = weight;
  }
}
