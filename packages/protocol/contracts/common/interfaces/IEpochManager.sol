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
  function getCurrentEpochNumber() external view returns (uint256);
  function getElected() external view returns (address[] memory);
  function epochDuration() external view returns (uint256);
  function firstKnownEpoch() external view returns (uint256);
  function getEpochProcessingState()
    external
    view
    returns (uint256, uint256, uint256, uint256, uint256);
}
