pragma solidity >=0.5.13 <0.8.20;

// Useful interfaces of contracts we don't control

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

interface IExchangeInitializer {
  function initialize(
    address registryAddress,
    string calldata stableTokenIdentifier,
    uint256 _spread,
    uint256 _reserveFraction,
    uint256 _updateFrequency,
    uint256 _minimumReports
  ) external;
}

interface IExchange {
  function activateStable() external;
}

interface IReserveSpenderMultiSig {
  /**
    @dev Contract constructor sets initial owners and required number of confirmations.
    @param _owners List of initial owners.
    @param _required Number of required confirmations for external transactions.
    @param _internalRequired Number of required confirmations for internal transactions. 
  */
  function initialize(
    address[] calldata _owners,
    uint256 _required,
    uint256 _internalRequired
  ) external;
}
