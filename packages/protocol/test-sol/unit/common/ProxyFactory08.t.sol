pragma solidity ^0.8.15;

import "celo-foundry-8/Test.sol";
import "@celo-contracts/common/ProxyFactory08.sol";
import "@celo-contracts/common/interfaces/IProxy.sol";
import "forge-std/console.sol";

contract Counter {}

contract ProxyFactoryTest is Test {
  ProxyFactory08 proxyFactory08;
  function setUp() public {
    proxyFactory08 = new ProxyFactory08();
  }

  function test_hello() public {
    bytes memory proxyBytecode = vm.getCode(
      string.concat("out/", "Proxy", ".sol/", "Proxy", ".json")
    );
    address owner = address(0xAA963FC97281d9632d96700aB62A4D1340F9a28a);
    address deployedAddress = proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyBytecode);

    IProxy proxy = IProxy(deployedAddress);
    console.log(proxy._getOwner());

    assertEq(proxy._getOwner(), owner);

    // should fail
    vm.expectRevert("Create2: Failed on deploy");
    proxyFactory08.deployArbitraryByteCode(0, owner, 0, proxyBytecode);
  }
}
