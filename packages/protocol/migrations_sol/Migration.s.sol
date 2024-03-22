pragma solidity >=0.8.7 <0.8.20;
// Can be moved to 0.8 if I use the interfaces? Need to do for Proxy
// TODO proxy should have getOwner as external

// Note: This scrip should not include any cheatcode so that it can run in production

import "forge-std/Script.sol";
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

import "@celo-contracts/identity/interfaces/IRandomInitializer.sol";
import "@celo-contracts/identity/interfaces/IEscrowInitializer.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import "@celo-contracts-8/common/interfaces/IGasPriceMinimumInitializer.sol";
import "./HelperInterFaces.sol";

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
    bytes memory implementationBytecode = vm.getCode(string.concat(contractName, ".sol"));
    bool testingDeployment = false;
    bytes memory initialCode = abi.encodePacked(
      implementationBytecode,
      abi.encode(testingDeployment)
    );

    address implementation = create2deploy(0, initialCode);
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

    proxyNonce++; // nonce to avoid having the same address to deploy to// likely

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

    proxyFactory = IProxyFactory(create2deploy(0, vm.getCode("ProxyFactory.sol")));

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
    migrateValidators(json);
    migrateElection(json);
    migrateEpochRewards(json);
    migrateRandom(json);
    migrateEscrow();
    // attestations not migrates
    migrateBlockchainParameters(json);
    // migrateGovernanceSlasher();
    // migrateDoubleSigningSlasher();
    // migrateDowntimeSlasher();
    // migrateGovernanceApproverMultiSig();
    // GrandaMento not migrated
    // migrateFederatedAttestations();
    // migrateMentoFeeHandlerSeller();
    // migrateUniswapFeeHandlerSeller();
    // migrateFeeHandler();
    // migrateOdisPayments();
    // migrateGovernance();
    // electValidators();

    // // // little sanity check, remove later
    // IRegistry registry = IRegistry(registryAddress);
    // registry.setAddressFor("registry", address(1));
    // console.log("print:");
    // console.logAddress(registry.getAddressForStringOrDie("registry"));

    vm.stopBroadcast();
  }

  function migrateRegistry() public {
    setImplementationOnProxy(IProxy(registryAddress), "Registry", abi.encodeWithSelector(IRegistry.initialize.selector));
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
    getSortedOracles();
    console.log("this worked");
    getSortedOracles().addOracle(stableTokenProxyAddress, deployerAccount);

    uint256 celoPrice = abi.decode(json.parseRaw(".stableToken.celoPrice"), (uint256));
    if (celoPrice != 0 ) {
      getSortedOracles().report(stableTokenProxyAddress, celoPrice * 1e24, address(0), address(0)); // TODO use fixidity
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

    // new EpochSizePrecompile();
    console.log("lookbackWindow", lookbackWindow);

    // console.log("(new EpochSizePrecompile()).getAddress()", (new EpochSizePrecompile()).getAddress());

    deployProxiedContract(
      "BlockchainParameters",
      abi.encodeWithSelector(IBlockchainParametersInitializer.initialize.selector, gasForNonGoldCurrencies, gasLimit, lookbackWindow));

    
  }

  function migrateGovernanceSlasher() public{
  //   deployProxiedContract(
  //     "GovernanceSlasher",
  //     abi.encodeWithSelector(IGovernanceSlasherInitializer.initialize.selector, registryAddress));
  }

  function migrateDoubleSigningSlasher() public{

  }

  function migrateDowntimeSlasher() public{

  }

  function migrateGovernanceApproverMultiSig() public{

  }

  function migrateFederatedAttestations() public{

  }

  function migrateMentoFeeHandlerSeller() public{

  }

  function migrateUniswapFeeHandlerSeller() public{

  }

  function migrateFeeHandler() public{

  }

  function migrateOdisPayments() public{

  }

  function migrateGovernance() public{

  }

  function electValidators() public{

  }
}


