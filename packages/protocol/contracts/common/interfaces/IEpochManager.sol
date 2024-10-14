// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IEpochManager {
  function initializeSystem(
    uint256 firstEpochNumber,
    uint256 firstEpochBlock,
    address[] calldata firstElected
  ) external;
  function startNextEpochProcess() external;
  function finishNextEpochProcess(
    address[] calldata groups,
    address[] calldata lessers,
    address[] calldata greaters
  ) external;
  function sendValidatorPayment(address) external;
  function getCurrentEpoch() external view returns (uint256, uint256, uint256, uint256);
  function getEpochByNumber(
    uint256 epochNumber
  ) external view returns (uint256, uint256, uint256, uint256);
  function getEpochByBlockNumber(
    uint256 blockNumber
  ) external view returns (uint256, uint256, uint256, uint256);
  function getEpochNumberOfBlock(uint256) external view returns (uint256);
  function getCurrentEpochNumber() external view returns (uint256);
  function numberOfElectedInCurrentSet() external view returns (uint256);
  function getElectedAccounts() external view returns (address[] memory);
  function getElectedAccountByIndex(uint256 index) external view returns (address);
  function getElectedSigners() external view returns (address[] memory);
  function getElectedSignerByIndex(uint256 index) external view returns (address);
  function epochDuration() external view returns (uint256);
  function firstKnownEpoch() external view returns (uint256);
  function getEpochProcessingState()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256);
  function systemAlreadyInitialized() external view returns (bool);
  function isBlocked() external view returns (bool);
  function isTimeForNextEpoch() external view returns (bool);
  function isOnEpochProcess() external view returns (bool);
  function getFirstBlockAtEpoch(uint256) external view returns (uint256);
  function getLastBlockAtEpoch(uint256) external view returns (uint256);
}
