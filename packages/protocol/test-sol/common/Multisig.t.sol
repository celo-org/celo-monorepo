// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "../../contracts/common/MultiSig.sol";

contract MultiSigTest is Test {
  function() external payable {}

  MultiSig public multiSig;
  address owner0;
  address owner1;
  address newOwner;
  address nonOwner;
  address sender;
  uint256 requiredSignatures = 2;
  uint256 internalRequiredSignatures = 2;
  address[] public owners;
  bytes addOwnerTxData;

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
    newOwner = actor("newOwner");
    nonOwner = actor("nonOwner");
    vm.deal(sender, 10 ether);
    owners = [owner0, owner1];

    addOwnerTxData = abi.encodeWithSignature("addOwner(address)", newOwner);

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

  function test_revertsWhenCalledTwice() public {
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

  function test_emitsDepositEventWithCorrectParameters_whenReceivingCelo() public payable {
    vm.prank(sender);
    vm.expectEmit(true, false, false, false);
    emit Deposit(sender, amount);
    uncheckedSendViaCall(address(multiSig), amount);
  }

  // TODO: Implement after pragma ^0.8
  function SKIP_test_doesNotEmitEvent_whenReceivingZeroValue() public {
    vm.prank(sender);
    vm.recordLogs();
    uncheckedSendViaCall(address(multiSig), 0);
    // Vm.Log[] memory entries = vm.getRecordedLogs();
    // assertEq(entries.length, 0);
  }
}

contract MultiSigSubmitTransaction is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
  }

  function test_shouldAllowAnOwnerToSubmitATransaction() public {
    vm.prank(owner0);
    vm.expectEmit(true, true, true, true);
    emit Confirmation(owner0, txId);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);

    (address dest, uint256 val, bytes memory data, bool exec) = multiSig.transactions(txId);

    assertEq(dest, address(multiSig));
    assertEq(val, 0);
    assertEq(data, addOwnerTxData);
    assertEq(exec, false);
    assertEq(multiSig.confirmations(txId, owner0), true);
    assertEq(multiSig.transactionCount(), 1);
  }

  function test_shouldNotAllowAnOwnerToSubmitATransactionToANullAddress() public {
    vm.expectRevert("address was null");
    multiSig.submitTransaction(address(0), 0, addOwnerTxData);
  }

  function test_shouldNotAllowANonOwnerToSubmitATransaction() public {
    vm.expectRevert("owner does not exist");
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }
}

contract MultiSigConfirmTransaction is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_shouldAllowAnOwnerToConfirmTransaction() public {
    vm.prank(owner1);
    multiSig.confirmTransaction(txId);

    assertEq(multiSig.confirmations(txId, owner1), true);

    (, , , bool exec) = multiSig.transactions(txId);
    assertEq(exec, true);
  }

  function test_shouldNotAllowAnOwnerToConfirmATransactionTwice() public {
    vm.prank(owner0);
    vm.expectRevert("transaction was already confirmed for owner");
    multiSig.confirmTransaction(txId);
  }

  function test_shouldNotAllowANonOwnerToConfirmATransaction() public {
    vm.prank(nonOwner);
    vm.expectRevert("owner does not exist");
    multiSig.confirmTransaction(txId);
  }
}

contract MultiSigRevokeConfirmation is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_shouldAllowAnOwnerToRevokeConfirmation() public {
    vm.prank(owner0);
    multiSig.revokeConfirmation(txId);
    assertEq(multiSig.confirmations(txId, owner0), false);
  }

  function test_shouldNotAllowANonOwnerToRevokeConfirmation() public {
    vm.prank(nonOwner);
    vm.expectRevert("owner does not exist");
    multiSig.revokeConfirmation(txId);
  }

  function test_shouldNotAllowAnOwnerToRevokeBeforeConfirming() public {
    vm.prank(owner1);
    vm.expectRevert("transaction was not confirmed for owner");
    multiSig.revokeConfirmation(txId);
  }
}

contract MultiSigAddOwner is MultiSigTest {
  uint256 txId = 0;
  address[] public updatedOwners;

  function setUp() public {
    super.setUp();
    updatedOwners = [owner0, owner1, newOwner];
  }

  function test_shouldAllowNewOwnerToBeAddedViaMultiSig() public {
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
    vm.prank(owner1);
    multiSig.confirmTransaction(txId);
    assertEq(multiSig.isOwner(newOwner), true);

    assertEq(multiSig.getOwners(), updatedOwners);
  }

  function test_shouldNotAllowAnExternalAccountToAddAnOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.addOwner(newOwner);
  }

  function test_shouldNotAllowAddingTheNullAddress() public {
    bytes memory txData_null = abi.encodeWithSignature("addOwner(address)", address(0));
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_null);

    vm.prank(owner1);
    vm.expectRevert("Transaction execution failed.");
    multiSig.confirmTransaction(txId);
  }
}

