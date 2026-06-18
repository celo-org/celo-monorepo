// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.7 <0.8.20;

import "@openzeppelin/contracts8/utils/math/SafeMath.sol";

import "../Governance.sol";
import "../Proposals.sol";
import "../../../contracts/common/FixidityLib.sol";
import "../../common/linkedlists/IntegerSortedLinkedList.sol";

/**
 * @title A 0.8 deployable mock of Governance for use in tests.
 * @dev Extends Governance(true) so the initializer guard is bypassed on
 * construction. `using` directives are NOT inherited, so they are re-declared
 * here. Mirrors the helper surface of the 0.5 GovernanceMock used by the
 * governance unit tests, plus the precompile getter overrides that supply a
 * deterministic validator set.
 */
contract GovernanceMock08 is Governance(true) {
  using Proposals for Proposals.Proposal;
  using FixidityLib for FixidityLib.Fraction;
  using SafeMath for uint256;
  using IntegerSortedLinkedList for SortedLinkedList.List;

  address[] validatorSet;

  // Expose test utilities
  function addValidator(address validator) external {
    validatorSet.push(validator);
  }

  function setDeprecatedWeight(
    address voterAddress,
    uint256 proposalIndex,
    uint256 weight,
    uint256 proposalId
  ) external {
    Voter storage voter = voters[voterAddress];
    VoteRecord storage voteRecord = voter.referendumVotes[proposalIndex];
    voteRecord.deprecated_weight = weight;
    voteRecord.proposalId = proposalId;
  }

  // exposes removeVotesWhenRevokingDelegatedVotes for tests
  function removeVotesWhenRevokingDelegatedVotesTest(
    address account,
    uint256 maxAmountAllowed
  ) public {
    _removeVotesWhenRevokingDelegatedVotes(account, maxAmountAllowed);
  }

  // Minimally override core functions from UsingPrecompiles
  function numberValidatorsInCurrentSet() public view override returns (uint256) {
    return validatorSet.length;
  }

  function numberValidatorsInSet(uint256) public view override returns (uint256) {
    return validatorSet.length;
  }

  function validatorSignerAddressFromCurrentSet(
    uint256 index
  ) public view override returns (address) {
    return validatorSet[index];
  }
}
