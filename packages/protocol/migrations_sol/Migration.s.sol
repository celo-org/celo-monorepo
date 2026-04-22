pragma solidity >=0.8.7 <0.8.20;

// Note: This script should not include any cheatcode so that it can run in production

// Foundry-08 imports
import { Script } from "forge-std-8/Script.sol";

// Foundry imports
import { console } from "forge-std/console.sol";
import { stdJson } from "forge-std/StdJson.sol";

// OpenZeppelin
import { Ownable } from "@openzeppelin/contracts8/access/Ownable.sol";

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
import { IAccounts } from "@celo-contracts/common/interfaces/IAccounts.sol";
import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol";
import { ILockedGoldInitializer } from "@celo-contracts/governance/interfaces/ILockedGoldInitializer.sol";
import { IValidators } from "@celo-contracts/governance/interfaces/IValidators.sol";
import { IValidatorsInitializer } from "@celo-contracts-8/governance/interfaces/IValidatorsInitializer.sol";
import { IElectionInitializer } from "@celo-contracts/governance/interfaces/IElectionInitializer.sol";
import { IEpochRewardsInitializer } from "@celo-contracts/governance/interfaces/IEpochRewardsInitializer.sol";
import { IGovernanceSlasherInitializer } from "@celo-contracts/governance/interfaces/IGovernanceSlasherInitializer.sol";
import { IGovernanceApproverMultiSigInitializer } from "@celo-contracts/governance/interfaces/IGovernanceApproverMultiSigInitializer.sol";
import { IGovernanceInitializer } from "@celo-contracts/governance/interfaces/IGovernanceInitializer.sol";
import { ILockedGold } from "@celo-contracts/governance/interfaces/ILockedGold.sol";
import { IERC20 } from "@openzeppelin/contracts8/token/ERC20/IERC20.sol";
import { IGovernance } from "@celo-contracts/governance/interfaces/IGovernance.sol";
import { IEscrowInitializer } from "@celo-contracts/identity/interfaces/IEscrowInitializer.sol";
import { IOdisPaymentsInitializer } from "@celo-contracts/identity/interfaces/IOdisPaymentsInitializer.sol";
import { IFederatedAttestationsInitializer } from "@celo-contracts/identity/interfaces/IFederatedAttestationsInitializer.sol";
import { ISortedOraclesInitializer } from "@celo-contracts/stability/interfaces/ISortedOraclesInitializer.sol";
import { ISortedOracles } from "@celo-contracts/stability/interfaces/ISortedOracles.sol";

// Core contract imports on Solidity 0.8
import { IFeeCurrencyDirectoryInitializer } from "@celo-contracts-8/common/interfaces/IFeeCurrencyDirectoryInitializer.sol";
import { ICeloUnreleasedTreasuryInitializer } from "@celo-contracts-8/common/interfaces/ICeloUnreleasedTreasuryInitializer.sol";
import { IEpochManagerInitializer } from "@celo-contracts-8/common/interfaces/IEpochManagerInitializer.sol";
import { IScoreManagerInitializer } from "@celo-contracts-8/common/interfaces/IScoreManagerInitializer.sol";
import { IFeeCurrencyDirectory } from "@celo-contracts-8/common/interfaces/IFeeCurrencyDirectory.sol";
import { UsingRegistry } from "@celo-contracts-8/common/UsingRegistry.sol";

// Test imports
import { ISECP256K1, SECP256K1 } from "@test-sol/utils/SECP256K1.sol";
import { ConstitutionHelper } from "@test-sol/utils/ConstitutionHelper.sol";

