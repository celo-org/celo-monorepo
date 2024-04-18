pragma solidity >=0.8.7 <0.8.20;
// Can be moved to 0.8 if I use the interfaces? Need to do for Proxy
// TODO proxy should have getOwner as external

// Note: This scrip should not include any cheatcode so that it can run in production

import {Script} from "forge-std-8/Script.sol";
import "forge-std/console.sol";
import "forge-std/StdJson.sol";

import "@celo-contracts/common/interfaces/IProxyFactory.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IFreezer.sol";
import "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import "@celo-contracts/common/interfaces/ICeloToken.sol"; // TODO move these to Initializer
import "@celo-contracts/common/interfaces/IAccountsInitializer.sol";
import "@celo-contracts/common/interfaces/IAccounts.sol";
import "@celo-contracts/governance/interfaces/LockedGoldfunctionInitializer.sol";
import "@celo-contracts/governance/interfaces/IValidatorsInitializer.sol";
import "@celo-contracts/governance/interfaces/IElectionInitializer.sol";
import "@celo-contracts/governance/interfaces/IEpochRewardsInitializer.sol";
import "@celo-contracts/governance/interfaces/IBlockchainParametersInitializer.sol";
import "@celo-contracts/governance/interfaces/ILockedGold.sol";
import "@celo-contracts/common/interfaces/IAccounts.sol";
import "@celo-contracts/governance/interfaces/IGovernanceSlasherInitializer.sol";
import "@celo-contracts/governance/interfaces/IDoubleSigningSlasherInitializer.sol";
import "@celo-contracts/governance/interfaces/IDowntimeSlasherInitializer.sol";
import "@celo-contracts/governance/interfaces/IGovernanceApproverMultiSigInitializer.sol";
import "@celo-contracts/governance/interfaces/IGovernanceInitializer.sol";

import "@celo-contracts/governance/interfaces/IGovernance.sol";

import "@celo-contracts/common/interfaces/IFeeHandlerSellerInitializer.sol";
import "@celo-contracts/common/interfaces/IFeeHandlerInitializer.sol";
import "@celo-contracts/common/interfaces/IFeeHandler.sol";

import "@celo-contracts/identity/interfaces/IRandomInitializer.sol";
import "@celo-contracts/identity/interfaces/IEscrowInitializer.sol";
import "@celo-contracts/identity/interfaces/IOdisPaymentsInitializer.sol";
import "@celo-contracts/identity/interfaces/IFederatedAttestationsInitializer.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import "@celo-contracts-8/common/interfaces/IGasPriceMinimumInitializer.sol";
import "./HelperInterFaces.sol";
import "@openzeppelin/contracts8/utils/math/Math.sol";

import "@celo-contracts-8/common/UsingRegistry.sol";


import "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";


// import "@celo-contracts/precompiles/EpochSizePrecompile.sol";
// import "./precompiles/EpochSizePrecompile.sol";



// import { SortedOracles } from "@celo-contract/stability/SortedOracles.sol";

// import "./SortedOracles.sol";



