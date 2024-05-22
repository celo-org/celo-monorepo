// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/IdentityProxy.sol";
import "@celo-contracts/identity/IdentityProxyHub.sol";
import "@celo-contracts/identity/test/IdentityProxyTest.sol";
import "@celo-contracts/identity/test/MockAttestations.sol";
import "@celo-contracts/common/Registry.sol";

contract IdentityProxyHubTest is Test {
  IdentityProxy identityProxy;
  IdentityProxyTest identityProxyTest;
  IdentityProxyHub identityProxyHub;
  MockAttestations mockAttestations;
  Registry registry;

  address randomActor = actor("randomActor");

  bytes32 identifier =
    keccak256("0x00000000000000000000000000000000000000000000000000000000babecafe");

  function setUp() public {
    identityProxy = new IdentityProxy();
    identityProxyTest = new IdentityProxyTest();
    identityProxyHub = new IdentityProxyHub();
    mockAttestations = new MockAttestations();
    registry = new Registry(true);
    registry.initialize();
    registry.setAddressFor("Attestations", address(mockAttestations));
    identityProxyHub.setRegistry(address(registry));
  }

  function computeCreate2Address(
    bytes32 salt,
    address deployerAddress,
    bytes memory contractBytecode
  ) public pure returns (address) {
    bytes32 bytecodeHash = keccak256(contractBytecode);
    bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), deployerAddress, salt, bytecodeHash));

    return
      address(
        uint160(uint256(hash) & 0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
      );
  }

  /**
   * Returns bytecode at address
   * @param _addr The address to get the code from
   */
  function at(address _addr) public view returns (bytes memory o_code) {
    assembly {
      // retrieve the size of the code
      let size := extcodesize(_addr)
      // allocate output byte array
      // by using o_code = new bytes(size)
      o_code := mload(0x40)
      // new "memory end" including padding
      mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
      // store length in memory
      mstore(o_code, size)
      // actually retrieve the code, this needs assembly
      extcodecopy(_addr, add(o_code, 0x20), 0, size)
    }
  }
}

contract IdentityProxyTestGetIdenityProxy is IdentityProxyHubTest {
  function setUp() public {
    super.setUp();
  }

  function test_ReturnsTheCorrectCREATE2Address() public {
    bytes memory bytecode = type(IdentityProxy).creationCode;
    address expectedAddress = computeCreate2Address(
      identifier,
      address(identityProxyHub),
      bytecode
    );
    IdentityProxy identityProxyReturned = identityProxyHub.getOrDeployIdentityProxy(identifier);
    assertEq(expectedAddress, address(identityProxyReturned));
  }

  function test_ReturnsTheAddressOfAnIdentityProxy() public {
    IdentityProxy identityProxyReturned = identityProxyHub.getOrDeployIdentityProxy(identifier);
    identityProxyHub.getOrDeployIdentityProxy(identifier);

    bytes memory deployedCode = vm.getDeployedCode("IdentityProxy.sol:IdentityProxy");
    assertEq(deployedCode, at(address(identityProxyReturned)));
  }
}

contract IdentityProxyTestMakeCall_Failures is IdentityProxyHubTest {
  address identityProxyAddress;

  function setUp() public {
    super.setUp();
    identityProxyAddress = address(identityProxyHub.getOrDeployIdentityProxy(identifier));
  }

  function test_FailsToCallIfSenderDoesNotHaveAtLeast3AttestationCompletions() public {
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));

    bytes memory txData = abi.encodeWithSignature("callMe()");
    vm.expectRevert("does not pass identity heuristic");
    identityProxyHub.makeCall(identifier, address(identityProxyTest), txData);
  }

  function test_FailsToCallIfSenderDoesNotHaveMoreThan50PercentAttestationCompletions() public {
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));

    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));

    bytes memory txData = abi.encodeWithSignature("callMe()");
    vm.expectRevert("does not pass identity heuristic");
    identityProxyHub.makeCall(identifier, address(identityProxyTest), txData);
  }

  function test_FailsToCallIfAnotherAddressHasMoreAttestationsCompleted() public {
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));

    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));

    bytes memory txData = abi.encodeWithSignature("callMe()");
    vm.expectRevert("does not pass identity heuristic");
    identityProxyHub.makeCall(identifier, address(identityProxyTest), txData);
  }
}

contract IdentityProxyTestMakeCall_WhenCalledByContractRelatedToTheIdentifier is
  IdentityProxyHubTest
{
  address identityProxyAddress;

  function setUp() public {
    super.setUp();

    identityProxyAddress = address(identityProxyHub.getOrDeployIdentityProxy(identifier));

    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
  }

  function test_ForwardsCallToTheDestination() public {
    uint256 value = 42;
    identityProxyHub.makeCall(
      identifier,
      address(identityProxyTest),
      abi.encodeWithSignature("setX(uint256)", value)
    );

    assertEq(identityProxyTest.x(), value);
  }

  function test_ForwardsCallToEvenWhenCompletedRationIsCloseTo50Percent() public {
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));
    mockAttestations.request(identifier, 0, bytes32(0), bytes32(0));

    uint256 value = 42;
    identityProxyHub.makeCall(
      identifier,
      address(identityProxyTest),
      abi.encodeWithSignature("setX(uint256)", value)
    );

    assertEq(identityProxyTest.x(), value);
  }

  function test_ForwardsCallAsLongAsNoOtherAddressHasMoreCompletions() public {
    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    vm.prank(randomActor);
    mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));

    uint256 value = 42;
    identityProxyHub.makeCall(
      identifier,
      address(identityProxyTest),
      abi.encodeWithSignature("setX(uint256)", value)
    );

    assertEq(identityProxyTest.x(), value);
  }

  function test_ForwardsCallToProxyRelatedToIdentifier() public {
    uint256 value = 42;
    identityProxyHub.makeCall(
      identifier,
      address(identityProxyTest),
      abi.encodeWithSignature("callMe()", value)
    );

    assertEq(identityProxyTest.lastAddress(), identityProxyAddress);
  }

  function test_CanSendAPayment() public {
    uint256 balanceBefore = address(identityProxyTest).balance;
    identityProxyHub.makeCall.value(100)(
      identifier,
      address(identityProxyTest),
      abi.encodeWithSignature("payMe()")
    );

    uint256 proxyBalance = identityProxyAddress.balance;
    uint256 balanceAfter = address(identityProxyTest).balance;

    assertEq(balanceBefore, 0);
    assertEq(proxyBalance, 0);
    assertEq(balanceAfter, 100);
  }
}
