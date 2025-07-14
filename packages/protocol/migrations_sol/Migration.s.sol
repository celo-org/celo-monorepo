pragma solidity >=0.8.7 <0.8.20;

// Note: This script should not include any cheatcode so that it can run in production

// Foundry-08 imports
import { Script } from "forge-std-8/Script.sol";

// Foundry imports
import { console } from "forge-std/console.sol";
import { stdJson } from "forge-std/StdJson.sol";

// Helper contract imports
import { IReserveInitializer, IReserve, IStableTokenInitialize, IExchangeInitializer, IExchange, IReserveSpenderMultiSig } from "@migrations-sol/HelperInterFaces.sol";
import { MigrationsConstants } from "@migrations-sol/constants.sol";

// Core contract imports on Solidity 0.5
import { IProxy } from "@celo-contracts/common/interfaces/IProxy.sol";
import { IProxyFactory } from "@celo-contracts/common/interfaces/IProxyFactory.sol";
import { IRegistry } from "@celo-contracts/common/interfaces/IRegistry.sol";
import { IRegistryInitializer } from "@celo-contracts/common/interfaces/IRegistryInitializer.sol";
import { IFreezer } from "@celo-contracts/common/interfaces/IFreezer.sol";
import { IFreezerInitializer } from "@celo-contracts/common/interfaces/IFreezerInitializer.sol";
import { ICeloTokenInitializer } from "@celo-contracts/common/interfaces/ICeloTokenInitializer.sol";
import { IAccountsInitializer } from "@celo-contracts/common/interfaces/IAccountsInitializer.sol";
import { IFeeHandlerSellerInitializer } from "@celo-contracts/common/interfaces/IFeeHandlerSellerInitializer.sol";
import { IFeeHandler } from "@celo-contracts/common/interfaces/IFeeHandler.sol";
import { IFeeHandlerInitializer } from "@celo-contracts/common/interfaces/IFeeHandlerInitializer.sol";
import { IFeeCurrencyWhitelist } from "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";
import { IEpochManagerEnabler } from "@celo-contracts/common/interfaces/IEpochManagerEnabler.sol";
import { ILockedGoldInitializer } from "@celo-contracts/governance/interfaces/ILockedGoldInitializer.sol";
import { IValidatorsInitializer } from "@celo-contracts-8/governance/interfaces/IValidatorsInitializer.sol";
import { IElectionInitializer } from "@celo-contracts/governance/interfaces/IElectionInitializer.sol";
import { IEpochRewardsInitializer } from "@celo-contracts/governance/interfaces/IEpochRewardsInitializer.sol";
import { IBlockchainParametersInitializer } from "@celo-contracts/governance/interfaces/IBlockchainParametersInitializer.sol";
import { IGovernanceSlasherInitializer } from "@celo-contracts/governance/interfaces/IGovernanceSlasherInitializer.sol";
import { IDoubleSigningSlasherInitializer } from "@celo-contracts/governance/interfaces/IDoubleSigningSlasherInitializer.sol";
import { IDowntimeSlasherInitializer } from "@celo-contracts/governance/interfaces/IDowntimeSlasherInitializer.sol";
import { IGovernanceApproverMultiSigInitializer } from "@celo-contracts/governance/interfaces/IGovernanceApproverMultiSigInitializer.sol";
import { IGovernanceInitializer } from "@celo-contracts/governance/interfaces/IGovernanceInitializer.sol";
import { ILockedGold } from "@celo-contracts/governance/interfaces/ILockedGold.sol";
import { IGovernance } from "@celo-contracts/governance/interfaces/IGovernance.sol";
import { IRandomInitializer } from "@celo-contracts/identity/interfaces/IRandomInitializer.sol";
import { IEscrowInitializer } from "@celo-contracts/identity/interfaces/IEscrowInitializer.sol";
import { IOdisPaymentsInitializer } from "@celo-contracts/identity/interfaces/IOdisPaymentsInitializer.sol";
import { IFederatedAttestationsInitializer } from "@celo-contracts/identity/interfaces/IFederatedAttestationsInitializer.sol";
import { ISortedOraclesInitializer } from "@celo-contracts/stability/interfaces/ISortedOraclesInitializer.sol";
import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";

// Core contract imports on Solidity 0.8
import { IFeeCurrencyDirectoryInitializer } from "@celo-contracts-8/common/interfaces/IFeeCurrencyDirectoryInitializer.sol";
import { IGasPriceMinimumInitializer } from "@celo-contracts-8/common/interfaces/IGasPriceMinimumInitializer.sol";
import { ICeloUnreleasedTreasuryInitializer } from "@celo-contracts-8/common/interfaces/ICeloUnreleasedTreasuryInitializer.sol";
import { IEpochManagerEnablerInitializer } from "@celo-contracts-8/common/interfaces/IEpochManagerEnablerInitializer.sol";
import { IEpochManagerInitializer } from "@celo-contracts-8/common/interfaces/IEpochManagerInitializer.sol";
import { IScoreManagerInitializer } from "@celo-contracts-8/common/interfaces/IScoreManagerInitializer.sol";
import { IFeeCurrencyDirectory } from "@celo-contracts-8/common/interfaces/IFeeCurrencyDirectory.sol";
import { UsingRegistry } from "@celo-contracts-8/common/UsingRegistry.sol";

// Test imports
import { ISECP256K1 } from "@test-sol/utils/SECP256K1.sol";
import { SelectorParser } from "@test-sol/utils/SelectorParser.sol";
import { StringUtils } from "@test-sol/utils/StringUtils.sol";

contract ForceTx {
  // event to trigger so a tx can be processed
  event VanillaEvent(string);

  // helper used to know the account broadcasting a tx
  function identity() public returns (address) {
    emit VanillaEvent("nop");
    return msg.sender;
  }
}