contract MultiSigRemoveOwner is MultiSigTest {
  uint256 txId = 0;
  address[] public updatedOwners;

  function setUp() public {
    super.setUp();
    updatedOwners = [owner0];
  }

  function test_shouldAllowOwnerToBeRemovedViaMultiSig() public {
    bytes memory txData_remove = abi.encodeWithSignature("removeOwner(address)", owner1);
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_remove);

    vm.prank(owner1);
    multiSig.confirmTransaction(txId);

    assertEq(multiSig.isOwner(owner1), false);
    assertEq(multiSig.required(), 1);
    assertEq(multiSig.internalRequired(), 1);
    assertEq(multiSig.getOwners(), updatedOwners);
  }

  function test_shouldNotAllowAnExternalAccountToRemoveAnOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.removeOwner(newOwner);
  }
}

contract MultiSigReplaceOwner is MultiSigTest {
  uint256 txId = 0;
  address[] public updatedOwners;

  function setUp() public {
    super.setUp();
    updatedOwners = [owner0, newOwner];
  }

  function test_shouldAllowAnExistingOwnerToBeReplacedViaMultiSig() public {
    bytes memory txData_replace = abi.encodeWithSignature(
      "replaceOwner(address,address)",
      owner1,
      newOwner
    );
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_replace);

    vm.prank(owner1);
    multiSig.confirmTransaction(txId);

    assertEq(multiSig.isOwner(owner1), false);
    assertEq(multiSig.isOwner(newOwner), true);
    assertEq(multiSig.getOwners(), updatedOwners);
  }

  function test_shouldNotAllowAnExternalAccountToReplaceAnOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.replaceOwner(owner1, newOwner);
  }

  function test_shouldNotAllowAnOwnerToBeReplacedByNullAddress() public {
    bytes memory txData_replace = abi.encodeWithSignature(
      "replaceOwner(address,address)",
      owner1,
      address(0)
    );
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_replace);

    vm.prank(owner1);
    vm.expectRevert("Transaction execution failed.");
    multiSig.confirmTransaction(txId);
  }
}

contract MultiSigChangeRequirements is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
  }

  function test_shouldAllowTheRequirementToBeChangedViaMultiSig() public {
    bytes memory txData_change_req = abi.encodeWithSignature("changeRequirement(uint256)", 1);

    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_change_req);

    vm.prank(owner1);
    multiSig.confirmTransaction(txId);
    assertEq(multiSig.required(), 1);
  }

  function test_shouldNotAllowAnExternalAccountToChangeTheRequirement() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.changeRequirement(3);
  }
}

contract MultiSigChangeInternalRequirements is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
  }

  function test_shouldAllowTheInternalRequirementToBeChangedViaMultiSig() public {
    bytes memory txData_change_req = abi.encodeWithSignature(
      "changeInternalRequirement(uint256)",
      1
    );

    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_change_req);

    vm.prank(owner1);
    multiSig.confirmTransaction(txId);
    assertEq(multiSig.internalRequired(), 1);
  }

  function test_shouldNotAllowAnExternalAccountToChangeTheInternalRequirement() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.changeInternalRequirement(3);
  }
}

contract MultiSigGetConfirmationCount is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_shouldReturnTheConfirmationCount() public {
    assertEq(multiSig.getConfirmationCount(txId), 1);
  }
}

contract MultiSigGetTransactionCount is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_shouldReturnTheTransactionCount() public {
    assertEq(multiSig.getTransactionCount(true, true), 1);
  }
}

contract MultiSigGetOwners is MultiSigTest {
  function setUp() public {
    super.setUp();
  }

  function test_shouldReturnTheOwners() public {
    assertEq(multiSig.getOwners(), owners);
  }
}

contract MultiSigGetConfirmations is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_shouldReturnTheConfirmations() public {
    address[] memory expectedConfirmations = new address[](1);
    expectedConfirmations[0] = owner0;
    assertEq(multiSig.getConfirmations(txId), expectedConfirmations);
  }
}

contract MultiSigGetTransactionIds is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_shouldReturnTheTransactionIds() public {
    uint256[] memory expectedTransactionIds = new uint256[](1);
    expectedTransactionIds[0] = txId;
    assertEq(multiSig.getTransactionIds(0, 1, true, true), expectedTransactionIds);
  }
}
