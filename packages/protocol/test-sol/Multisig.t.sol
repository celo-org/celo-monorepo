// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "forge-std/console.sol";
import "../contracts/common/MultiSig.sol";

contract MultiSigTest is Test {
  function() external payable {}

  MultiSig public multiSig;
  uint256 ONE_GOLDTOKEN = 1000000000000000000;
  address owner0;
  address owner1;
  address sender;
  uint256 requiredSignatures = 2;
  uint256 internalRequiredSignatures = 2;
  address[] public owners;

  // event Transfer(address indexed from, address indexed to, uint256 value);
  event Confirmation(address indexed sender, uint256 indexed transactionId);
  event Revocation(address indexed sender, uint256 indexed transactionId);
  event Submission(uint256 indexed transactionId);
  event Execution(uint256 indexed transactionId, bytes returnData);
  event Deposit(address indexed sender, uint256 value);
  event OwnerAddition(address indexed owner);
  event OwnerRemoval(address indexed owner);
  event RequirementChange(uint256 required);
  event InternalRequirementChange(uint256 internalRequired);

  function setUp() public {
    multiSig = new MultiSig(true);
    owner0 = actor("owner0");
    owner1 = actor("owner1");
    sender = actor("sender");
    vm.deal(sender, 10 ether);
    owners = [owner0, owner1];

    multiSig.initialize(owners, requiredSignatures, internalRequiredSignatures);
  }
}

contract MultiSigInitialize is MultiSigTest {
  function setUp() public {
    super.setUp();
  }

  function test_shouldHaveSetTheOwners() public {
    assertEq(multiSig.getOwners(), owners);
  }

  function test_shouldHaveSetTheNumberOfRequiredSignaturesForExternalTransactions() public {
    assertEq(uint256(multiSig.required()), 2);
  }

  function test_shouldHaveSetTheNumberOfRequiredSignaturesForInternalTransactions() public {
    assertEq(uint256(multiSig.internalRequired()), 2);
  }

  function test_shouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    multiSig.initialize(owners, requiredSignatures, internalRequiredSignatures);
  }
}

contract MultiSigFallbackFunction is MultiSigTest {
  uint256 amount = 100;

  function setUp() public {
    super.setUp();
  }

  function uncheckedSendViaCall(address payable _to, uint256 _amount) public payable {
    _to.call.value(_amount)("");
  }

  function uncheckedSendViaCallData(address payable _to, uint256 _amount) public payable {
    _to.call.value(_amount)("ok");
  }

  function test_emitsDepositEventWithCorrectParametersWhenReceivingCelo() public payable {
    vm.prank(sender);
    vm.expectEmit(true, false, false, false);
    emit Deposit(sender, amount);
    uncheckedSendViaCall(address(multiSig), amount);
  }

  function test_doesNotEmitEventWhenReceiving0Value() public {
    vm.prank(sender);
    // TODO: use vm.recordLogs
    // vm.expectEmit(false, false, false, false);
    // emit Deposit(sender, 0);
    // /
    uncheckedSendViaCallData(address(multiSig), 0);
  }
}

contract MultiSigSubmitTransaction is MultiSigTest {
  address owner2;

  function setUp() public {
    super.setUp();

    owner2 = actor("owner2");
  }

  function test_shouldAllowAnOwnerToSubmitATransaction() public {
    vm.prank(owner0);

    vm.expectEmit(true, true, true, true);

    emit Confirmation(owner0, 0);

    multiSig.submitTransaction(
      address(multiSig),
      0,
      abi.encodeWithSignature("addOwner(address)", owner2)
    );
  }

  function test_shouldNotAllowAnOwnerToSubmitATransactionToANullAddress() public {}

  function test_shouldNotAllowANon_ownerToSubmitATransaction() public {}
}