contract Migration is Script, UsingRegistry, MigrationsConstants {
  using stdJson for string;
  using StringUtils for string;
  using SelectorParser for string;

  struct InitParamsTunnel {
    // The number of blocks to delay a ValidatorGroup's commission
    uint256 commissionUpdateDelay;
  }

  IProxyFactory proxyFactory;

  uint256 proxyNonce = 0;

  event Result(bytes);

  function create2deploy(bytes32 salt, bytes memory initCode) internal returns (address) {
    address deployedAddress;
    assembly {
      deployedAddress := create2(0, add(initCode, 32), mload(initCode), salt)
      if iszero(extcodesize(deployedAddress)) {
        revert(0, 0)
      }
    }
    return deployedAddress;
  }

  // TODO remove this duplicated block (it's in tests)
  // can't remove because of the syntax of value
  function deployCodeTo(
    string memory what,
    bytes memory args,
    uint256 value,
    address where
  ) internal {
    bytes memory creationCode = vm.getCode(what);
    vm.etch(where, abi.encodePacked(creationCode, args));
    (bool success, bytes memory runtimeBytecode) = where.call{ value: value }("");
    require(
      success,
      "StdCheats deployCodeTo(string,bytes,uint256,address): Failed to create runtime bytecode."
    );
    vm.etch(where, runtimeBytecode);
  }

  function deployCodeTo(string memory what, address where) internal {
    deployCodeTo(what, "", 0, where);
  }
  function deployCodeTo(string memory what, bytes memory args, address where) internal {
    deployCodeTo(what, args, 0, where);
  }

  function addToRegistry(string memory contractName, address proxyAddress) public {
    IProxy proxy = IProxy(REGISTRY_ADDRESS);
    if (proxy._getImplementation() == address(0)) {
      console.log("Can't add to registry because implementation not set");
      return;
    }
    registry = IRegistry(REGISTRY_ADDRESS);
    console.log(" Setting on the registry contract:", contractName);
    registry.setAddressFor(contractName, proxyAddress);
  }

  function setImplementationOnProxy(
    IProxy proxy,
    string memory contractName,
    bytes memory initializeCalldata
  ) public {
    bytes memory implementationBytecode = vm.getCode(
      string.concat("out/", contractName, ".sol/", contractName, ".json")
    );
    bool testingDeployment = false;
    bytes memory initialCode = abi.encodePacked(
      implementationBytecode,
      abi.encode(testingDeployment)
    );
    address implementation = create2deploy(bytes32(proxyNonce), initialCode);
    // nonce to avoid having the same address to deploy to, likely won't needed but just in case
    proxyNonce++;
    console.log(" Implementation deployed to:", address(implementation));
    console.log(" Calling initialize(..)");
    proxy._setAndInitializeImplementation(implementation, initializeCalldata);
  }

  function deployProxiedContract(
    string memory contractName,
    address toProxy,
    bytes memory initializeCalldata
  ) public {
    console.log("Deploying: ", contractName);
    deployCodeTo("Proxy.sol", abi.encode(false), toProxy);
    IProxy proxy = IProxy(toProxy);
    console.log(" Proxy deployed to:", toProxy);

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
    console.log(" Done deploying:", contractName);
    console.log("------------------------------");
  }

  function deployProxiedContract(
    string memory contractName,
    bytes memory initializeCalldata
  ) public returns (address proxyAddress) {
    console.log("Deploying: ", contractName);

    // Can't deploy with new Proxy() because Proxy is in 0.5
    // Proxy proxy = new Proxy();
    // In production this should use create2, in anvil can't do that
    // because forge re-routes the create2 via Create2Deployer contract to have predictable address
    // then, a owner can be set

    proxyAddress = proxyFactory.deployProxy();

    IProxy proxy = IProxy(proxyAddress);
    console.log(" Proxy deployed to:", address(proxy));

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));

    console.log(" Done deploying:", contractName);
    console.log("------------------------------");
  }

  /**
   * Entry point of the script
   */
  function run() external {
    // TODO check that this matches DEPLOYER_ACCOUNT and the pK can be avoided with --unlock
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    string memory json = vm.readFile("./migrations_sol/migrationsConfig.json");

    proxyFactory = IProxyFactory(
      create2deploy(0, vm.getCode("./out/ProxyFactory.sol/ProxyFactory.json"))
    );

    // Proxy for Registry is already set, just deploy implementation
    migrateRegistry();
    setupUsingRegistry();

    migrateFreezer();
    migrateFeeCurrencyWhitelist();
    migrateFeeCurrencyDirectory();
    migrateCeloToken(json);
    migrateSortedOracles(json);
    migrateGasPriceMinimum(json);
    migrateReserveSpenderMultiSig(json);
    migrateReserve(json);
    migrateStableToken(json);
    migrateExchange(json);
    migrateAccount();
    migrateLockedCelo(json);
    migrateValidators(json); // this triggers a revert, the deploy after the json reads
    migrateElection(json);
    migrateEpochRewards(json);
    migrateRandom(json);
    migrateEscrow();
    // attestation not migrated
    migrateBlockchainParameters(json);
    migrateGovernanceSlasher();
    migrateDoubleSigningSlasher(json);
    migrateDowntimeSlasher(json);
    migrateGovernanceApproverMultiSig(json);
    // GrandaMento not migrated
    migrateFederatedAttestations();
    migrateMentoFeeHandlerSeller();
    migrateUniswapFeeHandlerSeller();
    migrateFeeHandler(json);
    migrateOdisPayments();
    migrateCeloUnreleasedTreasury();
    migrateEpochManagerEnabler();
    migrateEpochManager(json);
    migrateScoreManager();
    migrateGovernance(json);

    vm.stopBroadcast();

    // Functions with broadcast with different addresses
    // Validators needs to lock, which can be only used by the msg.sender
    electValidators(json);

    vm.startBroadcast(DEPLOYER_ACCOUNT);

    captureEpochManagerEnablerValidators();

    vm.stopBroadcast();
  }

  /**
   * The function calls defined here are required by the parent UsingRegistry.sol contract.
   */
  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function migrateRegistry() public {
    setImplementationOnProxy(
      IProxy(REGISTRY_ADDRESS),
      "Registry",
      abi.encodeWithSelector(IRegistryInitializer.initialize.selector)
    );
    // set registry in registry itself
    console.log("Owner of the Registry Proxy is", IProxy(REGISTRY_ADDRESS)._getOwner());
    addToRegistry("Registry", REGISTRY_ADDRESS);
    console.log("Done migration registry");
  }

  function migrateFreezer() public {
    deployProxiedContract(
      "Freezer",
      abi.encodeWithSelector(IFreezerInitializer.initialize.selector)
    );
  }

  function migrateFeeCurrencyWhitelist() public {
    deployProxiedContract(
      "FeeCurrencyWhitelist",
      abi.encodeWithSelector(IFeeCurrencyWhitelist.initialize.selector)
    );
  }

  function migrateFeeCurrencyDirectory() public {
    deployProxiedContract(
      "FeeCurrencyDirectory",
      abi.encodeWithSelector(IFeeCurrencyDirectoryInitializer.initialize.selector)
    );
  }

  function migrateCeloToken(string memory json) public {
    // TODO change pre-funded addresses to make it match circulation supply
    address celoProxyAddress = deployProxiedContract(
      "GoldToken",
      abi.encodeWithSelector(ICeloTokenInitializer.initialize.selector, REGISTRY_ADDRESS)
    );

    addToRegistry("CeloToken", celoProxyAddress);
    bool frozen = abi.decode(json.parseRaw(".goldToken.frozen"), (bool));
    if (frozen) {
      getFreezer().freeze(celoProxyAddress);
    }
  }

  function migrateSortedOracles(string memory json) public {
    uint256 reportExpirySeconds = abi.decode(
      json.parseRaw(".sortedOracles.reportExpirySeconds"),
      (uint256)
    );
    deployProxiedContract(
      "SortedOracles",
      abi.encodeWithSelector(ISortedOraclesInitializer.initialize.selector, reportExpirySeconds)
    );
  }

  function migrateGasPriceMinimum(string memory json) public {
    uint256 gasPriceMinimumFloor = abi.decode(
      json.parseRaw(".gasPriceMinimum.minimumFloor"),
      (uint256)
    );
    uint256 targetDensity = abi.decode(json.parseRaw(".gasPriceMinimum.targetDensity"), (uint256));
    uint256 adjustmentSpeed = abi.decode(
      json.parseRaw(".gasPriceMinimum.adjustmentSpeed"),
      (uint256)
    );
    uint256 baseFeeOpCodeActivationBlock = abi.decode(
      json.parseRaw(".gasPriceMinimum.baseFeeOpCodeActivationBlock"),
      (uint256)
    );

    deployProxiedContract(
      "GasPriceMinimum",
      abi.encodeWithSelector(
        IGasPriceMinimumInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        gasPriceMinimumFloor,
        targetDensity,
        adjustmentSpeed,
        baseFeeOpCodeActivationBlock
      )
    );
  }

  function migrateReserveSpenderMultiSig(string memory json) public {
    address[] memory owners = new address[](1);
    owners[0] = DEPLOYER_ACCOUNT;

    uint256 required = abi.decode(json.parseRaw(".reserveSpenderMultiSig.required"), (uint256));
    uint256 internalRequired = abi.decode(
      json.parseRaw(".reserveSpenderMultiSig.internalRequired"),
      (uint256)
    );

    // Deploys and adds the ReserveSpenderMultiSig to the Registry for ease of reference.
    // The ReserveSpenderMultiSig is not in the Registry on Mainnet, but it's useful to keep a
    // reference of the deployed contract, so it's in the Registry on the devchain.
    deployProxiedContract(
      "ReserveSpenderMultiSig",
      abi.encodeWithSelector(
        IReserveSpenderMultiSig.initialize.selector,
        owners,
        required,
        internalRequired
      )
    );
  }

  function migrateReserve(string memory json) public {
    uint256 tobinTaxStalenessThreshold = abi.decode(
      json.parseRaw(".reserve.tobinTaxStalenessThreshold"),
      (uint256)
    );
    uint256 spendingRatio = abi.decode(json.parseRaw(".reserve.spendingRatio"), (uint256));
    uint256 frozenGold = abi.decode(json.parseRaw(".reserve.frozenGold"), (uint256));
    uint256 frozenDays = abi.decode(json.parseRaw(".reserve.frozenDays"), (uint256));
    bytes32[] memory assetAllocationSymbols = abi.decode(
      json.parseRaw(".reserve.assetAllocationSymbols"),
      (bytes32[])
    );

    uint256[] memory assetAllocationWeights = abi.decode(
      json.parseRaw(".reserve.assetAllocationWeights"),
      (uint256[])
    );
    uint256 tobinTax = abi.decode(json.parseRaw(".reserve.tobinTax"), (uint256));
    uint256 tobinTaxReserveRatio = abi.decode(
      json.parseRaw(".reserve.tobinTaxReserveRatio"),
      (uint256)
    );
    uint256 initialBalance = abi.decode(json.parseRaw(".reserve.initialBalance"), (uint256));

    address reserveProxyAddress = deployProxiedContract(
      "Reserve",
      abi.encodeWithSelector(
        IReserveInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        tobinTaxStalenessThreshold,
        spendingRatio,
        frozenGold,
        frozenDays,
        assetAllocationSymbols,
        assetAllocationWeights,
        tobinTax,
        tobinTaxReserveRatio
      )
    );

    // TODO this should be a transfer from the deployer rather than a deal
    vm.deal(reserveProxyAddress, initialBalance);

    // Adds ReserveSpenderMultiSig to Reserve
    bool useSpender = abi.decode(json.parseRaw(".reserveSpenderMultiSig.required"), (bool));
    address spender = useSpender
      ? registry.getAddressForString("ReserveSpenderMultiSig")
      : DEPLOYER_ACCOUNT;

    IReserve(reserveProxyAddress).addSpender(spender);
    console.log("reserveSpenderMultiSig added as Reserve spender");
  }

  function deployStable(
    string memory name,
    string memory symbol,
    string memory sufix,
    uint8 decimals,
    uint256 inflationRate,
    uint256 inflationFactorUpdatePeriod,
    address[] memory initialBalanceAddresses,
    uint256[] memory initialBalanceValues,
    bool frozen,
    uint256 celoPrice
  ) public {
    string memory exchangeIdentifier = string.concat("Exchange", sufix);
    address stableTokenProxyAddress = deployProxiedContract(
      string.concat("StableToken", sufix),
      abi.encodeWithSelector(
        IStableTokenInitialize.initialize.selector,
        name,
        symbol,
        decimals,
        REGISTRY_ADDRESS,
        inflationRate,
        inflationFactorUpdatePeriod,
        initialBalanceAddresses,
        initialBalanceValues,
        exchangeIdentifier
      )
    );

    if (frozen) {
      getFreezer().freeze(stableTokenProxyAddress);
    }

    // TODO add more configurable oracles from the json
    getSortedOracles().addOracle(stableTokenProxyAddress, DEPLOYER_ACCOUNT);

    if (celoPrice != 0) {
      console.log("before report");
      getSortedOracles().report(stableTokenProxyAddress, celoPrice * 1e24, address(0), address(0)); // TODO use fixidity
      console.log("After report report");
    }

    IReserve(registry.getAddressForStringOrDie("Reserve")).addToken(stableTokenProxyAddress);

    getFeeCurrencyWhitelist().addToken(stableTokenProxyAddress);

    /*
    Arbitrary intrinsic gas number take from existing `FeeCurrencyDirectory.t.sol` tests
    Source: https://github.com/celo-org/celo-monorepo/blob/2cec07d43328cf4216c62491a35eacc4960fffb6/packages/protocol/test-sol/common/FeeCurrencyDirectory.t.sol#L27 
    */
    uint256 mockIntrinsicGas = 21000;

    IFeeCurrencyDirectory(registry.getAddressForStringOrDie("FeeCurrencyDirectory"))
      .setCurrencyConfig(stableTokenProxyAddress, address(getSortedOracles()), mockIntrinsicGas);
  }

  function migrateStableToken(string memory json) public {
    string[] memory names = abi.decode(json.parseRaw(".stableTokens.names"), (string[]));
    string[] memory symbols = abi.decode(json.parseRaw(".stableTokens.symbols"), (string[]));
    string[] memory contractSufixs = abi.decode(
      json.parseRaw(".stableTokens.contractSufixs"),
      (string[])
    );

    require(names.length == symbols.length, "Ticker and stable names should match");

    uint8 decimals = abi.decode(json.parseRaw(".stableTokens.decimals"), (uint8));
    uint256 inflationRate = abi.decode(json.parseRaw(".stableTokens.inflationRate"), (uint256));
    uint256 inflationFactorUpdatePeriod = abi.decode(
      json.parseRaw(".stableTokens.inflationPeriod"),
      (uint256)
    );
    uint256 initialBalanceValue = abi.decode(
      json.parseRaw(".stableTokens.initialBalance"),
      (uint256)
    );
    bool frozen = abi.decode(json.parseRaw(".stableTokens.frozen"), (bool));
    uint256 celoPrice = abi.decode(json.parseRaw(".stableTokens.celoPrice"), (uint256));

    address[] memory initialBalanceAddresses = new address[](1);
    initialBalanceAddresses[0] = DEPLOYER_ACCOUNT;

    uint256[] memory initialBalanceValues = new uint256[](1);
    initialBalanceValues[0] = initialBalanceValue;

    for (uint256 i; i < names.length; i++) {
      deployStable(
        names[i],
        symbols[i],
        contractSufixs[i],
        decimals,
        inflationRate,
        inflationFactorUpdatePeriod,
        initialBalanceAddresses,
        initialBalanceValues,
        frozen,
        celoPrice
      );
    }
  }

  function migrateExchange(string memory json) public {
    // TODO make this for all stables (using a loop like in stable)

    string memory stableTokenIdentifier = "StableToken";
    uint256 spread = abi.decode(json.parseRaw(".exchange.spread"), (uint256));
    uint256 reserveFraction = abi.decode(json.parseRaw(".exchange.reserveFraction"), (uint256));
    uint256 updateFrequency = abi.decode(json.parseRaw(".exchange.updateFrequency"), (uint256));
    uint256 minimumReports = abi.decode(json.parseRaw(".exchange.minimumReports"), (uint256));

    address exchangeProxyAddress = deployProxiedContract(
      "Exchange",
      abi.encodeWithSelector(
        IExchangeInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        stableTokenIdentifier,
        spread,
        reserveFraction,
        updateFrequency,
        minimumReports
      )
    );

    bool frozen = abi.decode(json.parseRaw(".exchange.frozen"), (bool));
    if (frozen) {
      getFreezer().freeze(exchangeProxyAddress);
    }

    IExchange(exchangeProxyAddress).activateStable();
  }

  function migrateAccount() public {
    address accountsProxyAddress = deployProxiedContract(
      "Accounts",
      abi.encodeWithSelector(IAccountsInitializer.initialize.selector, REGISTRY_ADDRESS)
    );

    IAccounts(accountsProxyAddress).setEip712DomainSeparator();
  }

  function migrateLockedCelo(string memory json) public {
    uint256 unlockingPeriod = abi.decode(json.parseRaw(".lockedGold.unlockingPeriod"), (uint256));

    address LockedCeloProxyAddress = deployProxiedContract(
      "LockedGold",
      abi.encodeWithSelector(
        ILockedGoldInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        unlockingPeriod
      )
    );

    addToRegistry("LockedCelo", LockedCeloProxyAddress);
  }

  function migrateValidators(string memory json) public {
    uint256 groupRequirementValue = abi.decode(
      json.parseRaw(".validators.groupLockedGoldRequirements.value"),
      (uint256)
    );
    uint256 groupRequirementDuration = abi.decode(
      json.parseRaw(".validators.groupLockedGoldRequirements.duration"),
      (uint256)
    );
    uint256 validatorRequirementValue = abi.decode(
      json.parseRaw(".validators.validatorLockedGoldRequirements.value"),
      (uint256)
    );
    uint256 validatorRequirementDuration = abi.decode(
      json.parseRaw(".validators.validatorLockedGoldRequirements.duration"),
      (uint256)
    );
    uint256 membershipHistoryLength = abi.decode(
      json.parseRaw(".validators.membershipHistoryLength"),
      (uint256)
    );
    uint256 slashingMultiplierResetPeriod = abi.decode(
      json.parseRaw(".validators.slashingMultiplierResetPeriod"),
      (uint256)
    );
    uint256 maxGroupSize = abi.decode(json.parseRaw(".validators.maxGroupSize"), (uint256));
    uint256 commissionUpdateDelay = abi.decode(
      json.parseRaw(".validators.commissionUpdateDelay"),
      (uint256)
    );

    InitParamsTunnel memory initParamsTunnel = InitParamsTunnel({
      commissionUpdateDelay: commissionUpdateDelay
    });

    deployProxiedContract(
      "Validators",
      abi.encodeWithSelector(
        IValidatorsInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        groupRequirementValue,
        groupRequirementDuration,
        validatorRequirementValue,
        validatorRequirementDuration,
        membershipHistoryLength,
        slashingMultiplierResetPeriod,
        maxGroupSize,
        initParamsTunnel
      )
    );
  }

  function migrateElection(string memory json) public {
    uint256 minElectableValidators = abi.decode(
      json.parseRaw(".election.minElectableValidators"),
      (uint256)
    );
    uint256 maxElectableValidators = abi.decode(
      json.parseRaw(".election.maxElectableValidators"),
      (uint256)
    );
    uint256 maxNumGroupsVotedFor = abi.decode(
      json.parseRaw(".election.maxNumGroupsVotedFor"),
      (uint256)
    );
    uint256 electabilityThreshold = abi.decode(
      json.parseRaw(".election.electabilityThreshold"),
      (uint256)
    );

    deployProxiedContract(
      "Election",
      abi.encodeWithSelector(
        IElectionInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        minElectableValidators,
        maxElectableValidators,
        maxNumGroupsVotedFor,
        electabilityThreshold
      )
    );
  }

  function migrateEpochRewards(string memory json) public {
    uint256 targetVotingYieldInitial = abi.decode(
      json.parseRaw(".epochRewards.targetVotingYieldParameters.initial"),
      (uint256)
    );
    uint256 targetVotingYieldMax = abi.decode(
      json.parseRaw(".epochRewards.targetVotingYieldParameters.max"),
      (uint256)
    );
    uint256 targetVotingYieldAdjustmentFactor = abi.decode(
      json.parseRaw(".epochRewards.targetVotingYieldParameters.adjustmentFactor"),
      (uint256)
    );
    uint256 rewardsMultiplierMax = abi.decode(
      json.parseRaw(".epochRewards.rewardsMultiplierParameters.max"),
      (uint256)
    );
    uint256 rewardsMultiplierUnderspendAdjustmentFactor = abi.decode(
      json.parseRaw(".epochRewards.rewardsMultiplierParameters.adjustmentFactors.underspend"),
      (uint256)
    );
    uint256 rewardsMultiplierOverspendAdjustmentFactor = abi.decode(
      json.parseRaw(".epochRewards.rewardsMultiplierParameters.adjustmentFactors.overspend"),
      (uint256)
    );
    uint256 targetVotingGoldFraction = abi.decode(
      json.parseRaw(".epochRewards.targetVotingGoldFraction"),
      (uint256)
    );
    uint256 targetValidatorEpochPayment = abi.decode(
      json.parseRaw(".epochRewards.maxValidatorEpochPayment"),
      (uint256)
    );
    uint256 communityRewardFraction = abi.decode(
      json.parseRaw(".epochRewards.communityRewardFraction"),
      (uint256)
    );
    address carbonOffsettingPartner = abi.decode(
      json.parseRaw(".epochRewards.carbonOffsettingPartner"),
      (address)
    );
    uint256 carbonOffsettingFraction = abi.decode(
      json.parseRaw(".epochRewards.carbonOffsettingFraction"),
      (uint256)
    );

    address epochRewardsProxy = deployProxiedContract(
      "EpochRewards",
      abi.encodeWithSelector(
        IEpochRewardsInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        targetVotingYieldInitial,
        targetVotingYieldMax,
        targetVotingYieldAdjustmentFactor,
        rewardsMultiplierMax,
        rewardsMultiplierUnderspendAdjustmentFactor,
        rewardsMultiplierOverspendAdjustmentFactor,
        targetVotingGoldFraction,
        targetValidatorEpochPayment,
        communityRewardFraction,
        carbonOffsettingPartner,
        carbonOffsettingFraction
      )
    );

    bool frozen = abi.decode(json.parseRaw(".epochRewards.frozen"), (bool));

    if (frozen) {
      getFreezer().freeze(epochRewardsProxy);
    }
  }

  function migrateRandom(string memory json) public {
    uint256 randomnessBlockRetentionWindow = abi.decode(
      json.parseRaw(".random.randomnessBlockRetentionWindow"),
      (uint256)
    );

    deployProxiedContract(
      "Random",
      abi.encodeWithSelector(IRandomInitializer.initialize.selector, randomnessBlockRetentionWindow)
    );
  }

  function migrateEscrow() public {
    deployProxiedContract("Escrow", abi.encodeWithSelector(IEscrowInitializer.initialize.selector));
  }

  function migrateBlockchainParameters(string memory json) public {
    uint256 gasForNonGoldCurrencies = abi.decode(
      json.parseRaw(".blockchainParameters.gasForNonGoldCurrencies"),
      (uint256)
    );
    uint256 gasLimit = abi.decode(json.parseRaw(".blockchainParameters.gasLimit"), (uint256));
    uint256 lookbackWindow = abi.decode(
      json.parseRaw(".blockchainParameters.lookbackWindow"),
      (uint256)
    );

    deployProxiedContract(
      "BlockchainParameters",
      abi.encodeWithSelector(
        IBlockchainParametersInitializer.initialize.selector,
        gasForNonGoldCurrencies,
        gasLimit,
        lookbackWindow
      )
    );
  }

  function migrateGovernanceSlasher() public {
    deployProxiedContract(
      "GovernanceSlasher",
      abi.encodeWithSelector(IGovernanceSlasherInitializer.initialize.selector, REGISTRY_ADDRESS)
    );

    getLockedGold().addSlasher("GovernanceSlasher");
  }

  function migrateDoubleSigningSlasher(string memory json) public {
    uint256 penalty = abi.decode(json.parseRaw(".doubleSigningSlasher.penalty"), (uint256));
    uint256 reward = abi.decode(json.parseRaw(".doubleSigningSlasher.reward"), (uint256));

    deployProxiedContract(
      "DoubleSigningSlasher",
      abi.encodeWithSelector(
        IDoubleSigningSlasherInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        penalty,
        reward
      )
    );

    getLockedGold().addSlasher("DoubleSigningSlasher");
  }

  function migrateDowntimeSlasher(string memory json) public {
    uint256 penalty = abi.decode(json.parseRaw(".downtimeSlasher.penalty"), (uint256));
    uint256 reward = abi.decode(json.parseRaw(".downtimeSlasher.reward"), (uint256));
    uint256 slashableDowntime = abi.decode(
      json.parseRaw(".downtimeSlasher.slashableDowntime"),
      (uint256)
    );

    deployProxiedContract(
      "DowntimeSlasher",
      abi.encodeWithSelector(
        IDowntimeSlasherInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        penalty,
        reward,
        slashableDowntime
      )
    );

    getLockedGold().addSlasher("DowntimeSlasher");
  }

  function migrateGovernanceApproverMultiSig(string memory json) public {
    address[] memory owners = new address[](1);
    owners[0] = DEPLOYER_ACCOUNT;

    uint256 required = abi.decode(json.parseRaw(".governanceApproverMultiSig.required"), (uint256));
    uint256 internalRequired = abi.decode(
      json.parseRaw(".governanceApproverMultiSig.internalRequired"),
      (uint256)
    );

    // This adds the multisig to the registry, which is not a case in mainnet but it's useful to keep a reference
    // of the deployed contract
    deployProxiedContract(
      "GovernanceApproverMultiSig",
      abi.encodeWithSelector(
        IGovernanceApproverMultiSigInitializer.initialize.selector,
        owners,
        required,
        internalRequired
      )
    );
  }

  function migrateFederatedAttestations() public {
    deployProxiedContract(
      "FederatedAttestations",
      abi.encodeWithSelector(IFederatedAttestationsInitializer.initialize.selector)
    );
  }

  function migrateMentoFeeHandlerSeller() public {
    address[] memory tokenAddresses;
    uint256[] memory minimumReports;

    deployProxiedContract(
      "MentoFeeHandlerSeller",
      abi.encodeWithSelector(
        IFeeHandlerSellerInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        tokenAddresses,
        minimumReports
      )
    );
  }

  function migrateUniswapFeeHandlerSeller() public {
    address[] memory tokenAddresses;
    uint256[] memory minimumReports;

    deployProxiedContract(
      "UniswapFeeHandlerSeller",
      abi.encodeWithSelector(
        IFeeHandlerSellerInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        tokenAddresses,
        minimumReports
      )
    );
  }

  function migrateFeeHandler(string memory json) public {
    address newFeeBeneficiary = abi.decode(json.parseRaw(".feeHandler.beneficiary"), (address));
    uint256 newBurnFraction = abi.decode(json.parseRaw(".feeHandler.burnFraction"), (uint256));
    address[] memory tokens;
    address[] memory handlers;
    uint256[] memory newLimits;
    uint256[] memory newMaxSlippages;

    address feeHandlerProxyAddress = deployProxiedContract(
      "FeeHandler",
      abi.encodeWithSelector(
        IFeeHandlerInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        newFeeBeneficiary,
        newBurnFraction,
        tokens,
        handlers,
        newLimits,
        newMaxSlippages
      )
    );

    IFeeHandler(feeHandlerProxyAddress).addToken(
      getStableToken(),
      address(getMentoFeeHandlerSeller())
    );
  }

  function migrateOdisPayments() public {
    deployProxiedContract(
      "OdisPayments",
      abi.encodeWithSelector(IOdisPaymentsInitializer.initialize.selector)
    );
  }

  function migrateCeloUnreleasedTreasury() public {
    deployProxiedContract(
      "CeloUnreleasedTreasury",
      abi.encodeWithSelector(
        ICeloUnreleasedTreasuryInitializer.initialize.selector,
        REGISTRY_ADDRESS
      )
    );
  }

  function migrateEpochManagerEnabler() public {
    deployProxiedContract(
      "EpochManagerEnabler",
      abi.encodeWithSelector(IEpochManagerEnablerInitializer.initialize.selector, REGISTRY_ADDRESS)
    );
  }

  function migrateScoreManager() public {
    deployProxiedContract(
      "ScoreManager",
      abi.encodeWithSelector(IScoreManagerInitializer.initialize.selector)
    );
  }

  function migrateEpochManager(string memory json) public {
    address newEpochDuration = abi.decode(
      json.parseRaw(".epochManager.newEpochDuration"),
      (address)
    );

    deployProxiedContract(
      "EpochManager",
      abi.encodeWithSelector(
        IEpochManagerInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        newEpochDuration
      )
    );
  }

  function migrateGovernance(string memory json) public {
    bool useApprover = abi.decode(json.parseRaw(".governanceApproverMultiSig.required"), (bool));

    address approver = useApprover
      ? registry.getAddressForString("GovernanceApproverMultiSig")
      : DEPLOYER_ACCOUNT;
    uint256 concurrentProposals = abi.decode(
      json.parseRaw(".governance.concurrentProposals"),
      (uint256)
    );
    uint256 minDeposit = abi.decode(json.parseRaw(".governance.minDeposit"), (uint256));
    uint256 queueExpiry = abi.decode(json.parseRaw(".governance.queueExpiry"), (uint256));
    uint256 dequeueFrequency = abi.decode(json.parseRaw(".governance.dequeueFrequency"), (uint256));
    uint256 referendumStageDuration = abi.decode(
      json.parseRaw(".governance.referendumStageDuration"),
      (uint256)
    );
    uint256 executionStageDuration = abi.decode(
      json.parseRaw(".governance.executionStageDuration"),
      (uint256)
    );
    uint256 participationBaseline = abi.decode(
      json.parseRaw(".governance.participationBaseline"),
      (uint256)
    );
    uint256 participationFloor = abi.decode(
      json.parseRaw(".governance.participationFloor"),
      (uint256)
    );
    uint256 baselineUpdateFactor = abi.decode(
      json.parseRaw(".governance.baselineUpdateFactor"),
      (uint256)
    );
    uint256 baselineQuorumFactor = abi.decode(
      json.parseRaw(".governance.baselineQuorumFactor"),
      (uint256)
    );

    address governanceProxyAddress = deployProxiedContract(
      "Governance",
      abi.encodeWithSelector(
        IGovernanceInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        approver,
        concurrentProposals,
        minDeposit,
        queueExpiry,
        dequeueFrequency,
        referendumStageDuration,
        executionStageDuration,
        participationBaseline,
        participationFloor,
        baselineUpdateFactor,
        baselineQuorumFactor
      )
    );

    _setConstitution(governanceProxyAddress, json);
    _transferOwnerShipCoreContract(governanceProxyAddress, json);
  }

  function _transferOwnerShipCoreContract(address governanceAddress, string memory json) public {
    bool skipTransferOwnership = abi.decode(
      json.parseRaw(".governance.skipTransferOwnership"),
      (bool)
    );
    if (!skipTransferOwnership) {
      // BlockchainParameters ownership transitioned to governance in a follow-up script.?
      for (uint256 i = 0; i < contractsInRegistry.length; i++) {
        string memory contractToTransfer = contractsInRegistry[i];
        console.log("Transfering ownership of: ", contractToTransfer);
        IProxy proxy = IProxy(registry.getAddressForStringOrDie(contractToTransfer));
        proxy._transferOwnership(governanceAddress);
      }
    }
  }

  // structs to combat stack too deep
  struct JsonFiles {
    string constitutionJson;
    string proxySelectors;
  }
  struct FileProps {
    string[] contractNames;
    string[] proxyNames;
    string[] proxySigs;
  }
  struct LoopVars {
    string contractName;
    address contractAddress;
    string functionName;
    bytes4 functionSelector;
    uint256 threshold;
  }

  function _setConstitution(address _governanceAddress, string memory _json) public {
    bool skipSetConstitution_ = abi.decode(
      _json.parseRaw(".governance.skipSetConstitution"),
      (bool)
    );
    IGovernance governance_ = IGovernance(_governanceAddress);
    registry = IRegistry(REGISTRY_ADDRESS);

    if (!skipSetConstitution_) {
      // get contracts from constitution
      JsonFiles memory files_ = JsonFiles(
        vm.readFile("./governanceConstitution.json"), // constitution json
        vm.readFile("./.tmp/selectors/Proxy.json") // proxy selectors
      );
      FileProps memory props_ = FileProps(
        vm.parseJsonKeys(files_.constitutionJson, ""), // contract names
        vm.parseJsonKeys(files_.constitutionJson, ".Proxy"), // proxy names
        vm.parseJsonKeys(files_.proxySelectors, "") // proxy sigs
      );

      // vars for looping
      LoopVars memory loop_;
      string memory contractSelectors_;
      string[] memory functionsWithTypes_;
      string[] memory functionNames_;

      for (uint256 i = 0; i < props_.contractNames.length; i++) {
        loop_.contractName = props_.contractNames[i];

        // skip proxy
        if (loop_.contractName.equals("Proxy")) {
          continue;
        }
        console.log(string.concat("Setting constitution thresholds for: ", loop_.contractName));

        // set address from registry
        loop_.contractAddress = registry.getAddressForString(loop_.contractName);

        // load selectors for given contract from file
        contractSelectors_ = vm.readFile(
          string.concat("./.tmp/selectors/", loop_.contractName, ".json")
        );

        // get function names with types
        functionsWithTypes_ = vm.parseJsonKeys(contractSelectors_, "");

        // get functions names from constitution for contract
        functionNames_ = vm.parseJsonKeys(
          files_.constitutionJson,
          string.concat(".", loop_.contractName)
        );

        // loop over function names
        uint256 functionsCount_ = functionNames_.length + props_.proxyNames.length;
        for (uint256 j = 0; j < functionsCount_; j++) {
          if (j < functionNames_.length) {
            // get function from contract implementation
            loop_.functionName = functionNames_[j];
          } else {
            // get function from proxy contract
            loop_.functionName = props_.proxyNames[j - functionNames_.length];
          }
          console.log(
            string.concat("  Setting constitution thresholds for function: ", loop_.functionName)
          );

          if (loop_.functionName.equals("default")) {
            // use empty selector as default
            loop_.functionSelector = hex"00000000";
          } else if (j < functionNames_.length) {
            // retrieve selector from contract selectors
            loop_.functionSelector = contractSelectors_.getSelector(
              functionsWithTypes_,
              loop_.functionName,
              vm
            );
          } else {
            // retrieve selector from proxy selectors
            loop_.functionSelector = files_.proxySelectors.getSelector(
              props_.proxySigs,
              loop_.functionName,
              vm
            );
          }

          // determine treshold from constitution
          if (j < functionNames_.length) {
            loop_.threshold = files_.constitutionJson.readUint(
              string.concat(".", loop_.contractName, ".", loop_.functionName)
            );
          } else {
            loop_.threshold = files_.constitutionJson.readUint(
              string.concat(".Proxy.", loop_.functionName)
            );
          }

          // set constitution
          if (loop_.contractAddress != address(0)) {
            governance_.setConstitution(
              loop_.contractAddress,
              loop_.functionSelector,
              loop_.threshold
            );
          } else {
            revert(
              string.concat("Contract address is invalid to set constitution: ", loop_.contractName)
            );
          }
        }
      }
    }
  }

  function lockGold(uint256 value) public {
    getAccounts().createAccount();
    getLockedGold().lock{ value: value }();
  }

  function registerValidator(
    uint256 validatorIndex,
    uint256 validatorKey,
    uint256 amountToLock,
    address groupToAffiliate
  ) public returns (address) {
    vm.startBroadcast(validatorKey);
    lockGold(amountToLock);
    address accountAddress = (new ForceTx()).identity();

    (bytes memory ecdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(accountAddress, validatorKey);
    getValidators().registerValidatorNoBls(ecdsaPubKey);
    getValidators().affiliate(groupToAffiliate);
    console.log("Done registering validators");

    vm.stopBroadcast();
    return accountAddress;
  }

  function getValidatorKeyIndex(
    uint256 groupCount,
    uint256 groupIndex,
    uint256 validatorIndex,
    uint256 membersInAGroup
  ) public returns (uint256) {
    return groupCount + groupIndex * membersInAGroup + validatorIndex;
  }

  function registerValidatorGroup(
    uint256 validator0Key,
    uint256 amountToLock,
    uint256 commission,
    string memory json
  ) public returns (address accountAddress) {
    string memory groupName = abi.decode(json.parseRaw(".validators.groupName"), (string));
    vm.startBroadcast(validator0Key);
    lockGold(amountToLock);
    getAccounts().setName(groupName);
    getValidators().registerValidatorGroup(commission);

    accountAddress = (new ForceTx()).identity();
    vm.stopBroadcast();
  }

  function _generateEcdsaPubKeyWithSigner(
    address _validator,
    uint256 _signerPk
  ) internal returns (bytes memory ecdsaPubKey, uint8 v, bytes32 r, bytes32 s) {
    (v, r, s) = getParsedSignatureOfAddress(_validator, _signerPk);

    bytes32 addressHash = keccak256(abi.encodePacked(_validator));

    ecdsaPubKey = addressToPublicKey(addressHash, v, r, s);
  }

  function addressToPublicKey(
    bytes32 message,
    uint8 _v,
    bytes32 _r,
    bytes32 _s
  ) public returns (bytes memory) {
    address SECP256K1Address = actor("SECP256K1Address");
    deployCodeTo("SECP256K1.sol:SECP256K1", SECP256K1Address);
    ISECP256K1 sECP256K1 = ISECP256K1(SECP256K1Address);

    string memory header = "\x19Ethereum Signed Message:\n32";
    bytes32 _message = keccak256(abi.encodePacked(header, message));
    (uint256 x, uint256 y) = sECP256K1.recover(
      uint256(_message),
      _v - 27,
      uint256(_r),
      uint256(_s)
    );
    return abi.encodePacked(x, y);
  }

  function actor(string memory name) internal returns (address) {
    return vm.addr(uint256(keccak256(abi.encodePacked(name))));
  }

  function toEthSignedMessageHash(bytes32 hash) internal pure returns (bytes32) {
    // 32 is the length in bytes of hash,
    // enforced by the type signature above
    return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function electValidators(string memory json) public {
    console.log("Electing validators: ");

    uint256 commission = abi.decode(json.parseRaw(".validators.commission"), (uint256));
    uint256 minElectableValidators = abi.decode(
      json.parseRaw(".election.minElectableValidators"),
      (uint256)
    );
    uint256[] memory valKeys = abi.decode(json.parseRaw(".validators.valKeys"), (uint256[]));
    uint256 maxGroupSize = abi.decode(json.parseRaw(".validators.maxGroupSize"), (uint256));
    uint256 validatorLockedGoldRequirements = abi.decode(
      json.parseRaw(".validators.validatorLockedGoldRequirements.value"),
      (uint256)
    );
    // attestationKeys not migrated

    if (valKeys.length == 0) {
      console.log("  No validators to register");
    }

    if (valKeys.length < minElectableValidators) {
      console.log(
        "Warning: Have ${valKeys.length} Validator keys but require a minimum of ${config.election.minElectableValidators} Validators in order for a new validator set to be elected."
      );
    }

    uint256 groupCount = 3;
    console.log("groupCount", groupCount);

    address[] memory groups = new address[](groupCount);

    // register 3 validator groups
    for (uint256 groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      address groupAddress = registerValidatorGroup(
        valKeys[groupIndex],
        maxGroupSize * validatorLockedGoldRequirements,
        commission,
        json
      );
      groups[groupIndex] = groupAddress;
      console.log("registered group: ", groupAddress);
    }

    console.log("  * Registering validators ... Count: ", valKeys.length - groupCount);
    // Split the validator keys into groups that will fit within the max group size.

    // TODO change name of variable amount of groups for amount in group
    for (uint256 groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      address groupAddress = groups[groupIndex];
      console.log("Registering members for group: ", groupAddress);
      for (uint256 validatorIndex = 0; validatorIndex < maxGroupSize; validatorIndex++) {
        uint256 validatorKeyIndex = getValidatorKeyIndex(
          groupCount,
          groupIndex,
          validatorIndex,
          maxGroupSize
        );
        console.log("Registering validator #: ", validatorIndex);
        address validator = registerValidator(
          validatorIndex,
          valKeys[validatorKeyIndex],
          validatorLockedGoldRequirements,
          groupAddress
        );
        // TODO start broadcast
        console.log("Adding to group...");

        vm.startBroadcast(groups[groupIndex]);
        address greater = groupIndex == 0 ? address(0) : groups[groupIndex - 1];

        if (validatorIndex == 0) {
          getValidators().addFirstMember(validator, address(0), greater);
          console.log("Making group vote for itself");
        } else {
          getValidators().addMember(validator);
        }
        getElection().vote(groupAddress, validatorLockedGoldRequirements, address(0), greater);

        vm.stopBroadcast();
      }
    }
  }

  function captureEpochManagerEnablerValidators() public {
    address numberValidatorsInCurrentSetPrecompileAddress = 0x00000000000000000000000000000000000000f9;
    numberValidatorsInCurrentSetPrecompileAddress.call(
      abi.encodeWithSignature("setNumberOfValidators()")
    );

    address validatorSignerAddressFromCurrentSetPrecompileAddress = 0x00000000000000000000000000000000000000fa;
    validatorSignerAddressFromCurrentSetPrecompileAddress.call(
      abi.encodeWithSignature("setValidators()")
    );

    address epochManagerEnabler = registry.getAddressForString("EpochManagerEnabler");
    IEpochManagerEnabler epochManagerEnablerContract = IEpochManagerEnabler(epochManagerEnabler);
    epochManagerEnablerContract.captureEpochAndValidators();
  }
}
