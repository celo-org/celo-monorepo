pragma solidity ^0.5.13;
// pragma solidity >=0.8.7 <0.8.20;
// Can be moved to 0.8 if I use the interfaces? Need to do for Proxy

import "forge-std/Script.sol";

import "@celo-contracts/common/interfaces/IProxy.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";

// import "@openzeppelin/contracts8/utils/Create2.sol";
// import "@celo-contracts/common/Create2.sol";
import "@celo-contracts/common/Proxy.sol";

import "forge-std/console.sol";

// Using Registry
contract Migration is Script {
  uint256 proxyNonce = 0;
  address payable constant registryAddress = 0x000000000000000000000000000000000000ce10;

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
  function deployCodeTo(string memory what, bytes memory args, uint256 value, address where)
    internal
  {
    bytes memory creationCode = vm.getCode(what);
    vm.etch(where, abi.encodePacked(creationCode, args));
    (bool success, bytes memory runtimeBytecode) = where.call.value(value)("");
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
    address payable toProxy,
    bytes memory initializeCalldata
  ) public {
    console.log("Deploying: ", contractName);
    deployCodeTo("Proxy.sol", abi.encode(false), toProxy);
    Proxy proxy = Proxy(toProxy);
    console.log(" Proxy deployed to:", toProxy);

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
  }

  function setImplementationOnProxy(
    Proxy proxy,
    string memory contractName,
    bytes memory initializeCalldata
  ) public {
    // bytes memory implementationBytecode = vm.getCode(string.concat(contractName, ".sol"));
    console.log("msg.sender", msg.sender);
    console.log("address(this)", address(this));
    // console.log("address(Create2)", address(Create2));
    console.log("owner of proxy is:", proxy._getOwner());
    bytes memory implementationBytecode = vm.getCode(contractName);
    bool testingDeployment = false;
    bytes memory initialCode = abi.encodePacked(
      implementationBytecode,
      abi.encode(testingDeployment)
    );

    address implementation = create2deploy(0, initialCode);
    console.log(" Implementation deployed to:", address(implementation));
    // vm.prank(proxy._getOwner());
    proxy._setAndInitializeImplementation(implementation, initializeCalldata);
  }

  function deployProxiedContract(string memory contractName, bytes memory initializeCalldata)
    public
    returns (uint256)
  {
    console.log("Deploying: ", contractName);

    // Proxy proxy = new Proxy();
    // estoy no anda porque el owner queda malo, porque?
    // address payable proxyAddress = address(uint160(create2deploy(bytes32(proxyNonce), vm.getCode("Proxy.sol"))));

    address payable proxyAddress = address(
      (uint256(sha256(abi.encode(vm.getCode("Proxy.sol"), proxyNonce))))
    );
    deployCodeTo("Proxy.sol", abi.encode(false), proxyAddress);
    proxyNonce++;
    Proxy proxy = Proxy(proxyAddress);
    // IProxy proxy = IProxy(proxyAddress);
    console.log(" Proxy deployed to:", address(proxy));

    setImplementationOnProxy(proxy, contractName, initializeCalldata);
    addToRegistry(contractName, address(proxy));
  }

  // function deployProxiedContract() public {
  //   address payable registryAddress = 0x000000000000000000000000000000000000ce10;
  //   deployCodeTo("Proxy.sol", abi.encode(false), registryAddress);
  //   Proxy proxy = Proxy(registryAddress);

  //   bytes memory implementationBytecode = vm.getCode("Registry.sol");
  //   // bytes memory implementationBytecode = type(Registry).creationCode;

  //   // TODO here can check that the contract is not already deployed
  //   bool testingDeployment = false;
  //   bytes memory initialCode = abi.encodePacked(implementationBytecode, abi.encode(testingDeployment));

  //   address implementation  = Create2.deploy("123", initialCode);

  //   // TODO make initialize general
  //   proxy._setAndInitializeImplementation(implementation, abi.encodeWithSignature("initialize()"));

  //   // play a bit with the registry

  // }

  function run() external {
    // it's anvil key
    vm.startBroadcast(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80);

    // TODO generalize the initialize
    deployProxiedContract("Registry.sol", registryAddress, abi.encodeWithSignature("initialize()"));
    deployProxiedContract("Freezer.sol", abi.encodeWithSignature("initialize()"));
    deployProxiedContract("FeeCurrencyWhitelist.sol", abi.encodeWithSignature("initialize()"));
    deployProxiedContract(
      "GoldToken.sol",
      abi.encodeWithSignature("initialize(address)", registryAddress)
    );

    // GoldToken()

    // little sanity check, remove
    IRegistry registry = IRegistry(registryAddress);
    registry.setAddressFor("registry", address(1));
    console.log("print:");
    console.logAddress(registry.getAddressForStringOrDie("registry"));

    vm.stopBroadcast();
  }
}
