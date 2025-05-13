pragma solidity >=0.8.7 <0.8.20;

contract Constants {
  // List of contracts that are expected to be in Registry.sol
  string[24] contractsInRegistry = [
    "Accounts",
    "BlockchainParameters",
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
    "GoldToken",
    "Governance",
    "GovernanceSlasher",
    "LockedGold",
    "MintGoldSchedule",
    "OdisPayments",
    "Random",
    "Registry",
    "SortedOracles",
    "UniswapFeeHandlerSeller",
    "MentoFeeHandlerSeller",
    "Validators"
  ];
}
