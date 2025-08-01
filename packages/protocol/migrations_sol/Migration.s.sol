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
import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol";
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
import { ConstitutionHelper } from "@test-sol/utils/ConstitutionHelper.sol";

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

  struct InitParamsTunnel {
    // The number of blocks to delay a ValidatorGroup's commission
    uint256 commissionUpdateDelay;
  }

  IProxyFactory proxyFactory;

  uint256 proxyNonce = 0;

  ConstitutionHelper.ConstitutionEntry[] internal constitutionEntries;

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

  function deployImplementationAndAddToRegistry(
    string memory contractName,
    IProxy proxy,
    bytes memory initializeCalldata
  ) public {
    address owner_ = proxy._getOwner();
    console.log("Owner is:", owner_);
    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
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
    migrateFeeCurrencyDirectory();
    migrateCeloToken(json);
    migrateSortedOracles(json);
    migrateReserveSpenderMultiSig(json);
    migrateReserve(json);
    migrateStableToken(json);
    migrateExchange(json);
    migrateAccount();
    migrateLockedCelo(json);
    migrateValidators(json);

    migrateElection(json);

    migrateEpochRewards(json);
    migrateEscrow();
    migrateGovernanceSlasher();
    // migrateGovernanceApproverMultiSig(json);
    migrateFederatedAttestations();
    migrateMentoFeeHandlerSeller();
    migrateUniswapFeeHandlerSeller();
    migrateFeeHandler(json);
    migrateOdisPayments();
    migrateCeloUnreleasedTreasury();
    vm.stopBroadcast();

    // needs to broadcast from a pre-funded account
    // run + bash + run2
    // this could be done in genesis L2 as native funds in optimism repo (TBD with Javi)
    // if anvil is underneath it might be possible to 'deal'
    // fundCeloUnreleasedTreasury(json);

    // Functions with broadcast with different addresses
    // Validators needs to lock, which can be only used by the msg.sender
  }

  function run2() public {
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    proxyFactory = IProxyFactory(
      create2deploy(
        bytes32(uint256(block.number)),
        vm.getCode("./out/ProxyFactory.sol/ProxyFactory.json")
      )
    );
    string memory json = vm.readFile("./migrations_sol/migrationsConfig.json");

    setupUsingRegistry();
    console.log("Account owner:", IProxy(address(getAccounts()))._getOwner());

    // Proxy for Registry is already set, just deploy implementation
    migrateEpochManagerEnabler();
    migrateEpochManager(json);
    migrateScoreManager();
    vm.stopBroadcast();

    initializeEpochManager(json);

    vm.startBroadcast(DEPLOYER_ACCOUNT);
    migrateGovernance(json);
    vm.stopBroadcast();

    electValidators(json);

    // vm.broadcast(DEPLOYER_ACCOUNT);
    // captureEpochManagerEnablerValidators();
  }

  /**
   * The function calls defined here are required by the parent UsingRegistry.sol contract.
   */
  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function migrateRegistry() public {
    deployImplementationAndAddToRegistry(
      "Registry",
      IProxy(REGISTRY_ADDRESS),
      abi.encodeWithSelector(IRegistryInitializer.initialize.selector)
    );
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
    address feeCurrencyDirectoryProxyAddress = 0x9212Fb72ae65367A7c887eC4Ad9bE310BAC611BF;
    deployImplementationAndAddToRegistry(
      "FeeCurrencyDirectory",
      IProxy(feeCurrencyDirectoryProxyAddress),
      abi.encodeWithSelector(IFeeCurrencyDirectoryInitializer.initialize.selector)
    );

    addToRegistry("FeeCurrencyDirectory", feeCurrencyDirectoryProxyAddress);
  }

  function migrateCeloToken(string memory json) public {
    // TODO: change pre-funded addresses to make it match circulation supply
    // pre deployed celo token proxy address from L2Genesis.s.sol
    address celoProxyAddress = 0x471EcE3750Da237f93B8E339c536989b8978a438;

    deployImplementationAndAddToRegistry(
      "GoldToken",
      IProxy(celoProxyAddress),
      abi.encodeWithSelector(ICeloTokenInitializer.initialize.selector, REGISTRY_ADDRESS)
    );

    addToRegistry("CeloToken", celoProxyAddress);

    bool frozen = json.readBool(".goldToken.frozen");
    if (frozen) {
      getFreezer().freeze(celoProxyAddress);
    }
  }

  function migrateSortedOracles(string memory json) public {
    uint256 reportExpirySeconds = json.readUint(".sortedOracles.reportExpirySeconds");
    deployProxiedContract(
      "SortedOracles",
      abi.encodeWithSelector(ISortedOraclesInitializer.initialize.selector, reportExpirySeconds)
    );
  }

  function migrateGasPriceMinimum(string memory json) public {
    uint256 gasPriceMinimumFloor = json.readUint(".gasPriceMinimum.minimumFloor");
    uint256 targetDensity = json.readUint(".gasPriceMinimum.targetDensity");
    uint256 adjustmentSpeed = json.readUint(".gasPriceMinimum.adjustmentSpeed");
    uint256 baseFeeOpCodeActivationBlock = json.readUint(
      ".gasPriceMinimum.baseFeeOpCodeActivationBlock"
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

    uint256 required = json.readUint(".reserveSpenderMultiSig.required");
    uint256 internalRequired = json.readUint(".reserveSpenderMultiSig.internalRequired");

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
    uint256 tobinTaxStalenessThreshold = json.readUint(".reserve.tobinTaxStalenessThreshold");
    uint256 spendingRatio = json.readUint(".reserve.spendingRatio");
    uint256 frozenGold = json.readUint(".reserve.frozenGold");
    uint256 frozenDays = json.readUint(".reserve.frozenDays");
    bytes32[] memory assetAllocationSymbols = json.readBytes32Array(
      ".reserve.assetAllocationSymbols"
    );

    uint256[] memory assetAllocationWeights = json.readUintArray(".reserve.assetAllocationWeights");
    uint256 tobinTax = json.readUint(".reserve.tobinTax");
    uint256 tobinTaxReserveRatio = json.readUint(".reserve.tobinTaxReserveRatio");
    uint256 initialBalance = json.readUint(".reserve.initialBalance");

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
    bool useSpender = json.readBool(".reserveSpenderMultiSig.required");
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
      getSortedOracles().report(stableTokenProxyAddress, celoPrice * 1e24, address(0), address(0)); // TODO use fixidity
    }

    IReserve(registry.getAddressForStringOrDie("Reserve")).addToken(stableTokenProxyAddress);

    /*
    Arbitrary intrinsic gas number take from existing `FeeCurrencyDirectory.t.sol` tests
    Source: https://github.com/celo-org/celo-monorepo/blob/2cec07d43328cf4216c62491a35eacc4960fffb6/packages/protocol/test-sol/common/FeeCurrencyDirectory.t.sol#L27 
    */
    uint256 mockIntrinsicGas = 21000;

    IFeeCurrencyDirectory(registry.getAddressForStringOrDie("FeeCurrencyDirectory"))
      .setCurrencyConfig(stableTokenProxyAddress, address(getSortedOracles()), mockIntrinsicGas);
  }

  function migrateStableToken(string memory json) public {
    string[] memory names = json.readStringArray(".stableTokens.names");
    string[] memory symbols = json.readStringArray(".stableTokens.symbols");
    string[] memory contractSufixs = json.readStringArray(".stableTokens.contractSufixs");

    require(names.length == symbols.length, "Ticker and stable names should match");

    uint8 decimals = abi.decode(json.parseRaw(".stableTokens.decimals"), (uint8));
    uint256 inflationRate = json.readUint(".stableTokens.inflationRate");
    uint256 inflationFactorUpdatePeriod = json.readUint(".stableTokens.inflationPeriod");
    uint256 initialBalanceValue = json.readUint(".stableTokens.initialBalance");
    bool frozen = json.readBool(".stableTokens.frozen");
    uint256 celoPrice = json.readUint(".stableTokens.celoPrice");

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
    uint256 spread = json.readUint(".exchange.spread");
    uint256 reserveFraction = json.readUint(".exchange.reserveFraction");
    uint256 updateFrequency = json.readUint(".exchange.updateFrequency");
    uint256 minimumReports = json.readUint(".exchange.minimumReports");

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

    bool frozen = json.readBool(".exchange.frozen");
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
    uint256 unlockingPeriod = json.readUint(".lockedGold.unlockingPeriod");

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
    uint256 groupRequirementValue = json.readUint(".validators.groupLockedGoldRequirements.value");
    uint256 groupRequirementDuration = json.readUint(
      ".validators.groupLockedGoldRequirements.duration"
    );
    uint256 validatorRequirementValue = json.readUint(
      ".validators.validatorLockedGoldRequirements.value"
    );
    uint256 validatorRequirementDuration = json.readUint(
      ".validators.validatorLockedGoldRequirements.duration"
    );
    uint256 membershipHistoryLength = json.readUint(".validators.membershipHistoryLength");
    uint256 slashingMultiplierResetPeriod = json.readUint(
      ".validators.slashingMultiplierResetPeriod"
    );
    uint256 maxGroupSize = json.readUint(".validators.maxGroupSize");
    uint256 commissionUpdateDelay = json.readUint(".validators.commissionUpdateDelay");

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
    uint256 minElectableValidators = json.readUint(".election.minElectableValidators");
    uint256 maxElectableValidators = json.readUint(".election.maxElectableValidators");
    uint256 maxNumGroupsVotedFor = json.readUint(".election.maxNumGroupsVotedFor");
    uint256 electabilityThreshold = json.readUint(".election.electabilityThreshold");

    address proxyAddress = proxyFactory.deployProxy();

    IProxy proxy = IProxy(proxyAddress);
    console.log(" Proxy deployed to:", address(proxy));

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

    console.log(" Done deploying:", "Election");
    console.log("------------------------------");
  }

  function migrateEpochRewards(string memory json) public {
    uint256 targetVotingYieldInitial = json.readUint(
      ".epochRewards.targetVotingYieldParameters.initial"
    );
    uint256 targetVotingYieldMax = json.readUint(".epochRewards.targetVotingYieldParameters.max");
    uint256 targetVotingYieldAdjustmentFactor = json.readUint(
      ".epochRewards.targetVotingYieldParameters.adjustmentFactor"
    );
    uint256 rewardsMultiplierMax = json.readUint(".epochRewards.rewardsMultiplierParameters.max");
    uint256 rewardsMultiplierUnderspendAdjustmentFactor = json.readUint(
      ".epochRewards.rewardsMultiplierParameters.adjustmentFactors.underspend"
    );
    uint256 rewardsMultiplierOverspendAdjustmentFactor = json.readUint(
      ".epochRewards.rewardsMultiplierParameters.adjustmentFactors.overspend"
    );
    uint256 targetVotingGoldFraction = json.readUint(".epochRewards.targetVotingGoldFraction");
    uint256 targetValidatorEpochPayment = json.readUint(".epochRewards.maxValidatorEpochPayment");
    uint256 communityRewardFraction = json.readUint(".epochRewards.communityRewardFraction");
    address carbonOffsettingPartner = json.readAddress(".epochRewards.carbonOffsettingPartner");
    uint256 carbonOffsettingFraction = json.readUint(".epochRewards.carbonOffsettingFraction");

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

    bool frozen = json.readBool(".epochRewards.frozen");

    if (frozen) {
      getFreezer().freeze(epochRewardsProxy);
    }
  }

  function migrateRandom(string memory json) public {
    uint256 randomnessBlockRetentionWindow = json.readUint(
      ".random.randomnessBlockRetentionWindow"
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
    uint256 gasForNonGoldCurrencies = json.readUint(
      ".blockchainParameters.gasForNonGoldCurrencies"
    );
    uint256 gasLimit = json.readUint(".blockchainParameters.gasLimit");
    uint256 lookbackWindow = json.readUint(".blockchainParameters.lookbackWindow");

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
    uint256 penalty = json.readUint(".doubleSigningSlasher.penalty");
    uint256 reward = json.readUint(".doubleSigningSlasher.reward");

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
    uint256 penalty = json.readUint(".downtimeSlasher.penalty");
    uint256 reward = json.readUint(".downtimeSlasher.reward");
    uint256 slashableDowntime = json.readUint(".downtimeSlasher.slashableDowntime");

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

    uint256 required = json.readUint(".governanceApproverMultiSig.required");
    uint256 internalRequired = json.readUint(".governanceApproverMultiSig.internalRequired");
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
    address newFeeBeneficiary = json.readAddress(".feeHandler.beneficiary");
    uint256 newBurnFraction = json.readUint(".feeHandler.burnFraction");
    address[] memory tokens;
    address[] memory handlers;
    uint256[] memory newLimits;
    uint256[] memory newMaxSlippages;

    // pre deployed fee handler proxy address from L2Genesis.s.sol
    address feeHandlerProxyAddress = 0xcD437749E43A154C07F3553504c68fBfD56B8778;

    deployImplementationAndAddToRegistry(
      "FeeHandler",
      IProxy(feeHandlerProxyAddress),
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
    // pre deployed celo unreleased treasury proxy address from L2Genesis.s.sol
    address celoUnreleasedTreasury = 0xB76D502Ad168F9D545661ea628179878DcA92FD5;

    deployImplementationAndAddToRegistry(
      "CeloUnreleasedTreasury",
      IProxy(celoUnreleasedTreasury),
      abi.encodeWithSelector(
        ICeloUnreleasedTreasuryInitializer.initialize.selector,
        REGISTRY_ADDRESS
      )
    );
    addToRegistry("CeloUnreleasedTreasury", celoUnreleasedTreasury);
  }

  function fundCeloUnreleasedTreasury(string memory json) public {
    console.log("Funding CeloUnreleasedTreasury");
    address celoUnreleasedTreasury = address(getCeloUnreleasedTreasury());

    // broadcast as first validator
    uint256 firstValidatorPk = json.readUint(".validators.valKeys[0]");
    vm.startBroadcast(firstValidatorPk);
    getCeloToken().transfer(celoUnreleasedTreasury, 400_000_000 ether);
    console.log(
      "Balance of CeloUnreleasedTreasury is",
      getCeloToken().balanceOf(celoUnreleasedTreasury)
    );
    vm.stopBroadcast();
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

  function initializeEpochManager(string memory json) public {
    console.log("Initialize epoch manager...");
    uint256[] memory valKeys = json.readUintArray(".validators.valKeys");
    uint256 maxGroupSize = json.readUint(".validators.maxGroupSize");
    uint256 groupCount = 3;
    address[] memory signers = new address[](maxGroupSize * groupCount);
    // TODO check no signer is left with 0x0
    uint256 signerIndexCount = 0;

    for (uint256 groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      for (uint256 validatorIndex = 0; validatorIndex < maxGroupSize; validatorIndex++) {
        uint256 validatorKeyIndex = getValidatorKeyIndex(
          groupCount,
          groupIndex,
          validatorIndex,
          maxGroupSize
        );

        vm.startBroadcast(valKeys[validatorKeyIndex]);
        // PK -> Address
        address accountAddress = (new ForceTx()).identity();
        // On mainnet potentially singer & account should be different
        // 1 -> list of accounts
        // 2 -> list of signers
        // Double check on mainnet & with Javi
        address signer = accountAddress;
        signers[signerIndexCount] = signer;
        signerIndexCount++;
        vm.stopBroadcast();
      }
    }

    // Bypass epoch manager enabler?
    vm.startBroadcast(DEPLOYER_ACCOUNT);
    IEpochManager(getEpochManager()).initializeSystem(1, block.number, signers); // TODO fix signers (nice to have)
    vm.stopBroadcast();
  }

  function migrateEpochManager(string memory json) public {
    address newEpochDuration = json.readAddress(".epochManager.newEpochDuration");

    deployProxiedContract(
      "EpochManager",
      abi.encodeWithSelector(
        IEpochManagerInitializer.initialize.selector,
        REGISTRY_ADDRESS,
        newEpochDuration,
        registry.getAddressForStringOrDie("SortedOracles")
      )
    );
  }

  function migrateGovernance(string memory json) public {
    bool useApprover = json.readBool(".governanceApproverMultiSig.required");

    address approver = useApprover
      ? registry.getAddressForString("GovernanceApproverMultiSig")
      : DEPLOYER_ACCOUNT;
    uint256 concurrentProposals = json.readUint(".governance.concurrentProposals");
    uint256 minDeposit = json.readUint(".governance.minDeposit");
    uint256 queueExpiry = json.readUint(".governance.queueExpiry");
    uint256 dequeueFrequency = json.readUint(".governance.dequeueFrequency");
    uint256 referendumStageDuration = json.readUint(".governance.referendumStageDuration");
    uint256 executionStageDuration = json.readUint(".governance.executionStageDuration");
    uint256 participationBaseline = json.readUint(".governance.participationBaseline");
    uint256 participationFloor = json.readUint(".governance.participationFloor");
    uint256 baselineUpdateFactor = json.readUint(".governance.baselineUpdateFactor");
    uint256 baselineQuorumFactor = json.readUint(".governance.baselineQuorumFactor");

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
    bool skipTransferOwnership = json.readBool(".governance.skipTransferOwnership");
    if (!skipTransferOwnership) {
      // BlockchainParameters ownership transitioned to governance in a follow-up script.?
      for (uint256 i = 0; i < contractsInRegistry.length; i++) {
        string memory contractToTransfer = contractsInRegistry[i];
        console.log("Transfering proxy ownership of: ", contractToTransfer);
        IProxy proxy = IProxy(registry.getAddressForStringOrDie(contractToTransfer));
        console.log("Previous proxy owner was: ", proxy._getOwner());
        proxy._transferOwnership(governanceAddress);
        console.log("New proxy owner is: ", proxy._getOwner());

        // Transfer contract ownership
        Ownable ownable = Ownable(registry.getAddressForStringOrDie(contractToTransfer));
        console.log("Previous contract owner was: ", ownable.owner());
        ownable.transferOwnership(governanceAddress);
        console.log("New contract owner is: ", ownable.owner());
      }
    }
  }

  function _setConstitution(address _governanceAddress, string memory _json) public {
    bool skipSetConstitution_ = _json.readBool(".governance.skipSetConstitution");
    IGovernance governance_ = IGovernance(_governanceAddress);
    registry = IRegistry(REGISTRY_ADDRESS);

    if (!skipSetConstitution_) {
      // read constitution
      ConstitutionHelper.readConstitution(constitutionEntries, registry, vm);

      // loop over & set constitution
      for (uint256 i = 0; i < constitutionEntries.length; i++) {
        ConstitutionHelper.ConstitutionEntry memory entry_ = constitutionEntries[i];
        console.log(
          "Setting constitution for contract: ",
          entry_.contractName,
          " on function: ",
          entry_.functionName
        );

        if (entry_.contractAddress != address(0)) {
          governance_.setConstitution(
            entry_.contractAddress,
            entry_.functionSelector,
            entry_.threshold
          );
        } else {
          revert(
            string.concat("Contract address is invalid to set constitution: ", entry_.contractName)
          );
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
    string memory groupName = json.readString(".validators.groupName");
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

    uint256 commission = json.readUint(".validators.commission");
    uint256 minElectableValidators = json.readUint(".election.minElectableValidators");
    uint256[] memory valKeys = json.readUintArray(".validators.valKeys");
    uint256 maxGroupSize = json.readUint(".validators.maxGroupSize");
    uint256 validatorLockedGoldRequirements = json.readUint(
      ".validators.validatorLockedGoldRequirements.value"
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

    uint256 groupCount = json.readUint(".validators.groupCount");

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
