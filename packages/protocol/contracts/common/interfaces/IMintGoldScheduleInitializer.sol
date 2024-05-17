// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IMintGoldScheduleInitializer {
  function initialize(
    uint256 _l2StartTime,
    uint256 _communityRewardFraction,
    address _carbonOffsettingPartner,
    uint256 _carbonOffsettingFraction,
    address registryAddress
  ) external;
}
