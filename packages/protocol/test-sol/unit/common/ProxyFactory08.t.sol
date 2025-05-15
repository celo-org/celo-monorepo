pragma solidity ^0.8.15;

import { ProxyFactory08 } from "@celo-contracts-8/common/ProxyFactory08.sol";
import { StringUtils } from "@celo-contracts/common/libraries/StringUtils.sol";
import { IProxy } from "@celo-contracts/common/interfaces/IProxy.sol";

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

contract ProxyFactoryTest is TestWithUtils08 {
  using StringUtils for string;

  ProxyFactory08 proxyFactory08;
  bytes proxyInitCode;
  address constant owner = address(0xAA963FC97281d9632d96700aB62A4D1340F9a28a);

  function setUp() public override {
    super.setUp();
    proxyFactory08 = new ProxyFactory08();
    proxyInitCode = vm.getCode("Proxy.sol");
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
  ) public view {
    string memory bytecodeBackUp = vm.readFile(string.concat(artifactPath, compiler, ".hex"));
    string memory bytecodeString = vm.toString(bytecode);

    // Calculate the length of the bytecode to compare (ignoring the last 43 bytes for Swarm hash)
    uint compareLength = bytes(bytecodeBackUp).length - 86; // 43 bytes in hex is 86 characters

    // Slice the strings to exclude the Swarm hash
    string memory bytecodeBackUpToCompare = substring(bytecodeBackUp, 0, compareLength);
    string memory bytecodeToCompare = substring(bytecodeString, 0, compareLength);

    // Assert that the truncated bytecode matches
    assert(bytecodeBackUpToCompare.equals(bytecodeToCompare));
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
