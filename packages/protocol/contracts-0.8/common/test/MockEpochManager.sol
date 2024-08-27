// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
// solhint-disable no-unused-vars

import "../../../contracts/common/interfaces/IEpochManager.sol";

/**
 * @title A mock EpochManager for testing.
 */

contract MockEpochManager is IEpochManager {
  struct Epoch {
    uint256 firstBlock;
    uint256 lastBlock;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 rewardsBlock;
  }

  uint256 public epochDuration;

  uint256 public firstKnownEpoch;
  uint256 private currentEpochNumber;
  address[] public elected;
  address public epochManagerInitializer;
  bool initialized;
  mapping(uint256 => Epoch) private epochs;

  function setCurrentEpochNumber(uint256 _newEpochNumber) external {
    currentEpochNumber = _newEpochNumber;
  }

  function initializeSystem(
    uint256 firstEpochNumber,
    uint256 firstEpochBlock,
    address[] calldata firstElected
  ) external {
    firstKnownEpoch = firstEpochNumber;
    currentEpochNumber = firstEpochNumber;

    Epoch storage _currentEpoch = epochs[currentEpochNumber];
    _currentEpoch.firstBlock = firstEpochBlock;
    _currentEpoch.startTimestamp = block.timestamp;

    elected = firstElected;

    initialized = true;
    epochManagerInitializer = address(0);
  }

  function startNextEpochProcess() external {}
  function finishNextEpochProcess(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external {}

  function getCurrentEpoch() external view returns (uint256, uint256, uint256, uint256, uint256) {
    Epoch storage _epoch = epochs[currentEpochNumber];

    return (
      _epoch.firstBlock,
      _epoch.lastBlock,
      _epoch.startTimestamp,
      _epoch.endTimestamp,
      _epoch.rewardsBlock
    );
  }

  function getCurrentEpochNumber() external view returns (uint256) {
    return currentEpochNumber;
  }
  function getElected() external view returns (address[] memory) {
    return elected;
  }
}
