// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;
// solhint-disable no-unused-vars

import "../../../contracts/common/interfaces/IEpochManager.sol";

/**
 * @title A mock EpochManager for testing.
 */

contract MockEpochManager is IEpochManager {
  enum EpochProcessStatus {
    NotStarted,
    Started
  }

  struct Epoch {
    uint256 firstBlock;
    uint256 lastBlock;
    uint256 startTimestamp;
    uint256 endTimestamp;
    uint256 rewardsBlock;
  }

  struct EpochProcessState {
    EpochProcessStatus status;
    uint256 perValidatorReward; // The per validator epoch reward.
    uint256 totalRewardsVoter; // The total rewards to voters.
    uint256 totalRewardsCommunity; // The total community reward.
    uint256 totalRewardsCarbonFund; // The total carbon offsetting partner reward.
  }

  uint256 public epochDuration;

  uint256 public firstKnownEpoch;
  uint256 private currentEpochNumber;
  address[] public elected;
  address[] public electedSigners;
  mapping(uint256 => address[]) internal electedAccountsOfEpoch;
  mapping(uint256 => address[]) internal electedSignersOfEpoch;
  address public epochManagerEnabler;
  bool systemInitialized;

  bool private _isTimeForNextEpoch;
  bool private isProcessingEpoch;
  EpochProcessState public epochProcessing;
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
    electedSigners = firstElected;
    electedAccountsOfEpoch[currentEpochNumber] = elected;
    electedSignersOfEpoch[currentEpochNumber] = electedSigners;

    systemInitialized = true;
    epochManagerEnabler = address(0);
  }

  function startNextEpochProcess() external {}
  function finishNextEpochProcess(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external {
    epochs[currentEpochNumber].lastBlock = block.number - 1;

    currentEpochNumber++;
    epochs[currentEpochNumber].firstBlock = block.number;
    epochs[currentEpochNumber].startTimestamp = block.timestamp;

    electedAccountsOfEpoch[currentEpochNumber] = elected;
    electedSignersOfEpoch[currentEpochNumber] = electedSigners;

    EpochProcessState memory _epochProcessingEmpty;
    epochProcessing = _epochProcessingEmpty;
  }

  function setIsTimeForNextEpoch(bool _isTime) external {
    _isTimeForNextEpoch = _isTime;
  }
  function setIsOnEpochProcess(bool _isProcessing) external {
    isProcessingEpoch = _isProcessing;
  }

  function getCurrentEpoch() external view returns (uint256, uint256, uint256, uint256) {
    return getEpochByNumber(currentEpochNumber);
  }

  function getCurrentEpochNumber() external view returns (uint256) {
    return currentEpochNumber;
  }

  function numberOfElectedInCurrentSet() external view returns (uint256) {
    return elected.length;
  }

  function numberOfElectedInSet(uint256 _blockNumber) external view returns (uint256) {
    (uint256 _epochNumber, , , , ) = _getEpochByBlockNumber(_blockNumber);
    return electedAccountsOfEpoch[_epochNumber].length;
  }

  function getElectedAccounts() external view returns (address[] memory) {
    return elected;
  }

  function getElectedAccountByIndex(uint256 index) external view returns (address) {
    return elected[index];
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

  function getEpochByBlockNumber(
    uint256 _blockNumber
  ) external view returns (uint256, uint256, uint256, uint256) {
    return (0, 0, 0, 0);
  }

  function getElectedAccountAddressFromSet(
    uint256 index,
    uint256 _blockNumber
  ) external view returns (address) {
    return address(0);
  }
  function getElectedSignerAddressFromSet(
    uint256 index,
    uint256 _blockNumber
  ) external view returns (address) {
    return address(0);
  }

  function getEpochNumberOfBlock(uint256 _blockNumber) external view returns (uint256) {
    (uint256 _epochNumber, , , , ) = _getEpochByBlockNumber(_blockNumber);
    return _epochNumber;
  }

  function getElectedSigners() external view returns (address[] memory) {
    return electedSigners;
  }

  function getElectedSignerByIndex(uint256 index) external view returns (address) {
    return electedSigners[index];
  }

  function sendValidatorPayment(address validator) public {
    emit SendValidatorPaymentCalled(validator);
  }

  function getEpochByNumber(
    uint256 epochNumber
  ) public view returns (uint256, uint256, uint256, uint256) {
    Epoch storage _epoch = epochs[epochNumber];
    return (_epoch.firstBlock, _epoch.lastBlock, _epoch.startTimestamp, _epoch.rewardsBlock);
  }

  function _getEpochByBlockNumber(
    uint256 _blockNumber
  ) internal view returns (uint256, uint256, uint256, uint256, uint256) {
    require(_blockNumber <= block.number, "Invalid blockNumber. Value too high.");
    (uint256 _firstBlockOfFirstEpoch, , , ) = getEpochByNumber(firstKnownEpoch);
    require(_blockNumber >= _firstBlockOfFirstEpoch, "Invalid blockNumber. Value too low.");
    uint256 _firstBlockOfCurrentEpoch = epochs[currentEpochNumber].firstBlock;

    if (_blockNumber >= _firstBlockOfCurrentEpoch) {
      (
        uint256 _firstBlock,
        uint256 _lastBlock,
        uint256 _startTimestamp,
        uint256 _rewardsBlock
      ) = getEpochByNumber(currentEpochNumber);
      return (currentEpochNumber, _firstBlock, _lastBlock, _startTimestamp, _rewardsBlock);
    }

    uint256 left = firstKnownEpoch;
    uint256 right = currentEpochNumber - 1;

    while (left <= right) {
      uint256 mid = (left + right) / 2;
      Epoch memory _epoch = epochs[mid];

      if (_blockNumber >= _epoch.firstBlock && _blockNumber <= _epoch.lastBlock) {
        return (
          mid,
          _epoch.firstBlock,
          _epoch.lastBlock,
          _epoch.startTimestamp,
          _epoch.rewardsBlock
        );
      } else if (_blockNumber < _epoch.firstBlock) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    revert("No matching epoch found for the given block number.");
  }
}