contract Migration is Script, UsingRegistry, MigrationsConstants {
  using stdJson for string;

  struct InitParamsTunnel {
    // The number of blocks to delay a ValidatorGroup's commission
    uint256 commissionUpdateDelay;
  }

  string configurationFileRawJSON;
  IProxyFactory internal proxyFactory;
  uint256 internal proxyNonce = 0;
  address DEPLOYER_ACCOUNT;
  address SECP256K1Address;

  ConstitutionHelper.ConstitutionEntry[] internal constitutionEntries;

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

  function deployContract(string memory contractName, bytes32 nonce) internal returns (address) {
    return create2deploy(nonce, vm.getCode(getContractArtifactPath(contractName)));
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
    bytes memory implementationBytecode = vm.getCode(getContractArtifactPath(contractName));
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
    bytes memory initializeCalldata
  ) public returns (address proxyAddress) {
    // Can't deploy with new Proxy() because Proxy is in 0.5
    // Proxy proxy = new Proxy();
    // In production this should use create2, in anvil can't do that
    // because forge re-routes the create2 via Create2Deployer contract to have predictable address
    // then, a owner can be set

    proxyAddress = proxyFactory.deployProxy();

    IProxy proxy = IProxy(proxyAddress);
    console.log(" New proxy deployed to:", address(proxy));

    setImplementationOnProxyAndAddToRegistry(contractName, proxy, initializeCalldata);

    console.log(" Done deploying:", contractName);
    console.log("------------------------------");
  }

  function setImplementationOnProxyAndAddToRegistry(
    string memory contractName,
    IProxy proxy,
    bytes memory initializeCalldata
  ) public {
    address owner_ = proxy._getOwner();
    console.log("Owner of Proxy is:", owner_);
    console.log("Deploying implementation of: ", contractName);
    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
  }

  function setUp() public {
    console.log("Setting up migration...");
    configurationFileRawJSON = vm.readFile("./migrations_sol/migrationsConfig.json");
    DEPLOYER_ACCOUNT = configurationFileRawJSON.readAddress(".deployerAccount");
  }

  /**
   * First part of the migration, deploys most contracts
   */
  function runMigration() external {
    vm.startBroadcast(DEPLOYER_ACCOUNT);

    proxyFactory = IProxyFactory(deployContract("ProxyFactory", 0));

    migrateRegistry();
    setupUsingRegistry();
    migrateFreezer();
    migrateFeeCurrencyDirectory(configurationFileRawJSON);
    migrateCeloToken(configurationFileRawJSON);
    migrateSortedOracles(configurationFileRawJSON);
    migrateReserveSpenderMultiSig(configurationFileRawJSON);
    migrateReserve(configurationFileRawJSON);
    migrateStableToken(configurationFileRawJSON);

    migrateExchange(configurationFileRawJSON);

    migrateAccount();

    migrateLockedCelo(configurationFileRawJSON);
    migrateValidators(configurationFileRawJSON);
    migrateElection(configurationFileRawJSON);
    migrateEpochRewards(configurationFileRawJSON);
    migrateEscrow();

    migrateGovernanceSlasher();
    migrateGovernanceApproverMultiSig(configurationFileRawJSON);
    migrateFederatedAttestations();
    migrateMentoFeeHandlerSeller();
    migrateUniswapFeeHandlerSeller();
    migrateFeeHandler(configurationFileRawJSON);
    migrateOdisPayments();
    migrateCeloUnreleasedTreasury(configurationFileRawJSON);

    vm.stopBroadcast();

    // fund the CeloUnreleasedTreasury
    vm.startBroadcast(configurationFileRawJSON.readUint(".deployerPrivateKey"));

    // doing a native transfer is not allowed by the unreleased treasury
    uint256 treasuryBalance = configurationFileRawJSON.readUint(
      ".celoUnreleasedTreasury.initialBalance"
    );
    IERC20(registry.getAddressForStringOrDie("GoldToken")).transfer(
      registry.getAddressForStringOrDie("CeloUnreleasedTreasury"),
      treasuryBalance
    );
    vm.stopBroadcast();
  }

  /**
   * Second part of the migration, deploys EpochManager and Governance
   */
  function runAfterMigration() public {
    setupUsingRegistry();

    vm.startBroadcast(DEPLOYER_ACCOUNT);
    // increase the salt to avoid address collision from previous run
    proxyFactory = IProxyFactory(deployContract("ProxyFactory", bytes32(uint256(1))));

    checkUnreleasedTreasuryBalance();
    migrateEpochManager(configurationFileRawJSON);
    migrateScoreManager();
    vm.stopBroadcast();

    initializeEpochManager(configurationFileRawJSON);

    vm.startBroadcast(DEPLOYER_ACCOUNT);
    migrateGovernance(configurationFileRawJSON);

    SECP256K1Address = address(new SECP256K1());
    vm.stopBroadcast();

    electValidators(configurationFileRawJSON);
  }

  function checkUnreleasedTreasuryBalance() internal {
    address celoUnreleasedTreasury = address(getCeloUnreleasedTreasury());
    uint256 balance = getCeloToken().balanceOf(celoUnreleasedTreasury);
    console.log("Unreleased Treasury balance: ", balance, "CELO");
  }

  /**
   * The function calls defined here are required by the parent UsingRegistry.sol contract.
   */
  function setupUsingRegistry() public {
    _transferOwnership(DEPLOYER_ACCOUNT);
    setRegistry(REGISTRY_ADDRESS);
  }

  function migrateRegistry() public {
    setImplementationOnProxyAndAddToRegistry(
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

  function migrateFeeCurrencyDirectory(string memory json) public {
    address feeCurrencyDirectoryProxyAddress = configurationFileRawJSON.readAddress(
      ".proxies.feeCurrencyDirectory"
    );
    setImplementationOnProxyAndAddToRegistry(
      "FeeCurrencyDirectory",
      IProxy(feeCurrencyDirectoryProxyAddress),
      abi.encodeWithSelector(IFeeCurrencyDirectoryInitializer.initialize.selector)
    );
  }

  function migrateCeloToken(string memory json) public {
    // TODO: change pre-funded addresses to make it match circulation supply
    // pre deployed celo token proxy address from L2Genesis.s.sol
    address celoProxyAddress = configurationFileRawJSON.readAddress(".proxies.celoToken");

    setImplementationOnProxyAndAddToRegistry(
      "GoldToken",
      IProxy(celoProxyAddress),
      abi.encodeWithSelector(ICeloTokenInitializer.initialize.selector, REGISTRY_ADDRESS)
    );

    addToRegistry("CeloToken", celoProxyAddress);

    bool frozen = configurationFileRawJSON.readBool(".goldToken.frozen");
    if (frozen) {
      getFreezer().freeze(celoProxyAddress);
    }
  }

  function migrateSortedOracles(string memory json) public {
    uint256 reportExpirySeconds = configurationFileRawJSON.readUint(
      ".sortedOracles.reportExpirySeconds"
    );
    deployProxiedContract(
      "SortedOracles",
      abi.encodeWithSelector(ISortedOraclesInitializer.initialize.selector, reportExpirySeconds)
    );
  }

  function migrateReserveSpenderMultiSig(string memory json) public {
    address[] memory owners = new address[](1);
    owners[0] = DEPLOYER_ACCOUNT;

    bool required = configurationFileRawJSON.readBool(".reserveSpenderMultiSig.required");
    bool internalRequired = configurationFileRawJSON.readBool(
      ".reserveSpenderMultiSig.internalRequired"
    );

    // Deploys and adds the ReserveSpenderMultiSig to the Registry for ease of reference.
    // The ReserveSpenderMultiSig is not in the Registry on Mainnet, but it's useful to keep a
    // reference of the deployed contract, so it's in the Registry on the devchain.
    deployProxiedContract(
      "ReserveSpenderMultiSig",
      abi.encodeWithSelector(
        IReserveSpenderMultiSig.initialize.selector,
        owners,
        required ? 1 : 0,
        internalRequired ? 1 : 0
      )
    );
  }

  function migrateReserve(string memory json) public {
    console.log(
      "WARNING: The Reserve contract is not really a smart contract relevant to us anymore. \n"
      "We only have it because the StableTokens need it for compatibility."
    );

    uint256 tobinTaxStalenessThreshold = configurationFileRawJSON.readUint(
      ".reserve.tobinTaxStalenessThreshold"
    );
    uint256 spendingRatio = configurationFileRawJSON.readUint(".reserve.spendingRatio");
    uint256 frozenGold = configurationFileRawJSON.readUint(".reserve.frozenGold");
    uint256 frozenDays = configurationFileRawJSON.readUint(".reserve.frozenDays");
    bytes32[] memory assetAllocationSymbols = configurationFileRawJSON.readBytes32Array(
      ".reserve.assetAllocationSymbols"
    );

    uint256[] memory assetAllocationWeights = configurationFileRawJSON.readUintArray(
      ".reserve.assetAllocationWeights"
    );
    uint256 tobinTax = configurationFileRawJSON.readUint(".reserve.tobinTax");
    uint256 tobinTaxReserveRatio = configurationFileRawJSON.readUint(
      ".reserve.tobinTaxReserveRatio"
    );
    uint256 initialBalance = configurationFileRawJSON.readUint(".reserve.initialBalance");

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
    bool useSpender = configurationFileRawJSON.readBool(".reserveSpenderMultiSig.required");
    address spender = useSpender
      ? registry.getAddressForString("ReserveSpenderMultiSig")
      : DEPLOYER_ACCOUNT;

    IReserve(reserveProxyAddress).addSpender(spender);
    console.log("reserveSpenderMultiSig added as Reserve spender");
  }

  struct StableTokenDeployParams {
    uint8 decimals;
    uint256 inflationRate;
    uint256 inflationFactorUpdatePeriod;
    bool frozen;
    uint256 celoPrice;
    uint256 intrinsicGas;
  }

  function deployStable(
    string memory name,
    string memory symbol,
    string memory suffix,
    address[] memory initialBalanceAddresses,
    uint256[] memory initialBalanceValues,
    StableTokenDeployParams memory params
  ) public {
    string memory exchangeIdentifier = string.concat("Exchange", suffix);
    address stableTokenProxyAddress = deployProxiedContract(
      string.concat("StableToken", suffix),
      abi.encodeWithSelector(
        IStableTokenInitialize.initialize.selector,
        name,
        symbol,
        params.decimals,
        REGISTRY_ADDRESS,
        params.inflationRate,
        params.inflationFactorUpdatePeriod,
        initialBalanceAddresses,
        initialBalanceValues,
        exchangeIdentifier
      )
    );

    if (params.frozen) {
      getFreezer().freeze(stableTokenProxyAddress);
    }

    // TODO add more configurable oracles from the json
    getSortedOracles().addOracle(stableTokenProxyAddress, DEPLOYER_ACCOUNT);

    if (params.celoPrice != 0) {
      getSortedOracles().report(
        stableTokenProxyAddress,
        params.celoPrice * 1e24,
        address(0),
        address(0)
      ); // TODO use fixidity
    }

    IReserve(registry.getAddressForStringOrDie("Reserve")).addToken(stableTokenProxyAddress);

    IFeeCurrencyDirectory(registry.getAddressForStringOrDie("FeeCurrencyDirectory"))
      .setCurrencyConfig(stableTokenProxyAddress, address(getSortedOracles()), params.intrinsicGas);
  }

  function migrateStableToken(string memory json) public {
    console.log(
      "WARNING: The Mento integration in this migration script is from a very old Mento version. \n"
      "At this point, it mostly serves as an example of an ERC20 token with support for fee abstraction."
    );

    string[] memory names = configurationFileRawJSON.readStringArray(".stableTokens.names");
    string[] memory symbols = configurationFileRawJSON.readStringArray(".stableTokens.symbols");
    string[] memory contractSuffixes = configurationFileRawJSON.readStringArray(
      ".stableTokens.contractSuffixes"
    );

    require(names.length == symbols.length, "Ticker and stable names should match");

    address[] memory initialBalanceAddresses = new address[](1);
    initialBalanceAddresses[0] = DEPLOYER_ACCOUNT;

    uint256[] memory initialBalanceValues = new uint256[](1);
    initialBalanceValues[0] = configurationFileRawJSON.readUint(".stableTokens.initialBalance");

    StableTokenDeployParams memory params = StableTokenDeployParams({
      decimals: abi.decode(configurationFileRawJSON.parseRaw(".stableTokens.decimals"), (uint8)),
      inflationRate: configurationFileRawJSON.readUint(".stableTokens.inflationRate"),
      inflationFactorUpdatePeriod: configurationFileRawJSON.readUint(
        ".stableTokens.inflationPeriod"
      ),
      frozen: configurationFileRawJSON.readBool(".stableTokens.frozen"),
      celoPrice: configurationFileRawJSON.readUint(".stableTokens.celoPrice"),
      intrinsicGas: json.readUint(".feeCurrencyDirectory.intrinsicGas")
    });

    for (uint8 i; i < names.length; i++) {
      deployStable(
        names[i],
        symbols[i],
        contractSuffixes[i],
        initialBalanceAddresses,
        initialBalanceValues,
        params
      );
    }
  }

  function migrateExchange(string memory json) public {
    // TODO make this for all stables (using a loop like in stable)

    string memory stableTokenIdentifier = "StableToken";
    uint256 spread = configurationFileRawJSON.readUint(".exchange.spread");
    uint256 reserveFraction = configurationFileRawJSON.readUint(".exchange.reserveFraction");
    uint256 updateFrequency = configurationFileRawJSON.readUint(".exchange.updateFrequency");
    uint256 minimumReports = configurationFileRawJSON.readUint(".exchange.minimumReports");

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

    bool frozen = configurationFileRawJSON.readBool(".exchange.frozen");
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
    uint256 unlockingPeriod = configurationFileRawJSON.readUint(".lockedGold.unlockingPeriod");

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
    uint256 groupRequirementValue = configurationFileRawJSON.readUint(
      ".validators.groupLockedGoldRequirements.value"
    );
    uint256 groupRequirementDuration = configurationFileRawJSON.readUint(
      ".validators.groupLockedGoldRequirements.duration"
    );
    uint256 validatorRequirementValue = configurationFileRawJSON.readUint(
      ".validators.validatorLockedGoldRequirements.value"
    );
    uint256 validatorRequirementDuration = configurationFileRawJSON.readUint(
      ".validators.validatorLockedGoldRequirements.duration"
    );
    uint256 membershipHistoryLength = configurationFileRawJSON.readUint(
      ".validators.membershipHistoryLength"
    );
    uint256 slashingMultiplierResetPeriod = configurationFileRawJSON.readUint(
      ".validators.slashingMultiplierResetPeriod"
    );
    uint256 maxGroupSize = configurationFileRawJSON.readUint(".validators.maxGroupSize");
    uint256 commissionUpdateDelay = configurationFileRawJSON.readUint(
      ".validators.commissionUpdateDelay"
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
    uint256 minElectableValidators = configurationFileRawJSON.readUint(
      ".election.minElectableValidators"
    );
    uint256 maxElectableValidators = configurationFileRawJSON.readUint(
      ".election.maxElectableValidators"
    );
    uint256 maxNumGroupsVotedFor = configurationFileRawJSON.readUint(
      ".election.maxNumGroupsVotedFor"
    );
    uint256 electabilityThreshold = configurationFileRawJSON.readUint(
      ".election.electabilityThreshold"
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

    console.log(" Done deploying:", "Election");
    console.log("------------------------------");
  }

  function migrateEpochRewards(string memory json) public {
    uint256 targetVotingYieldInitial = configurationFileRawJSON.readUint(
      ".epochRewards.targetVotingYieldParameters.initial"
    );
    uint256 targetVotingYieldMax = configurationFileRawJSON.readUint(
      ".epochRewards.targetVotingYieldParameters.max"
    );
    uint256 targetVotingYieldAdjustmentFactor = configurationFileRawJSON.readUint(
      ".epochRewards.targetVotingYieldParameters.adjustmentFactor"
    );
    uint256 rewardsMultiplierMax = configurationFileRawJSON.readUint(
      ".epochRewards.rewardsMultiplierParameters.max"
    );
    uint256 rewardsMultiplierUnderspendAdjustmentFactor = configurationFileRawJSON.readUint(
      ".epochRewards.rewardsMultiplierParameters.adjustmentFactors.underspend"
    );
    uint256 rewardsMultiplierOverspendAdjustmentFactor = configurationFileRawJSON.readUint(
      ".epochRewards.rewardsMultiplierParameters.adjustmentFactors.overspend"
    );
    uint256 targetVotingGoldFraction = configurationFileRawJSON.readUint(
      ".epochRewards.targetVotingGoldFraction"
    );
    uint256 targetValidatorEpochPayment = configurationFileRawJSON.readUint(
      ".epochRewards.maxValidatorEpochPayment"
    );
    uint256 communityRewardFraction = configurationFileRawJSON.readUint(
      ".epochRewards.communityRewardFraction"
    );
    address carbonOffsettingPartner = configurationFileRawJSON.readAddress(
      ".epochRewards.carbonOffsettingPartner"
    );
    uint256 carbonOffsettingFraction = configurationFileRawJSON.readUint(
      ".epochRewards.carbonOffsettingFraction"
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

    bool frozen = configurationFileRawJSON.readBool(".epochRewards.frozen");

    if (frozen) {
      getFreezer().freeze(epochRewardsProxy);
    }
  }

  function migrateEscrow() public {
    deployProxiedContract("Escrow", abi.encodeWithSelector(IEscrowInitializer.initialize.selector));
  }

  function migrateGovernanceSlasher() public {
    deployProxiedContract(
      "GovernanceSlasher",
      abi.encodeWithSelector(IGovernanceSlasherInitializer.initialize.selector, REGISTRY_ADDRESS)
    );

    getLockedGold().addSlasher("GovernanceSlasher");
  }

  function migrateGovernanceApproverMultiSig(string memory json) public {
    address[] memory owners = new address[](1);
    owners[0] = DEPLOYER_ACCOUNT;

    bool required = configurationFileRawJSON.readBool(".governanceApproverMultiSig.required");
    bool internalRequired = configurationFileRawJSON.readBool(
      ".governanceApproverMultiSig.internalRequired"
    );
    // This adds the multisig to the registry, which is not a case in mainnet but it's useful to keep a reference
    // of the deployed contract
    deployProxiedContract(
      "GovernanceApproverMultiSig",
      abi.encodeWithSelector(
        IGovernanceApproverMultiSigInitializer.initialize.selector,
        owners,
        required ? 1 : 0,
        internalRequired ? 1 : 0
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
    address newFeeBeneficiary = configurationFileRawJSON.readAddress(".feeHandler.beneficiary");
    uint256 newBurnFraction = configurationFileRawJSON.readUint(".feeHandler.burnFraction");
    address[] memory tokens;
    address[] memory handlers;
    uint256[] memory newLimits;
    uint256[] memory newMaxSlippages;

    // pre deployed fee handler proxy address from L2Genesis.s.sol
    address feeHandlerProxyAddress = configurationFileRawJSON.readAddress(".proxies.feeHandler");

    setImplementationOnProxyAndAddToRegistry(
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

  function migrateCeloUnreleasedTreasury(string memory json) public {
    // pre deployed celo unreleased treasury proxy address from L2Genesis.s.sol
    address celoUnreleasedTreasury = configurationFileRawJSON.readAddress(
      ".proxies.celoUnreleasedTreasury"
    );

    setImplementationOnProxyAndAddToRegistry(
      "CeloUnreleasedTreasury",
      IProxy(celoUnreleasedTreasury),
      abi.encodeWithSelector(
        ICeloUnreleasedTreasuryInitializer.initialize.selector,
        REGISTRY_ADDRESS
      )
    );
  }

  function migrateScoreManager() public {
    deployProxiedContract(
      "ScoreManager",
      abi.encodeWithSelector(IScoreManagerInitializer.initialize.selector)
    );
  }

  function initializeEpochManager(string memory json) public {
    console.log("Initialize EpochManager...");
    uint256[] memory valKeys = configurationFileRawJSON.readUintArray(".validators.valKeys");
    uint256 maxGroupSize = configurationFileRawJSON.readUint(".validators.maxGroupSize");
    uint256 groupCount = configurationFileRawJSON.readUint(".validators.groupCount");
    uint256 totalValidators = maxGroupSize * groupCount;
    address[] memory signers = new address[](totalValidators);
    IAccounts accounts = getAccounts();
    uint256 count = 0;

    for (uint256 groupIndex = 0; groupIndex < groupCount; groupIndex++) {
      for (uint256 validatorIndex = 0; validatorIndex < maxGroupSize; validatorIndex++) {
        uint256 validatorKeyIndex = getValidatorKeyIndex(
          groupCount,
          groupIndex,
          validatorIndex,
          maxGroupSize
        );
        address account = vm.addr(valKeys[validatorKeyIndex]);
        signers[count] = accounts.getValidatorSigner(account);
        count++;
      }
    }

    vm.startBroadcast(DEPLOYER_ACCOUNT);
    IEpochManager(getEpochManager()).initializeSystem(1, block.number, signers);
    vm.stopBroadcast();
  }

  function migrateEpochManager(string memory json) public {
    uint256 newEpochDuration = configurationFileRawJSON.readUint(".epochManager.newEpochDuration");

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
    bool useApprover = configurationFileRawJSON.readBool(".governanceApproverMultiSig.required");

    address approver = useApprover
      ? registry.getAddressForString("GovernanceApproverMultiSig")
      : DEPLOYER_ACCOUNT;
    uint256 concurrentProposals = configurationFileRawJSON.readUint(
      ".governance.concurrentProposals"
    );
    uint256 minDeposit = configurationFileRawJSON.readUint(".governance.minDeposit");
    uint256 queueExpiry = configurationFileRawJSON.readUint(".governance.queueExpiry");
    uint256 dequeueFrequency = configurationFileRawJSON.readUint(".governance.dequeueFrequency");
    uint256 referendumStageDuration = configurationFileRawJSON.readUint(
      ".governance.referendumStageDuration"
    );
    uint256 executionStageDuration = configurationFileRawJSON.readUint(
      ".governance.executionStageDuration"
    );
    uint256 participationBaseline = configurationFileRawJSON.readUint(
      ".governance.participationBaseline"
    );
    uint256 participationFloor = configurationFileRawJSON.readUint(
      ".governance.participationFloor"
    );
    uint256 baselineUpdateFactor = configurationFileRawJSON.readUint(
      ".governance.baselineUpdateFactor"
    );
    uint256 baselineQuorumFactor = configurationFileRawJSON.readUint(
      ".governance.baselineQuorumFactor"
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
    bool skipTransferOwnership = configurationFileRawJSON.readBool(
      ".governance.skipTransferOwnership"
    );
    if (!skipTransferOwnership) {
      for (uint256 i = 0; i < contractsInRegistry.length; i++) {
        string memory contractToTransfer = contractsInRegistry[i];
        console.log("Transferring ownership of: ", contractToTransfer);

        // Transfer proxy ownership
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

  function _setConstitution(address _governanceAddress, string memory _configulationJSON) public {
    bool skipSetConstitution_ = _configulationJSON.readBool(".governance.skipSetConstitution");
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
    uint256 validatorKey,
    uint256 signerKey,
    uint256 amountToLock,
    address groupToAffiliate
  ) public returns (address) {
    vm.startBroadcast(validatorKey);
    lockGold(amountToLock);
    address accountAddress = vm.addr(validatorKey);
    address signerAddress = vm.addr(signerKey);

    // Authorize validator signer (without public key — can't use WithPublicKey variant
    // because updateEcdsaPublicKey requires isValidator, and we haven't registered yet)
    (uint8 sv, bytes32 sr, bytes32 ss) = getParsedSignatureOfAddress(accountAddress, signerKey);
    getAccounts().authorizeValidatorSigner(signerAddress, sv, sr, ss);

    // Register with the signer's ECDSA public key
    (bytes memory ecdsaPubKey, , , ) = _generateEcdsaPubKeyWithSigner(accountAddress, signerKey);
    getValidators().registerValidatorNoBls(ecdsaPubKey);
    getValidators().affiliate(groupToAffiliate);
    console.log("Done registering validator, signer: ", signerAddress);

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
    string memory groupName = configurationFileRawJSON.readString(".validators.groupName");
    vm.startBroadcast(validator0Key);
    lockGold(amountToLock);
    getAccounts().setName(groupName);
    getValidators().registerValidatorGroup(commission);

    accountAddress = vm.addr(validator0Key);
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

    uint256 commission = configurationFileRawJSON.readUint(".validators.commission");
    uint256 minElectableValidators = configurationFileRawJSON.readUint(
      ".election.minElectableValidators"
    );
    uint256[] memory valKeys = configurationFileRawJSON.readUintArray(".validators.valKeys");
    string memory signersMnemonic = configurationFileRawJSON.readString(
      ".validators.signersMnemonic"
    );
    uint256 maxGroupSize = configurationFileRawJSON.readUint(".validators.maxGroupSize");
    uint256 validatorLockedGoldRequirements = configurationFileRawJSON.readUint(
      ".validators.validatorLockedGoldRequirements.value"
    );
    uint256 groupCount = configurationFileRawJSON.readUint(".validators.groupCount");

    if (valKeys.length == 0) {
      console.log("  No validators to register");
    }
    if (valKeys.length < minElectableValidators) {
      console.log(
        "Warning: Have ${valKeys.length} Validator keys but require a minimum of ${config.election.minElectableValidators} Validators in order for a new validator set to be elected."
      );
    }

    // register 3 validator groups
    address[] memory groups = new address[](groupCount);
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

    console.log("  * Registering validators... Count: ", valKeys.length - groupCount);

    IValidators validators = getValidators();
    uint256 signerIndex = 0;

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

        uint256 signerKey = vm.deriveKey(signersMnemonic, uint32(signerIndex));
        signerIndex++;

        console.log("Registering validator #: ", validatorIndex);
        address validator = registerValidator(
          valKeys[validatorKeyIndex],
          signerKey,
          validatorLockedGoldRequirements,
          groupAddress
        );

        console.log("Adding to group...");
        vm.startBroadcast(groups[groupIndex]);
        address greater = groupIndex == 0 ? address(0) : groups[groupIndex - 1];

        if (validatorIndex == 0) {
          validators.addFirstMember(validator, address(0), greater);
          console.log("Making group vote for itself");
        } else {
          validators.addMember(validator);
        }

        console.log("Voting for group...");
        getElection().vote(groupAddress, validatorLockedGoldRequirements, address(0), greater);

        vm.stopBroadcast();
      }
    }
  }
}
