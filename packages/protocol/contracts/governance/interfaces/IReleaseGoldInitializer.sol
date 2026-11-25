// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

/**
 * @notice The initializer ABI of ReleaseGold as deployment tooling has always encoded it.
 * @dev The Solidity 0.8 ReleaseGold cannot declare fourteen parameters on one external
 * function (the non-IR compiler runs out of stack decoding them) and takes two structs
 * instead, but it still answers this selector through its fallback, so grants keep
 * being deployed with the flat argument list.
 */
interface IReleaseGoldInitializer {
  function initialize(
    uint256 releaseStartTime,
    uint256 releaseCliffTime,
    uint256 numReleasePeriods,
    uint256 releasePeriod,
    uint256 amountReleasedPerPeriod,
    bool revocable,
    address payable beneficiary,
    address releaseOwner,
    address payable refundAddress,
    bool subjectToLiquidityProvision,
    uint256 initialDistributionRatio,
    bool canValidate,
    bool canVote,
    address registryAddress
  ) external;
}
