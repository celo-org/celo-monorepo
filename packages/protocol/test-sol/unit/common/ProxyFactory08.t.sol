pragma solidity ^0.8.15;

// Celo imports
import { ProxyFactory08 } from "@celo-contracts-8/common/ProxyFactory08.sol";
import { IProxy } from "@celo-contracts/common/interfaces/IProxy.sol";

// Test imports
import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

contract ProxyFactoryTest is TestWithUtils08 {
  ProxyFactory08 proxyFactory08;
  bytes proxyInitCode;
  address constant owner = address(0xAA963FC97281d9632d96700aB62A4D1340F9a28a);

  function setUp() public override {
    super.setUp();
    proxyFactory08 = new ProxyFactory08();
    proxyInitCode = vm.getCode("artifacts/solc-0.5/Proxy.sol/Proxy.json");
  }

  function test_deployProxy() public {
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);

    IProxy proxy = IProxy(deployedAddress);

    assertEq(proxy._getOwner(), owner);
  }

  function test_Reverts_WhenDeployingWithSameSenderAddressAndBytecode() public {
    proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
    vm.expectRevert("Create2: Failed on deploy");
    proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
  }

  function test_deploysWithDifferentSalts() public {
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
    address deployedAddress2 = proxyFactory08.deployArbitraryByteCode(0, owner, 1, proxyInitCode);

    assertFalse(deployedAddress == deployedAddress2);
  }

  function test_deployedProxyMatchesFrozenArtifact() public {
    // The frozen artifact carries the runtime bytecode of the proxies deployed on mainnet;
    // a proxy created from its init code must have exactly that code.
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
    string memory artifact = vm.readFile("./artifacts/solc-0.5/Proxy.sol/Proxy.json");
    bytes memory frozenRuntime = vm.parseJsonBytes(artifact, ".deployedBytecode.object");
    assertEq(deployedAddress.code, frozenRuntime);
  }

  function substring(
    string memory str,
    uint startIndex,
    uint endIndex
  ) internal pure returns (string memory) {
    bytes memory strBytes = bytes(str);
    bytes memory result = new bytes(endIndex - startIndex);
    for (uint i = startIndex; i < endIndex; i++) {
      result[i - startIndex] = strBytes[i];
    }
    return string(result);
  }
}
