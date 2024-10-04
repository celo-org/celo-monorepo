// SPDX-License-Identifier: MIT
pragma solidity >=0.5.13 < 0.9;

interface IPrecompiles {
  function getEpochSize() external view returns (uint256);
  function getEpochNumber() external view returns (uint256);
}
