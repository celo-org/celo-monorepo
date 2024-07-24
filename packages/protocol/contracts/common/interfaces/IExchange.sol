// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5 <0.8.20;

interface IExchange {
    function buy(
        uint256,
        uint256,
        bool
    ) external returns (uint256);

    function sell(
        uint256,
        uint256,
        bool
    ) external returns (uint256);

    function exchange(
        uint256,
        uint256,
        bool
    ) external returns (uint256);

  function initialize(
        address registryAddress,
        string calldata stableTokenIdentifier,
        uint256 _spread,
        uint256 _reserveFraction,
        uint256 _updateFrequency,
        uint256 _minimumReports
    ) external;

    function activateStable() external;

    function setUpdateFrequency(uint256) external;

    function getBuyTokenAmount(uint256, bool) external view returns (uint256);

    function getSellTokenAmount(uint256, bool) external view returns (uint256);

    function getBuyAndSellBuckets(bool) external view returns (uint256, uint256);
}
