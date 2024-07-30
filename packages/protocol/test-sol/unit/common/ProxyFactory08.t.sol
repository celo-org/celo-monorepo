pragma solidity ^0.8.15;

import "celo-foundry-8/Test.sol";
import "@celo-contracts-8/common/ProxyFactory08.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";

import { Utils08 } from "@test-sol/utils08.sol";

contract ProxyFactoryTest is Test, Utils08 {
  ProxyFactory08 proxyFactory08;
  bytes proxyInitCode;
  address constant owner = address(0xAA963FC97281d9632d96700aB62A4D1340F9a28a);

  function setUp() public {
    proxyFactory08 = new ProxyFactory08();
    proxyInitCode = vm.getCode("Proxy.sol");
  }

  function test_deployProxy() public {
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);

    IProxy proxy = IProxy(deployedAddress);

    assertEq(proxy._getOwner(), owner);
  }

  function test_Reverts_WhenDeployingWithSameSenderAddressAndBytecode() public {
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
    vm.expectRevert("Create2: Failed on deploy");
    proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
  }

  function test_deploysWithDifferentSalts() public {
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
    address deployedAddress2 = proxyFactory08.deployArbitraryByteCode(0, owner, 1, proxyInitCode);

    assertFalse(deployedAddress == deployedAddress2);
  }

  function test_verifyArtifacts() public {
    string memory compiler = "0.5.17+commit.d19bba13";

    checkbytecode(compiler, proxyInitCode, "./artifacts/Proxy/proxyInitCode");

    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyInitCode);
    checkbytecode(compiler, deployedAddress.code, "./artifacts/Proxy/proxyBytecode");
  }

  function checkbytecode(
    string memory compiler,
    bytes memory bytecode,
    string memory artifactPath
  ) public {
    string memory bytecodeBackUp = vm.readFile(string.concat(artifactPath, compiler, ".hex"));
    assert(compareStrings(bytecodeBackUp, vm.toString(bytecode)));
  }
}
