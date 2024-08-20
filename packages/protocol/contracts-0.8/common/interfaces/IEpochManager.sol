// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.8.0 <0.9.0;

interface IBlocker {
  function isBlocked() external view returns (bool);
}

interface IEpochManager is IBlocker {
  function initializeSystem(
    uint256 firstEpochNumber,
    uint256 firstEpochBlock,
    // uint256 firstEpochTimestamp, // TODO: do we need END timestamp?
    address[] calldata firstElected
  ) external;
  // function startNextEpochProcess() external;
  // function finishNextEpochProcess(
  //   address[] calldata groups,
  //   uint16[] calldata lessers,
  //   uint16 greaters
  // ) external;
  function getCurrentEpoch() external view returns (uint256, uint256, uint256, uint256);
  function getCurrentEpochNumber() external view returns (uint256);
  // function getElected() external view returns (address[] memory);
  // // function getElectedAtEpoch(uint256 epoch) external view returns (address[] memory);
  // function getFirstBlockAtEpoch(uint256 epoch) external view returns (uint256);
  // function getLastBlockAtEpoch(uint256 epoch) external view returns (uint256);

  // function isOnEpochProcess() external view returns (bool);
}
