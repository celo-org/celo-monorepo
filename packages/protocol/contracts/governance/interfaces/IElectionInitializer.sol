// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IElectionInitializer {
  function initialize(
    address registryAddress,
    uint256 minElectableValidators,
    uint256 maxElectableValidators,
    uint256 _maxNumGroupsVotedFor,
    uint256 _electabilityThreshold
  ) external;
}
