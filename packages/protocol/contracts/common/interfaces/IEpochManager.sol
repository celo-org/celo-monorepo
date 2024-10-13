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
  function setToProcessGroups() external;
  function processGroup(address group, address lesser, address greater) external;
  function sendValidatorPayment(address) external;
  function getCurrentEpoch() external view returns (uint256, uint256, uint256, uint256);
  function getCurrentEpochNumber() external view returns (uint256);
  function getElected() external view returns (address[] memory);
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
