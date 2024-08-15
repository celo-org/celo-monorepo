pragma solidity ^0.5.13;

/**
 * @title Contract for calculating epoch rewards.
 */
interface EpochRewards {
    function getVersionNumber()
        external
        pure
        returns (uint256, uint256, uint256, uint256);
    function initialize(
        address registryAddress,
        uint256 targetVotingYieldInitial,
        uint256 targetVotingYieldMax,
        uint256 targetVotingYieldAdjustmentFactor,
        uint256 rewardsMultiplierMax,
        uint256 rewardsMultiplierUnderspendAdjustmentFactor,
        uint256 rewardsMultiplierOverspendAdjustmentFactor,
        uint256 _targetVotingGoldFraction,
        uint256 _targetValidatorEpochPayment,
        uint256 _communityRewardFraction,
        address _carbonOffsettingPartner,
        uint256 _carbonOffsettingFraction
    ) external initializer;
    function getTargetVotingYieldParameters()
        external
        view
        returns (uint256, uint256, uint256);
    function getRewardsMultiplierParameters()
        external
        view
        returns (uint256, uint256, uint256);
    function setCommunityRewardFraction(
        uint256 value
    ) public onlyOwner returns (bool);
    function getCommunityRewardFraction() external view returns (uint256);
    function setCarbonOffsettingFund(
        address partner,
        uint256 value
    ) public onlyOwner returns (bool);
    function getCarbonOffsettingFraction() external view returns (uint256);
    function setTargetVotingGoldFraction(
        uint256 value
    ) public onlyOwner returns (bool);
}
