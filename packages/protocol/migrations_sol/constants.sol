pragma solidity >=0.8.7 <0.8.20;

contract MigrationsConstants {
  // List of contracts that are expected to be in Registry.sol
  string[24] contractsInRegistry = [
    "Accounts",
    "BlockchainParameters",
    "CeloDistributionSchedule",
    "CeloToken",
    "DoubleSigningSlasher",
    "DowntimeSlasher",
    "Election",
    "EpochRewards",
    "Escrow",
    "FederatedAttestations",
    "FeeCurrencyWhitelist",
    "FeeCurrencyDirectory",
    "Freezer",
    "FeeHandler",
    "Governance",
    "GovernanceSlasher",
    "LockedGold",
    "OdisPayments",
    "Random",
    "Registry",
    "SortedOracles",
    "UniswapFeeHandlerSeller",
    "MentoFeeHandlerSeller",
    "Validators"
  ];
}
