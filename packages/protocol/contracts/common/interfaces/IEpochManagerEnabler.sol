// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IEpochManagerEnabler {
  function initEpochManager() external;
  function getEpochNumber() external returns (uint256);
  function captureEpochAndValidators() external;
}
