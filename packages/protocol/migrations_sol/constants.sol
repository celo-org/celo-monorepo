pragma solidity >=0.8.7 <0.8.20;

import { TestConstants } from "@test-sol/constants.sol";

enum SolidityVersions {
  SOLIDITY_05,
  SOLIDITY_08
}

contract MigrationsConstants is TestConstants {
  // Addresses
  address constant DEPLOYER_ACCOUNT = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  // Contracts compiled with Solidity 0.8
  mapping(string => bool) internal is08Contract;

  // List of contracts that are expected to be in Registry.sol
  string[] contractsInRegistry = [
    "Accounts",
    "CeloUnreleasedTreasury",
    "CeloToken",
    "Election",
    "EpochRewards",
    "EpochManager",
    "Escrow",
    "FederatedAttestations",
    "FeeCurrencyDirectory",
    "FeeHandler",
    "Freezer",
    "Governance",
    "GovernanceSlasher",
    "LockedGold",
    "OdisPayments",
    "Registry",
    "ScoreManager",
    "SortedOracles",
    "Validators",
    "MentoFeeHandlerSeller",
    "UniswapFeeHandlerSeller"
  ];

  constructor() {
    is08Contract["CeloUnreleasedTreasury"] = true;
    is08Contract["EpochManager"] = true;
    is08Contract["FeeCurrencyDirectory"] = true;
    is08Contract["ScoreManager"] = true;
    is08Contract["Validators"] = true;
  }

  function getSolidityVersion(string memory contractName) public view returns (SolidityVersions) {
    if (is08Contract[contractName]) {
      return SolidityVersions.SOLIDITY_08;
    }
    return SolidityVersions.SOLIDITY_05;
  }

  function getSolidityVersionPath(SolidityVersions version) public pure returns (string memory) {
    if (version == SolidityVersions.SOLIDITY_05) {
      return "out-truffle-compat/";
    }
    return "out-truffle-compat-0.8/";
  }

  function getContractArtifactPath(string memory contractName) public view returns (string memory) {
    SolidityVersions version = getSolidityVersion(contractName);
    string memory versionPath = getSolidityVersionPath(version);
    return string.concat(versionPath, contractName, ".sol/", contractName, ".json");
  }
}
