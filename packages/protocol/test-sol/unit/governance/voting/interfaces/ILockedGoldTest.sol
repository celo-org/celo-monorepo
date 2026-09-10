// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
pragma experimental ABIEncoderV2;

import "@celo-contracts/common/interfaces/IRegistry.sol";

// Standalone superset interface used by the 0.5 LockedGold tests to interact with
// the 0.8 LockedGold implementation deployed via deployCodeTo. Solidity 0.5
// interfaces cannot inherit, so every method the tests need is declared here.
// owner() is intentionally omitted to avoid the OZ Ownable collision; the tests
// read the owner via the 0.5 Ownable cast instead.
interface ILockedGoldTest {
  function initialize(address registryAddress, uint256 _unlockingPeriod) external;

  function lock() external payable;
  function unlock(uint256 value) external;
  function relock(uint256 index, uint256 value) external;
  function withdraw(uint256 index) external;

  function delegateGovernanceVotes(address delegatee, uint256 delegateFraction) external;
  function revokeDelegatedGovernanceVotes(address delegatee, uint256 revokeFraction) external;
  function updateDelegatedAmount(address delegator, address delegatee) external returns (uint256);

  function addSlasher(string calldata slasherIdentifier) external;
  function removeSlasher(string calldata slasherIdentifier, uint256 index) external;
  function slash(
    address account,
    uint256 penalty,
    address reporter,
    uint256 reward,
    address[] calldata lessers,
    address[] calldata greaters,
    uint256[] calldata indices
  ) external;

  function setRegistry(address registryAddress) external;
  function setUnlockingPeriod(uint256 value) external;
  function setMaxDelegateesCount(uint256 value) external;
  function setBlockedByContract(address _blockedBy) external;

  function registry() external view returns (IRegistry);
  function unlockingPeriod() external view returns (uint256);
  function totalDelegatedCelo(address) external view returns (uint256);

  function getTotalLockedGold() external view returns (uint256);
  function getNonvotingLockedGold() external view returns (uint256);
  function getAccountTotalLockedGold(address account) external view returns (uint256);
  function getAccountNonvotingLockedGold(address account) external view returns (uint256);
  function getAccountTotalDelegatedFraction(address account) external view returns (uint256);
  function getAccountTotalGovernanceVotingPower(address account) external view returns (uint256);

  function getTotalPendingWithdrawalsCount(address account) external view returns (uint256);
  function getPendingWithdrawal(
    address account,
    uint256 index
  ) external view returns (uint256, uint256);
  function getPendingWithdrawals(
    address account
  ) external view returns (uint256[] memory, uint256[] memory);
  function getPendingWithdrawalsInBatch(
    address account,
    uint256 from,
    uint256 to
  ) external view returns (uint256[] memory, uint256[] memory);

  function getSlashingWhitelist() external view returns (bytes32[] memory);
  function getDelegateesOfDelegator(address delegator) external view returns (address[] memory);
  function getDelegatorDelegateeInfo(
    address delegator,
    address delegatee
  ) external view returns (uint256 fraction, uint256 currentAmount);
  function getDelegatorDelegateeExpectedAndRealAmount(
    address delegator,
    address delegatee
  ) external view returns (uint256 expected, uint256 real);
}