// Using Registry
contract Migration is Script, UsingRegistry {
  using stdJson for string;

  address constant deployerAccount = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;

  IProxyFactory proxyFactory;

  uint256 proxyNonce = 0;
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);

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
  function deployCodeTo(string memory what, bytes memory args, uint256 value, address where)
    internal
  {
    bytes memory creationCode = vm.getCode(what);
    vm.etch(where, abi.encodePacked(creationCode, args));
    (bool success, bytes memory runtimeBytecode) = where.call{value: value}("");
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
    IProxy proxy = IProxy(registryAddress);
    if (proxy._getImplementation() == address(0)){
      console.log("Can't add to registry because implementation not set");
      return;

    }
    IRegistry registry = IRegistry(registryAddress);
    console.log(" Setting on the registry contract:", contractName);
    registry.setAddressFor(contractName, proxyAddress);
  }

  function setImplementationOnProxy(
    IProxy proxy,
    string memory contractName,
    bytes memory initializeCalldata
  ) public {
    // bytes memory implementationBytecode = vm.getCode(string.concat(contractName, ".sol"));
    console.log("msg.sender", msg.sender);
    console.log("address(this)", address(this));
    // console.log("address(Create2)", address(Create2));
    // console.log("owner of proxy is:", proxy._getOwner());
    bytes memory implementationBytecode = vm.getCode(string.concat("out/", contractName, ".sol/", contractName, ".json"));
    bool testingDeployment = false;
    bytes memory initialCode = abi.encodePacked(
      implementationBytecode,
      abi.encode(testingDeployment)
    );
    address implementation = create2deploy(bytes32(proxyNonce), initialCode);
    proxyNonce++; // nonce to avoid having the same address to deploy to, likely won't needed but just in case
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

  function deployProxiedContract(string memory contractName, bytes memory initializeCalldata) public returns (address proxyAddress) {
    console.log("Deploying: ", contractName);

    // Can't deploy with new Proxy() because Proxy is in 0.5
    // Proxy proxy = new Proxy();
    // In production this should use create2, in testing can't do that
    // because forge re-routes the create2 via Create2Deployer contract to have predictable address
    // address proxyAddress = create2deploy(bytes32(proxyNonce), vm.getCode("Proxy.sol"));
    // TODO figure out if this works in production

    // address proxyAddress = address(
    //   uint160((uint256(sha256(abi.encode(vm.getCode("Proxy.sol"), proxyNonce)))))
    // );
    // deployCodeTo("Proxy.sol", abi.encode(false), proxyAddress);
    proxyAddress = proxyFactory.deployProxy();

    IProxy proxy = IProxy(proxyAddress);
    console.log(" Proxy deployed to:", address(proxy));

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));

    console.log(" Done deploying:", contractName);
    console.log("------------------------------");
  }

  function run() external {
    // it's anvil key
    // TODO check that this matches deployerAccount and the pK can be avoided with --unlock
    vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

    // TODO replace all the lines here with "Migrations.deployA()"
    // TODO rename this script to MigrationsScript

    // load migration confirm 
    string memory json = vm.readFile("./migrations_sol/migrationsConfig.json");

    // proxyFactory = IProxyFactory(create2deploy(0, vm.getCode("ProxyFactory.sol")));
    // https://github.com/foundry-rs/foundry/issues/7569
    proxyFactory = IProxyFactory(create2deploy(0, vm.getCode("./out/ProxyFactory.sol/ProxyFactory.json")));

    // deploy a proxy just to get the owner
    // IProxy deployedProxy = IProxy(proxyFactory.deployProxy());
    // deployedProxy._transferOwnership(address(this));
    // console.log("Proxy with owner at:",  address(deployedProxy));
    // console.logBytes32(bytes32(uint256(keccak256("eip1967.proxy.admin")) - 1));

    // TODO in production the proxy of the registry is created using a cheatcode
    // deployProxiedContract("Registry", registryAddress, abi.encodeWithSelector(IRegistry.initialize.selector));

    // just set the initialization of a proxy
    migrateRegistry();
    setRegistry(registryAddress); // UsingRegistry
    
    migrateFreezer();
    migrateFeeCurrencyWhitelist();
    migrateGoldToken(json);
    migrateSortedOracles(json);
    migrateGasPriceMinimum(json);
    migrateReserve(json);
    // cUER and cREAL not migrated
    migrateStableToken(json);
    migrateExchange(json);
    migrateAccount();
    migrateLockedGold(json);
    migrateValidators(json); // this triggers a revert, the deploy after the json reads
    migrateElection(json);
    migrateEpochRewards(json);
    migrateRandom(json);
    migrateEscrow();
    // // attestations not migrates
    migrateBlockchainParameters(json);
    migrateGovernanceSlasher();
    migrateDoubleSigningSlasher(json);
    migrateDowntimeSlasher(json);
    migrateGovernanceApproverMultiSig(json);
    // // GrandaMento not migrated
    migrateFederatedAttestations();
    migrateMentoFeeHandlerSeller();
    migrateUniswapFeeHandlerSeller();
    migrateFeeHandler(json);
    migrateOdisPayments();
    migrateGovernance(json);
    vm.stopBroadcast();

    electValidators(json);

    // // // little sanity check, remove later
    // IRegistry registry = IRegistry(registryAddress);
    // registry.setAddressFor("registry", address(1));
    // console.log("print:");
    // console.logAddress(registry.getAddressForStringOrDie("registry"));

  }

  function migrateRegistry() public {
    setImplementationOnProxy(IProxy(registryAddress), "Registry", abi.encodeWithSelector(IRegistry.initialize.selector));
    // set registry in registry itself
    addToRegistry("Registry", registryAddress);
  }

  function migrateFreezer() public {
    // TODO migrate the initializations interface
    deployProxiedContract("Freezer", abi.encodeWithSelector(IFreezer.initialize.selector));
  }

  function migrateFeeCurrencyWhitelist() public {
    // TODO migrate the initializations interface
    deployProxiedContract("FeeCurrencyWhitelist", abi.encodeWithSelector(IFeeCurrencyWhitelist.initialize.selector));
  }

  function migrateGoldToken(string memory json) public {
    // TODO change pre-funded addresses to make it match circulation supply
    address goldProxyAddress = deployProxiedContract(
      "GoldToken",
      abi.encodeWithSelector(ICeloToken.initialize.selector, registryAddress));

    bool frozen = abi.decode(json.parseRaw(".goldToken.frozen"), (bool));
    if (frozen){
      getFreezer().freeze(goldProxyAddress);
    }

  }

  function migrateSortedOracles(string memory json) public {
    uint256 reportExpirySeconds = abi.decode(json.parseRaw(".sortedOracles.reportExpirySeconds"), (uint256));
    deployProxiedContract(
      "SortedOracles",
      abi.encodeWithSelector(ISortedOracles.initialize.selector, reportExpirySeconds));
  }

  function migrateGasPriceMinimum(string memory json) public {
    uint256 gasPriceMinimumFloor = abi.decode(json.parseRaw(".gasPriceMinimum.minimumFloor"), (uint256));
    uint256 targetDensity = abi.decode(json.parseRaw(".gasPriceMinimum.targetDensity"), (uint256));
    uint256 adjustmentSpeed = abi.decode(json.parseRaw(".gasPriceMinimum.adjustmentSpeed"), (uint256));
    uint256 baseFeeOpCodeActivationBlock = abi.decode(json.parseRaw(".gasPriceMinimum.baseFeeOpCodeActivationBlock"), (uint256));

    deployProxiedContract(
      "GasPriceMinimum",
      abi.encodeWithSelector(IGasPriceMinimumInitializer.initialize.selector, registryAddress, gasPriceMinimumFloor, targetDensity, adjustmentSpeed, baseFeeOpCodeActivationBlock));
  }

  function migrateReserve(string memory json) public {

    // Reserve spend multisig not migrates

    uint256 tobinTaxStalenessThreshold = abi.decode(json.parseRaw(".reserve.tobinTaxStalenessThreshold"), (uint256));
    uint256 spendingRatio = abi.decode(json.parseRaw(".reserve.spendingRatio"), (uint256));
    uint256 frozenGold = abi.decode(json.parseRaw(".reserve.frozenGold"), (uint256));
    uint256 frozenDays = abi.decode(json.parseRaw(".reserve.frozenDays"), (uint256));
    bytes32[] memory assetAllocationSymbols = abi.decode(json.parseRaw(".reserve.assetAllocationSymbols"), (bytes32[]));

    uint256[] memory assetAllocationWeights = abi.decode(json.parseRaw(".reserve.assetAllocationWeights"), (uint256[]));
    uint256 tobinTax = abi.decode(json.parseRaw(".reserve.tobinTax"), (uint256));
    uint256 tobinTaxReserveRatio = abi.decode(json.parseRaw(".reserve.tobinTaxReserveRatio"), (uint256));
    uint256 initialBalance = abi.decode(json.parseRaw(".reserve.initialBalance"), (uint256));
    
    address reserveProxyAddress = deployProxiedContract(
      "Reserve",
      abi.encodeWithSelector(IReserveInitializer.initialize.selector, registryAddress, tobinTaxStalenessThreshold, spendingRatio, frozenGold, frozenDays, assetAllocationSymbols, assetAllocationWeights, tobinTax, tobinTaxReserveRatio));

    // with the reserve we migrate:
    // spender, wont do
    // otherReserveAddress, wont do
    // send initialBalance to Reserve
    // TODO this should be a transfer from the deployer rather than a deal
    vm.deal(reserveProxyAddress, initialBalance);
    // reserve.setFrozenGold, wont do
    address reserveSpenderMultiSig = deployerAccount;
    IReserve(reserveProxyAddress).addSpender(reserveSpenderMultiSig);
    console.log("reserveSpenderMultiSig set to:", reserveSpenderMultiSig);
  }

  function migrateStableToken(string memory json) public {
    // TODO add cEUR, cBRL, etc
    string memory name = abi.decode(json.parseRaw(".stableToken.tokenName"), (string));
    string memory symbol = abi.decode(json.parseRaw(".stableToken.tokenSymbol"), (string));
    uint8 decimals = abi.decode(json.parseRaw(".stableToken.decimals"), (uint8));
    uint256 inflationRate = abi.decode(json.parseRaw(".stableToken.inflationRate"), (uint256));
    uint256 inflationFactorUpdatePeriod = abi.decode(json.parseRaw(".stableToken.inflationPeriod"), (uint256));
    uint256 initialBalanceValue = abi.decode(json.parseRaw(".stableToken.initialBalance"), (uint256));
    
    
    address[] memory initialBalanceAddresses = new address[](1);
    initialBalanceAddresses[0] = deployerAccount;
    // initialBalanceAddresses.push(deployerAccount);
    uint256[] memory initialBalanceValuees = new uint256[](1);
    initialBalanceValuees[0] = initialBalanceValue;
    // initialBalanceValuees.push(initialBalanceValue);
    
    string memory exchangeIdentifier = "Exchange";

    address stableTokenProxyAddress = deployProxiedContract(
      "StableToken",
      abi.encodeWithSelector(IStableTokenInitialize.initialize.selector, name, symbol, decimals, registryAddress, inflationRate, inflationFactorUpdatePeriod, initialBalanceAddresses, initialBalanceValuees, exchangeIdentifier));
  
    bool frozen = abi.decode(json.parseRaw(".stableToken.frozen"), (bool));
    if (frozen){
      getFreezer().freeze(stableTokenProxyAddress);
    }

    // TODO add more configurable oracles from the json
    // getSortedOracles();
    // console.log("this worked");
    getSortedOracles().addOracle(stableTokenProxyAddress, deployerAccount);

    uint256 celoPrice = abi.decode(json.parseRaw(".stableToken.celoPrice"), (uint256));
    if (celoPrice != 0 ) {
      console.log("before report");
      getSortedOracles().report(stableTokenProxyAddress, celoPrice * 1e24, address(0), address(0)); // TODO use fixidity
      console.log("After report report");
    }

    IReserve(registry.getAddressForStringOrDie("Reserve")).addToken(stableTokenProxyAddress);

    getFeeCurrencyWhitelist().addToken(stableTokenProxyAddress);

  }

  function migrateExchange(string memory json) public {
  
    string memory stableTokenIdentifier = "StableToken";
    uint256 spread = abi.decode(json.parseRaw(".exchange.spread"), (uint256));
    uint256 reserveFraction = abi.decode(json.parseRaw(".exchange.reserveFraction"), (uint256));
    uint256 updateFrequency = abi.decode(json.parseRaw(".exchange.updateFrequency"), (uint256));
    uint256 minimumReports = abi.decode(json.parseRaw(".exchange.minimumReports"), (uint256));
  

    address exchangeProxyAddress = deployProxiedContract(
      "Exchange",
      abi.encodeWithSelector(IExchangeInitializer.initialize.selector, registryAddress, stableTokenIdentifier, spread, reserveFraction, updateFrequency, minimumReports));

    bool frozen = abi.decode(json.parseRaw(".exchange.frozen"), (bool));
    if (frozen){
      getFreezer().freeze(exchangeProxyAddress);
    }

    IExchange(exchangeProxyAddress).activateStable();
  }

  function migrateAccount() public {

    address accountsProxyAddress = deployProxiedContract(
      "Accounts",
      abi.encodeWithSelector(IAccountsInitializer.initialize.selector, registryAddress));

    IAccounts(accountsProxyAddress).setEip712DomainSeparator();
  }

  function migrateLockedGold(string memory json) public {
   
    uint256 unlockingPeriod = abi.decode(json.parseRaw(".lockedGold.unlockingPeriod"), (uint256));

    deployProxiedContract(
      "LockedGold",
      abi.encodeWithSelector(ILockedGoldInitializer.initialize.selector, registryAddress, unlockingPeriod));

  }

  function migrateValidators(string memory json) public {
    uint256 groupRequirementValue = abi.decode(json.parseRaw(".validators.groupLockedGoldRequirements.value"), (uint256));
    uint256 groupRequirementDuration = abi.decode(json.parseRaw(".validators.groupLockedGoldRequirements.duration"), (uint256));
    uint256 validatorRequirementValue = abi.decode(json.parseRaw(".validators.validatorLockedGoldRequirements.value"), (uint256));
    uint256 validatorRequirementDuration = abi.decode(json.parseRaw(".validators.validatorLockedGoldRequirements.duration"), (uint256));
    uint256 validatorScoreExponent = abi.decode(json.parseRaw(".validators.validatorScoreParameters.exponent"), (uint256));
    uint256 validatorScoreAdjustmentSpeed = abi.decode(json.parseRaw(".validators.validatorScoreParameters.adjustmentSpeed"), (uint256));
    uint256 membershipHistoryLength = abi.decode(json.parseRaw(".validators.membershipHistoryLength"), (uint256));
    uint256 slashingMultiplierResetPeriod = abi.decode(json.parseRaw(".validators.slashingMultiplierResetPeriod"), (uint256));
    uint256 maxGroupSize = abi.decode(json.parseRaw(".validators.maxGroupSize"), (uint256));
    uint256 commissionUpdateDelay = abi.decode(json.parseRaw(".validators.commissionUpdateDelay"), (uint256));
    uint256 downtimeGracePeriod = abi.decode(json.parseRaw(".validators.downtimeGracePeriod"), (uint256));

    // revert("Must revert");

    deployProxiedContract(
      "Validators",
      abi.encodeWithSelector(IValidatorsInitializer.initialize.selector, registryAddress, groupRequirementValue,
          groupRequirementDuration,
          validatorRequirementValue,
          validatorRequirementDuration,
          validatorScoreExponent,
          validatorScoreAdjustmentSpeed,
          membershipHistoryLength,
          slashingMultiplierResetPeriod,
          maxGroupSize,
          commissionUpdateDelay,
          downtimeGracePeriod));
  }

  function migrateElection(string memory json) public{
    uint256 minElectableValidators = abi.decode(json.parseRaw(".election.minElectableValidators"), (uint256));
    uint256 maxElectableValidators = abi.decode(json.parseRaw(".election.maxElectableValidators"), (uint256));
    uint256 maxNumGroupsVotedFor = abi.decode(json.parseRaw(".election.maxNumGroupsVotedFor"), (uint256));
    uint256 electabilityThreshold = abi.decode(json.parseRaw(".election.electabilityThreshold"), (uint256));

    deployProxiedContract(
      "Election",
      abi.encodeWithSelector(IElectionInitializer.initialize.selector, registryAddress, minElectableValidators, maxElectableValidators, maxNumGroupsVotedFor, electabilityThreshold));
  }

  function migrateEpochRewards(string memory json) public {

    uint256 targetVotingYieldInitial = abi.decode(json.parseRaw(".epochRewards.targetVotingYieldParameters.initial"), (uint256));
    uint256 targetVotingYieldMax = abi.decode(json.parseRaw(".epochRewards.targetVotingYieldParameters.max"), (uint256));
    uint256 targetVotingYieldAdjustmentFactor = abi.decode(json.parseRaw(".epochRewards.targetVotingYieldParameters.adjustmentFactor"), (uint256));
    uint256 rewardsMultiplierMax = abi.decode(json.parseRaw(".epochRewards.rewardsMultiplierParameters.max"), (uint256));
    uint256 rewardsMultiplierUnderspendAdjustmentFactor = abi.decode(json.parseRaw(".epochRewards.rewardsMultiplierParameters.adjustmentFactors.underspend"), (uint256));
    uint256 rewardsMultiplierOverspendAdjustmentFactor = abi.decode(json.parseRaw(".epochRewards.rewardsMultiplierParameters.adjustmentFactors.overspend"), (uint256));
    uint256 targetVotingGoldFraction = abi.decode(json.parseRaw(".epochRewards.targetVotingGoldFraction"), (uint256));
    uint256 targetValidatorEpochPayment = abi.decode(json.parseRaw(".epochRewards.maxValidatorEpochPayment"), (uint256));
    uint256 communityRewardFraction = abi.decode(json.parseRaw(".epochRewards.communityRewardFraction"), (uint256));
    address carbonOffsettingPartner = abi.decode(json.parseRaw(".epochRewards.carbonOffsettingPartner"), (address));
    uint256 carbonOffsettingFraction = abi.decode(json.parseRaw(".epochRewards.carbonOffsettingFraction"), (uint256));

    address epochRewardsProxy = deployProxiedContract(
      "EpochRewards",
      abi.encodeWithSelector(IEpochRewardsInitializer.initialize.selector, registryAddress, targetVotingYieldInitial,
              targetVotingYieldMax,
              targetVotingYieldAdjustmentFactor,
              rewardsMultiplierMax,
              rewardsMultiplierUnderspendAdjustmentFactor,
              rewardsMultiplierOverspendAdjustmentFactor,
              targetVotingGoldFraction,
              targetValidatorEpochPayment,
              communityRewardFraction,
              carbonOffsettingPartner,
              carbonOffsettingFraction));

    bool frozen = abi.decode(json.parseRaw(".epochRewards.frozen"), (bool));
  
    if (frozen){
      getFreezer().freeze(epochRewardsProxy);
    }
  }

  function migrateRandom(string memory json) public {

    uint256 randomnessBlockRetentionWindow = abi.decode(json.parseRaw(".random.randomnessBlockRetentionWindow"), (uint256));

    deployProxiedContract(
      "Random",
      abi.encodeWithSelector(IRandomInitializer.initialize.selector, randomnessBlockRetentionWindow));
  }

  function migrateEscrow() public {

    deployProxiedContract(
      "Escrow",
      abi.encodeWithSelector(IEscrowInitializer.initialize.selector));
  }

  function migrateBlockchainParameters(string memory json) public {
    uint256 gasForNonGoldCurrencies = abi.decode(json.parseRaw(".blockchainParameters.gasForNonGoldCurrencies"), (uint256));
    uint256 gasLimit = abi.decode(json.parseRaw(".blockchainParameters.gasLimit"), (uint256));
    uint256 lookbackWindow = abi.decode(json.parseRaw(".blockchainParameters.lookbackWindow"), (uint256));

    deployProxiedContract(
      "BlockchainParameters",
      abi.encodeWithSelector(IBlockchainParametersInitializer.initialize.selector, gasForNonGoldCurrencies, gasLimit, lookbackWindow));

    
  }

  function migrateGovernanceSlasher() public {
    deployProxiedContract(
      "GovernanceSlasher",
      abi.encodeWithSelector(IGovernanceSlasherInitializer.initialize.selector, registryAddress));

      getLockedGold().addSlasher("GovernanceSlasher");
  }

  function migrateDoubleSigningSlasher(string memory json) public {
    uint256 penalty = abi.decode(json.parseRaw(".doubleSigningSlasher.penalty"), (uint256));
    uint256 reward = abi.decode(json.parseRaw(".doubleSigningSlasher.reward"), (uint256));

    deployProxiedContract(
      "DoubleSigningSlasher",
      abi.encodeWithSelector(IDoubleSigningSlasherInitializer.initialize.selector, registryAddress, penalty, reward));

      getLockedGold().addSlasher("DoubleSigningSlasher");
  }

  function migrateDowntimeSlasher(string memory json) public {
    uint256 penalty = abi.decode(json.parseRaw(".downtimeSlasher.penalty"), (uint256));
    uint256 reward = abi.decode(json.parseRaw(".downtimeSlasher.reward"), (uint256));
    uint256 slashableDowntime = abi.decode(json.parseRaw(".downtimeSlasher.slashableDowntime"), (uint256));

    deployProxiedContract(
      "DowntimeSlasher",
      abi.encodeWithSelector(IDowntimeSlasherInitializer.initialize.selector, registryAddress, penalty, reward, slashableDowntime));

      getLockedGold().addSlasher("DowntimeSlasher");

  }

  function migrateGovernanceApproverMultiSig(string memory json) public {
    address[] memory owners = new address[](1);
    owners[0] = deployerAccount;

    uint256 required = abi.decode(json.parseRaw(".governanceApproverMultiSig.required"), (uint256));
    uint256 internalRequired = abi.decode(json.parseRaw(".governanceApproverMultiSig.internalRequired"), (uint256));

    // This adds the multisig to the registry, which is not a case in mainnet but it's useful to keep a reference
    // of the deployed contract
    deployProxiedContract(
      "GovernanceApproverMultiSig",
      abi.encodeWithSelector(IGovernanceApproverMultiSigInitializer.initialize.selector, owners, required, internalRequired));
  }

  function migrateFederatedAttestations() public {
    deployProxiedContract(
      "FederatedAttestations",
      abi.encodeWithSelector(IFederatedAttestationsInitializer.initialize.selector));

  }

  function migrateMentoFeeHandlerSeller() public{
    address[] memory tokenAddresses;
    uint256[] memory minimumReports;

    deployProxiedContract(
      "MentoFeeHandlerSeller",
      abi.encodeWithSelector(IFeeHandlerSellerInitializer.initialize.selector, registryAddress, tokenAddresses, minimumReports));
  }

  function migrateUniswapFeeHandlerSeller() public{
    address[] memory tokenAddresses;
    uint256[] memory minimumReports;

    deployProxiedContract(
      "UniswapFeeHandlerSeller",
      abi.encodeWithSelector(IFeeHandlerSellerInitializer.initialize.selector, registryAddress, tokenAddresses, minimumReports));
  }

  function migrateFeeHandler(string memory json) public {

    address newFeeBeneficiary = abi.decode(json.parseRaw(".feeHandler.beneficiary"), (address));
    uint256 newBurnFraction = abi.decode(json.parseRaw(".feeHandler.burnFraction"), (uint256));
    address[] memory tokens;
    address[] memory handlers;
    uint256[] memory newLimits;
    uint256[] memory newMaxSlippages ;


    address feeHandlerProxyAddress = deployProxiedContract(
      "FeeHandler",
      abi.encodeWithSelector(IFeeHandlerInitializer.initialize.selector, registryAddress, newFeeBeneficiary, newBurnFraction, tokens, handlers, newLimits, newMaxSlippages));

    IFeeHandler(feeHandlerProxyAddress).addToken(getStableToken(), address(getMentoFeeHandlerSeller()));
  }

  function migrateOdisPayments() public{
    deployProxiedContract(
      "OdisPayments",
      abi.encodeWithSelector(IOdisPaymentsInitializer.initialize.selector));
  }

  function migrateGovernance(string memory json) public {
    bool useApprover = abi.decode(json.parseRaw(".governanceApproverMultiSig.required"), (bool));

    address approver = useApprover? registry.getAddressForString("GovernanceApproverMultiSig"): deployerAccount;
    uint256 concurrentProposals = abi.decode(json.parseRaw(".governance.concurrentProposals"), (uint256));
    uint256 minDeposit = abi.decode(json.parseRaw(".governance.minDeposit"), (uint256));
    uint256 queueExpiry = abi.decode(json.parseRaw(".governance.queueExpiry"), (uint256));
    uint256 dequeueFrequency = abi.decode(json.parseRaw(".governance.dequeueFrequency"), (uint256));
    uint256 referendumStageDuration = abi.decode(json.parseRaw(".governance.referendumStageDuration"), (uint256));
    uint256 executionStageDuration = abi.decode(json.parseRaw(".governance.executionStageDuration"), (uint256));
    uint256 participationBaseline = abi.decode(json.parseRaw(".governance.participationBaseline"), (uint256));
    uint256 participationFloor = abi.decode(json.parseRaw(".governance.participationFloor"), (uint256));
    uint256 baselineUpdateFactor = abi.decode(json.parseRaw(".governance.baselineUpdateFactor"), (uint256));
    uint256 baselineQuorumFactor = abi.decode(json.parseRaw(".governance.baselineQuorumFactor"), (uint256));

    // // address governanceProxyAddress = deployProxiedContract(
    address governanceProxyAddress = deployProxiedContract(
      "Governance",
      abi.encodeWithSelector(IGovernanceInitializer.initialize.selector, registryAddress, approver,
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
      ));

    _setConstitution(governanceProxyAddress, json);
    _transferOwnerShipCoreContact(governanceProxyAddress, json);


  }

  function _transferOwnerShipCoreContact(address governanceAddress, string memory json) public {
    bool skipTransferOwnership = abi.decode(json.parseRaw(".governance.skipTransferOwnership"), (bool));
    if (!skipTransferOwnership){
      // TODO move this list somewhere else
      string[22] memory fixedStringArray = ['Accounts',
        // 'Attestations',
        // BlockchainParameters ownership transitioned to governance in a follow-up script.?
        'BlockchainParameters',
        'DoubleSigningSlasher',
        'DowntimeSlasher',
        'Election',
        'EpochRewards',
        'Escrow',
        'FederatedAttestations',
        'FeeCurrencyWhitelist',
        'Freezer',
        'FeeHandler',
        'GoldToken',
        'Governance',
        'GovernanceSlasher',
        'LockedGold',
        'OdisPayments',
        'Random',
        'Registry',
        'SortedOracles',
        'UniswapFeeHandlerSeller',
        'MentoFeeHandlerSeller',
        'Validators'
        ];

      for (uint256 i = 0; i < fixedStringArray.length; i++) {
        string memory contractToTransfer = fixedStringArray[i];
        console.log("Transfering ownership of: ", contractToTransfer);
        IProxy proxy = IProxy(registry.getAddressForStringOrDie(contractToTransfer));
        proxy._transferOwnership(governanceAddress);
      }
    }
  }


  function _setConstitution(address governanceAddress, string memory json) public {
    // if I set this function outside 
    bool skipSetConstitution = abi.decode(json.parseRaw(".governance.skipSetConstitution"), (bool));
    IGovernance governance = IGovernance(governanceAddress);
    string memory constitutionJson = vm.readFile("./governanceConstitution.json");
    string[] memory contractsKeys = vm.parseJsonKeys(constitutionJson, "$");

    if (!skipSetConstitution){
      for (uint256 i = 0; i < contractsKeys.length; i++) {
        // TODO need to handle the special case for "proxy"
        string memory contractName = contractsKeys[i];
        
        // TODO make helper function for string comparison
        if (keccak256(abi.encodePacked(contractName)) == keccak256(abi.encodePacked("proxy"))){
          continue;
        }

        console.log(string.concat("Setting constitution thresholds for: ", contractName));
        IRegistry registry = IRegistry(registryAddress);
        
        address contractAddress = registry.getAddressForString(contractName);

        string[] memory functionNames = vm.parseJsonKeys(constitutionJson, string.concat(".", contractName));
        for (uint256 j = 0; j < functionNames.length; j++) {
          string memory functionName = functionNames[j];
          console.log(string.concat("  Setting constitution thresholds for function : ", functionName));
          bytes4 functionHash = bytes4(keccak256(bytes(functionName)));
          uint256 threshold = abi.decode(constitutionJson.parseRaw(string.concat(".", contractName, ".", functionName)), (uint256));

          if (contractAddress != address(0)){
            // TODO fix this case
            governance.setConstitution(contractAddress, functionHash, threshold);

          }

        }
      }
    }
  }

  function lockGold(
    uint256 value
    // string memory privateKey
    ) public {
      
      // lock just one
      getAccounts().createAccount();
      getLockedGold().lock{value:value}();


    }

  function registerValidator(
      uint256 validatorIndex,
      address validatorKey,
      uint256 amountToLock
    ) public {
      vm.startBroadcast(validatorKey);
      lockGold(amountToLock);
      // TODO convert validatorIndex to string and make it a name
      // getAccounts().setName(groupName);
      // potentially create a precompile that validates everything for the proofs of posession
      // getValidators().registerValidator(commission);
      vm.stopBroadcast();

  }

  function getValidatorKeyFromGroupGroup(address[] memory keys, uint256 groupIndex, uint256 validatorIndex, uint256 membersInAGroup) public returns(address) {
    return keys[groupIndex*membersInAGroup + validatorIndex + 1];
  }

  function registerValidatorGroup(
      string memory groupName,
      address validator0Key,
      uint256 amountToLock,
      uint256 commission
    ) public {
      vm.startBroadcast(validator0Key);
      lockGold(amountToLock);
      getAccounts().setName(groupName);
      getValidators().registerValidatorGroup(commission);
      vm.stopBroadcast();
    }

  function electValidators(string memory json) public {
    console.log("Electing validators: ");

    uint256 commission = abi.decode(json.parseRaw(".validators.commission"), (uint256));
    uint256 votesRatioOfLastVsFirstGroup = abi.decode(json.parseRaw(".validators.votesRatioOfLastVsFirstGroup"), (uint256));
    string memory groupName = abi.decode(json.parseRaw(".validators.groupName"), (string));
    uint256 minElectableValidators = abi.decode(json.parseRaw(".election.minElectableValidators"), (uint256));
    address[] memory valKeys = abi.decode(json.parseRaw(".validators.valKeys"), (address[]));
    uint256 maxGroupSize = abi.decode(json.parseRaw(".validators.maxGroupSize"), (uint256));
    uint256 validatorLockedGoldRequirements = abi.decode(json.parseRaw(".validators.validatorLockedGoldRequirements.value"), (uint256));
    uint256 lockedGoldPerValAtFirstGroup = abi.decode(json.parseRaw(".validators.groupLockedGoldRequirements"), (uint256));

    // attestationKeys not migrated

    if (valKeys.length == 0) {
      console.log('  No validators to register');
      // return;
    }

    if (valKeys.length < minElectableValidators) {
      console.log(
        "Warning: Have ${valKeys.length} Validator keys but require a minimum of ${config.election.minElectableValidators} Validators in order for a new validator set to be elected."
      );
    }

    address validator0Key = valKeys[0];

    if (votesRatioOfLastVsFirstGroup < 1) {
      revert("votesRatioOfLastVsFirstGroup needs to be >= 1");
    }

    // Assumptions about where funds are located:
    // * Validator 0 holds funds for all groups' stakes
    // * Validator 1-n holds funds needed for their own stake
    // const validator0Key = valKeys[0]

    // REPLACED WITH getValidatorGroup
    // Split the validator keys into groups that will fit within the max group size.
    uint256 amountOfGroups = valKeys.length / maxGroupSize;
    // string[][] memory  valKeyGroups;
    // for (uint256 i = 0; i < valKeys.length; i += maxGroupSize) {
    //   string[] memory validatorKeysfForGroup;
    //   valKeyGroups.push(validatorKeysfForGroup);
    //   // for (uint256 j = i+1; j <= maxGroupSize; i++) {
    //   //   valKeyGroups[i].push(valKeys[i]);
    //   // }
    // }

    // uint256 lockedGoldPerValEachGroup = ((votesRatioOfLastVsFirstGroup - 1)*lockedGoldPerValAtFirstGroup)/Math.max(amountOfGroups, 1);

    registerValidatorGroup(
      groupName,
      validator0Key,
      // TODO change to group
      maxGroupSize*validatorLockedGoldRequirements,
      commission
    );

    console.log("  * Registering ${group.valKeys.length} validators ...");

    for (uint256 validatorIndex = 0; validatorIndex < amountOfGroups; validatorIndex++){
      registerValidator(validatorIndex, getValidatorKeyFromGroupGroup(valKeys, 0, validatorIndex, maxGroupSize), validatorLockedGoldRequirements);
    }
    


    
  }

}


