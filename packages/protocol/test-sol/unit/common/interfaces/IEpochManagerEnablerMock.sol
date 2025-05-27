// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IEpochManagerEnablerMock {
  function initEpochManager() external;
  function captureEpochAndValidators() external;
  function numberValidatorsInCurrentSet() external returns (uint256);
  function numberValidatorsInSet(uint256) external returns (uint256);
  function validatorSignerAddressFromCurrentSet(uint256 index) external returns (address);
  function addValidator(address validator) external;
}
