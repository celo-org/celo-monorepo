// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/MultiSig.sol";

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

contract MultiSigTest_initialize is MultiSigTest {
  function test_ShouldHaveSetTheOwners() public {
    assertEq(multiSig.getOwners(), owners);
  }

  function test_ShouldHaveSetTheNumberOfRequiredSignaturesForExternalTransactions() public {
    assertEq(uint256(multiSig.required()), 2);
  }

  function test_ShouldHaveSetTheNumberOfRequiredSignaturesForInternalTransactions() public {
    assertEq(uint256(multiSig.internalRequired()), 2);
  }

  function test_Reverts_WhenCalledTwice() public {
    vm.expectRevert("contract already initialized");
    multiSig.initialize(owners, requiredSignatures, internalRequiredSignatures);
  }
}

contract MultiSigTest_fallbackFunction is MultiSigTest {
  uint256 amount = 100;

  function uncheckedSendViaCall(address payable _to, uint256 _amount) public payable {
    _to.call.value(_amount)("");
  }

  function test_Emits_DepositEventWithCorrectParameters_whenReceivingCelo() public payable {
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

contract MultiSigTest_submitTransaction is MultiSigTest {
  uint256 txId = 0;

  function test_ShouldAllowAnOwnerToSubmitATransaction() public {
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

  function test_Reverts_WhenOwnerSubmitsATransactionToANullAddress() public {
    vm.expectRevert("address was null");
    multiSig.submitTransaction(address(0), 0, addOwnerTxData);
  }

  function test_Reverts_WhenNonOwnerSubmitsATransaction() public {
    vm.expectRevert("owner does not exist");
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }
}

contract MultiSigTest_confirmTransaction is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_ShouldAllowAnOwnerToConfirmTransaction() public {
    vm.prank(owner1);
    multiSig.confirmTransaction(txId);

    assertEq(multiSig.confirmations(txId, owner1), true);

    (, , , bool exec) = multiSig.transactions(txId);
    assertEq(exec, true);
  }

  function test_Reverts_WhenOwnerTriesToConfirmATransactionTwice() public {
    vm.prank(owner0);
    vm.expectRevert("transaction was already confirmed for owner");
    multiSig.confirmTransaction(txId);
  }

  function test_Reverts_WhenNonOwnerTriesToConfirmATransaction() public {
    vm.prank(nonOwner);
    vm.expectRevert("owner does not exist");
    multiSig.confirmTransaction(txId);
  }
}

contract MultiSigTest_revokeConfirmation is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_ShouldAllowAnOwnerToRevokeConfirmation() public {
    vm.prank(owner0);
    multiSig.revokeConfirmation(txId);
    assertEq(multiSig.confirmations(txId, owner0), false);
  }

  function test_Reverts_WhenANonOwnerTriesToRevokeConfirmation() public {
    vm.prank(nonOwner);
    vm.expectRevert("owner does not exist");
    multiSig.revokeConfirmation(txId);
  }

  function test_Reverts_WhenAnOwnerTriesToRevokeBeforeConfirming() public {
    vm.prank(owner1);
    vm.expectRevert("transaction was not confirmed for owner");
    multiSig.revokeConfirmation(txId);
  }
}

contract MultiSigTest_addOwner is MultiSigTest {
  uint256 txId = 0;
  address[] public updatedOwners;

  function setUp() public {
    super.setUp();
    updatedOwners = [owner0, owner1, newOwner];
  }

  function test_ShouldAllowNewOwnerToBeAddedViaMultiSig() public {
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
    vm.prank(owner1);
    multiSig.confirmTransaction(txId);
    assertEq(multiSig.isOwner(newOwner), true);

    assertEq(multiSig.getOwners(), updatedOwners);
  }

  function test_Reverts_WhenAnExternalAccountTriesToAddAnOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.addOwner(newOwner);
  }

  function test_Reverts_WhenAddingZeroAddress() public {
    bytes memory txData_null = abi.encodeWithSignature("addOwner(address)", address(0));
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_null);

    vm.prank(owner1);
    vm.expectRevert("Transaction execution failed.");
    multiSig.confirmTransaction(txId);
  }
}

contract MultiSigTest_removeOwner is MultiSigTest {
  uint256 txId = 0;
  address[] public updatedOwners;

  function setUp() public {
    super.setUp();
    updatedOwners = [owner0];
  }

  function test_ShouldAllowOwnerToBeRemovedViaMultiSig() public {
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

  function test_ShouldNotAllowAnExternalAccountToRemoveAnOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.removeOwner(newOwner);
  }
}

contract MultiSigTest_replaceOwner is MultiSigTest {
  uint256 txId = 0;
  address[] public updatedOwners;

  function setUp() public {
    super.setUp();
    updatedOwners = [owner0, newOwner];
  }

  function test_ShouldAllowAnExistingOwnerToBeReplacedViaMultiSig() public {
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

  function test_ShouldNotAllowAnExternalAccountToReplaceAnOwner() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.replaceOwner(owner1, newOwner);
  }

  function test_ShouldNotAllowAnOwnerToBeReplacedByNullAddress() public {
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

contract MultiSigTest_changeRequirements is MultiSigTest {
  uint256 txId = 0;

  function test_ShouldAllowTheRequirementToBeChangedViaMultiSig() public {
    bytes memory txData_change_req = abi.encodeWithSignature("changeRequirement(uint256)", 1);

    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, txData_change_req);

    vm.prank(owner1);
    multiSig.confirmTransaction(txId);
    assertEq(multiSig.required(), 1);
  }

  function test_ShouldNotAllowAnExternalAccountToChangeTheRequirement() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.changeRequirement(3);
  }
}

contract MultiSigTest_changeInternalRequirements is MultiSigTest {
  uint256 txId = 0;

  function test_ShouldAllowTheInternalRequirementToBeChangedViaMultiSig() public {
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

  function test_Reverts_WhenAnExternalAccountTriesChangeTheInternalRequirement() public {
    vm.prank(nonOwner);
    vm.expectRevert("msg.sender was not multisig wallet");
    multiSig.changeInternalRequirement(3);
  }
}

contract MultiSigTest_confirmationCount is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_ShouldReturnTheConfirmationCount() public {
    assertEq(multiSig.getConfirmationCount(txId), 1);
  }
}

contract MultiSigTest_getTransactionCount is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_ShouldReturnTheTransactionCount() public {
    assertEq(multiSig.getTransactionCount(true, true), 1);
  }
}

contract MultiSigTest_getOwners is MultiSigTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldReturnTheOwners() public {
    assertEq(multiSig.getOwners(), owners);
  }
}

contract MultiSigTest_getConfirmations is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_ShouldReturnTheConfirmations() public {
    address[] memory expectedConfirmations = new address[](1);
    expectedConfirmations[0] = owner0;
    assertEq(multiSig.getConfirmations(txId), expectedConfirmations);
  }
}

contract MultiSigTest_getTransactionIds is MultiSigTest {
  uint256 txId = 0;

  function setUp() public {
    super.setUp();
    vm.prank(owner0);
    multiSig.submitTransaction(address(multiSig), 0, addOwnerTxData);
  }

  function test_ShouldReturnTheTransactionIds() public {
    uint256[] memory expectedTransactionIds = new uint256[](1);
    expectedTransactionIds[0] = txId;
    assertEq(multiSig.getTransactionIds(0, 1, true, true), expectedTransactionIds);
  }
}
