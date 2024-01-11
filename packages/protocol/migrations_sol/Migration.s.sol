pragma solidity >=0.8.7 <0.8.20;
// pragma solidity ^0.5.13;
// Can be moved to 0.8 if I use the interfaces? Need to do for Proxy
// TODO proxy should have getOwner as external

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "@celo-contracts/common/interfaces/IProxyFactory.sol";

import "@celo-contracts/common/interfaces/IProxy.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/interfaces/IFreezer.sol";
import "@celo-contracts/common/interfaces/IFeeCurrencyWhitelist.sol";
import "@celo-contracts/common/interfaces/ICeloToken.sol";



// Using Registry
contract Migration is Script {
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
    proxy._setAndInitializeImplementation(implementation, initializeCalldata);
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

    proxyNonce++; // nonce to avoid having the same address to deploy to

    IProxy proxy = IProxy(proxyAddress);
    console.log(" Proxy deployed to:", address(proxy));

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
  }

  function run() external {
    // it's anvil key
    vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

    proxyFactory = IProxyFactory(create2deploy(0, vm.getCode("ProxyFactory.sol")));

    // TODO in production the proxy of the registry is created using a cheatcode
    deployProxiedContract("Registry", registryAddress, abi.encodeWithSelector(IRegistry.initialize.selector));

    deployProxiedContract("Freezer", abi.encodeWithSelector(IFreezer.initialize.selector));
    deployProxiedContract("FeeCurrencyWhitelist", abi.encodeWithSelector(IFeeCurrencyWhitelist.initialize.selector));
    deployProxiedContract(
      "GoldToken",
      abi.encodeWithSelector(ICeloToken.initialize.selector, registryAddress));


    // little sanity check, remove later
    IRegistry registry = IRegistry(registryAddress);
    registry.setAddressFor("registry", address(1));
    console.log("print:");
    console.logAddress(registry.getAddressForStringOrDie("registry"));

    vm.stopBroadcast();
  }
}
