// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IEpochManagerInitializer {
  function initialize(
    address registryAddress,
    uint256 newEpochDuration,
    address _carbonOffsettingPartner,
    address _epochManagerEnabler
  ) external;
}
