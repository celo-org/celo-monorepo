pragma solidity >=0.5.13 <0.8.20;

interface IReserveInitializer {
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
}

interface IReserve {
  function addSpender(address) external;
  function addToken(address token) external;
}

interface IStableTokenInitialize {
  function initialize(
    string calldata _name,
    string calldata _symbol,
    uint8 _decimals,
    address registryAddress,
    uint256 inflationRate,
    uint256 inflationFactorUpdatePeriod,
    address[] calldata initialBalanceAddresses,
    uint256[] calldata initialBalanceValues,
    string calldata exchangeIdentifier
  ) external;
}
