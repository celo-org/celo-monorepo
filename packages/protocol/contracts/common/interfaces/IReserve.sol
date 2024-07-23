// SPDX-License-Identifier: LGPL-3.0-only
pragma solidity >=0.5.13 <0.9.0;

interface IReserve {

   function initialize(
    address registryAddress,
    uint256 _tobinTaxStalenessThreshold,
    uint256 _spendingRatio,
    uint256 _frozenGold,
    uint256 _frozenDays,
    bytes32[] calldata _assetAllocationSymbols,
    uint256[] calldata _assetAllocationWeights,
    uint256 _tobinTax,
    uint256 _tobinTaxReserveRatio
  ) external;

    function setTobinTaxStalenessThreshold(uint256) external;

    function addToken(address) external returns (bool);

    function removeToken(address, uint256) external returns (bool);

    function transferGold(address payable, uint256) external returns (bool);

    function transferExchangeGold(address payable, uint256) external returns (bool);

    function getReserveGoldBalance() external view returns (uint256);

    function getUnfrozenReserveGoldBalance() external view returns (uint256);

    function getOrComputeTobinTax() external returns (uint256, uint256);

    function getTokens() external view returns (address[] memory);

    function getReserveRatio() external view returns (uint256);

    function addExchangeSpender(address) external;

    function removeExchangeSpender(address, uint256) external;

    function addSpender(address) external;

    function removeSpender(address) external;
}
