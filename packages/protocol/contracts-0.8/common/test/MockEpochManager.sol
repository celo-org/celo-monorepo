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
    address[] elected;
  }

  uint256 public epochDuration;

  uint256 public firstKnownEpoch;
  uint256 private currentEpochNumber;
  address[] public elected;
  address public epochManagerEnabler;
  bool systemInitialized;

  bool private _isTimeForNextEpoch;
  bool private isProcessingEpoch;
  mapping(uint256 => Epoch) private epochs;

  event SendValidatorPaymentCalled(address validator);

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

    systemInitialized = true;
    epochManagerEnabler = address(0);
  }

  function startNextEpochProcess() external {}
  function finishNextEpochProcess(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external {}

  function setIsTimeForNextEpoch(bool _isTime) external {
    _isTimeForNextEpoch = _isTime;
  }
  function setIsOnEpochProcess(bool _isProcessing) external {
    isProcessingEpoch = _isProcessing;
  }

  function getCurrentEpoch()
    external
    view
    returns (uint256, uint256, uint256, uint256, address[] memory)
  {
    return getEpochByNumber(currentEpochNumber);
  }

  function getCurrentEpochNumber() external view returns (uint256) {
    return currentEpochNumber;
  }
  function getElected() external view returns (address[] memory) {
    return elected;
  }

  function getFirstBlockAtEpoch(uint256 _epoch) external view returns (uint256) {
    Epoch storage targetEpoch = epochs[_epoch];

    return (targetEpoch.firstBlock);
  }

  function getLastBlockAtEpoch(uint256 _epoch) external view returns (uint256) {
    Epoch storage targetEpoch = epochs[_epoch];

    return (targetEpoch.lastBlock);
  }

  function getEpochProcessingState()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256)
  {
    return (0, 0, 0, 0, 0);
  }

  function systemAlreadyInitialized() external view returns (bool) {
    return systemInitialized;
  }

  function isBlocked() external view returns (bool) {
    return isProcessingEpoch;
  }
  function isTimeForNextEpoch() external view returns (bool) {
    return _isTimeForNextEpoch;
  }
  function isOnEpochProcess() external view returns (bool) {
    return isProcessingEpoch;
  }

  function sendValidatorPayment(address validator) public {
    emit SendValidatorPaymentCalled(validator);
  }

  function getEpochByNumber(
    uint256 epochNumber
  ) public view returns (uint256, uint256, uint256, uint256, address[] memory) {
    Epoch storage _epoch = epochs[epochNumber];
    return (
      _epoch.firstBlock,
      _epoch.lastBlock,
      _epoch.startTimestamp,
      _epoch.rewardsBlock,
      _epoch.elected
    );
  }
}
