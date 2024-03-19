pragma solidity >=0.8.7 <0.8.20;
// pragma solidity ^0.5.13;
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
import "@celo-contracts/common/interfaces/ICeloToken.sol";
import "@celo-contracts/stability/interfaces/ISortedOracles.sol";
import "@celo-contracts-8/common/interfaces/IGasPriceMinimumInitializer.sol";
import "./HelperInterFaces.sol";


import "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";


// import { SortedOracles } from "@celo-contract/stability/SortedOracles.sol";

// import "./SortedOracles.sol";



// Using Registry
contract Migration is Script {
  using stdJson for string;

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
  }

  function deployProxiedContract(string memory contractName, bytes memory initializeCalldata)
    public
  {
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
    address proxyAddress = proxyFactory.deployProxy();

    proxyNonce++; // nonce to avoid having the same address to deploy to// likely

    IProxy proxy = IProxy(proxyAddress);
    console.log(" Proxy deployed to:", address(proxy));

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
  }

  function run() external {
    // it's anvil key
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
    setImplementationOnProxy(IProxy(registryAddress), "Registry", abi.encodeWithSelector(IRegistry.initialize.selector));

    // TODO migrate the initializations
    deployProxiedContract("Freezer", abi.encodeWithSelector(IFreezer.initialize.selector));
    deployProxiedContract("FeeCurrencyWhitelist", abi.encodeWithSelector(IFeeCurrencyWhitelist.initialize.selector));
    deployProxiedContract(
      "GoldToken",
      abi.encodeWithSelector(ICeloToken.initialize.selector, registryAddress));
    
    uint256 reportExpirySeconds = 300;
    
    deployProxiedContract(
      "SortedOracles",
      abi.encodeWithSelector(ISortedOracles.initialize.selector, reportExpirySeconds));


    uint256 gasPriceMinimumFloor = abi.decode(json.parseRaw(".gasPriceMinimum.minimumFloor"), (uint256));
    uint256 targetDensity = abi.decode(json.parseRaw(".gasPriceMinimum.targetDensity"), (uint256));
    uint256 adjustmentSpeed = abi.decode(json.parseRaw(".gasPriceMinimum.adjustmentSpeed"), (uint256));
    uint256 baseFeeOpCodeActivationBlock = abi.decode(json.parseRaw(".gasPriceMinimum.baseFeeOpCodeActivationBlock"), (uint256));

    deployProxiedContract(
      "GasPriceMinimum",
      abi.encodeWithSelector(IGasPriceMinimumInitializer.initialize.selector, registryAddress, gasPriceMinimumFloor, targetDensity, adjustmentSpeed, baseFeeOpCodeActivationBlock));

    migrateReserve(json);



    // // // little sanity check, remove later
    // IRegistry registry = IRegistry(registryAddress);
    // registry.setAddressFor("registry", address(1));
    // console.log("print:");
    // console.logAddress(registry.getAddressForStringOrDie("registry"));

    vm.stopBroadcast();
  }

  function migrateReserve(string memory json) public {

    // Reserve spend multisig not migrates

    uint256 tobinTaxStalenessThreshold = abi.decode(json.parseRaw(".reserve.tobinTaxStalenessThreshold"), (uint256));
    uint256 spendingRatio = abi.decode(json.parseRaw(".reserve.spendingRatio"), (uint256));
    uint256 frozenGold = abi.decode(json.parseRaw(".reserve.frozenGold"), (uint256));
    uint256 frozenDays = abi.decode(json.parseRaw(".reserve.frozenDays"), (uint256));
    bytes32[] memory assetAllocationSymbols = abi.decode(json.parseRaw(".reserve.assetAllocationSymbols"), (bytes32[]));
    bytes32[] memory assetAllocationSymbolBytes;
    
    for (uint8 i=0; i<assetAllocationSymbols.length; i++){
      // bytes32 result;
      // string memory tempString = assetAllocationSymbols[i];
      // tempString.
      
      // assembly {
      //   result := mload(add(tempString, 32))
      // }
      // console.log(assetAllocationSymbols[i]);
      // assetAllocationSymbolBytes[i] = bytes32(bytes(assetAllocationSymbols[i]));
    }

    uint256[] memory assetAllocationWeights = abi.decode(json.parseRaw(".reserve.assetAllocationWeights"), (uint256[]));
    uint256 tobinTax = abi.decode(json.parseRaw(".reserve.tobinTax"), (uint256));
    uint256 tobinTaxReserveRatio = abi.decode(json.parseRaw(".reserve.tobinTaxReserveRatio"), (uint256));

    // string memory converted = string(abi.encodePacked(assetAllocationSymbols[0]));
    // console.log(assetAllocationSymbols[0]);
    
    deployProxiedContract(
      "Reserve",
      abi.encodeWithSelector(IReserveInitializer.initialize.selector, registryAddress, tobinTaxStalenessThreshold, spendingRatio, frozenGold, frozenDays, assetAllocationSymbols, assetAllocationWeights, tobinTax, tobinTaxReserveRatio));

    // with the reserve we migrate:
    // spender, wont do
    // otherReserveAddress, wont do
    // send initialBalance to Reserve
    // reserve.setFrozenGold, don't know
  }
}
