// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/Escrow.sol";
import "@celo-contracts/identity/FederatedAttestations.sol";
import "@celo-contracts/identity/test/MockAttestations.sol";
import "@celo-contracts/identity/test/MockERC20Token.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Signatures.sol";

contract EscrowTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Escrow escrowContract;
  Registry registry;
  MockAttestations mockAttestations;
  FederatedAttestations federatedAttestations;
  MockERC20Token mockERC20Token;

  event DefaultTrustedIssuerAdded(address indexed trustedIssuer);
  event DefaultTrustedIssuerRemoved(address indexed trustedIssuer);

  event Transfer(
    address indexed from,
    bytes32 indexed identifier,
    address indexed token,
    uint256 value,
    address paymentId,
    uint256 minAttestations
  );

  struct EscrowedPayment {
    bytes32 recipientIdentifier;
    address sender;
    address token;
    uint256 value;
    uint256 sentIndex; // Location of this payment in sender's list of sent payments.
    uint256 receivedIndex; // Location of this payment in receivers's list of received payments.
    uint256 timestamp;
    uint256 expirySeconds;
    uint256 minAttestations;
  }

  event TrustedIssuersSet(address indexed paymentId, address[] trustedIssuers);
  event TrustedIssuersUnset(address indexed paymentId);

  event Withdrawal(
    bytes32 indexed identifier,
    // Note that in previous versions of Escrow.sol, `to` referenced
    // the original sender of the payment
    address indexed to,
    address indexed token,
    uint256 value,
    address paymentId
  );

  event Revocation(
    bytes32 indexed identifier,
    address indexed by,
    address indexed token,
    uint256 value,
    address paymentId
  );

  uint256 ONE_GOLDTOKEN = 1000000000000000000;
  address receiver;
  uint256 receiverPK;
  address sender;
  uint256 senderPK;
  address trustedIssuer1;
  address trustedIssuer2;

  function setUp() public {
    address registryAddress = 0x000000000000000000000000000000000000ce10;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    mockERC20Token = new MockERC20Token();
    escrowContract = new Escrow(true);
    escrowContract.initialize();
    registry = Registry(registryAddress);
    (receiver, receiverPK) = actorWithPK("receiver");
    (sender, senderPK) = actorWithPK("sender");
    trustedIssuer1 = actor("trustedIssuer1");
    trustedIssuer2 = actor("trustedIssuer2");
    vm.deal(receiver, ONE_GOLDTOKEN);
    vm.deal(sender, ONE_GOLDTOKEN);
    mockAttestations = new MockAttestations();
    federatedAttestations = new FederatedAttestations(true);
    registry.setAddressFor("Attestations", address(mockAttestations));
    registry.setAddressFor("FederatedAttestations", address(federatedAttestations));
  }

  function checkStateAfterDeletingPayment(
    address deletedPaymentId,
    EscrowedPayment memory payment,
    address escrowSender,
    bytes32 identifier,
    address[] memory expectedSentPaymentIds,
    address[] memory expectedReceivedPaymentIds
  ) public {
    address[] memory sentPaymentIds = escrowContract.getSentPaymentIds(escrowSender);
    address[] memory receivedPaymentIds = escrowContract.getReceivedPaymentIds(identifier);
    assertEq(sentPaymentIds, expectedSentPaymentIds, "unexpected sentPaymentIds");
    assertEq(receivedPaymentIds, expectedReceivedPaymentIds, "unexpected receivedPaymentIds");
    // Check that indices of last payment structs in previous lists are properly updated
    if (expectedSentPaymentIds.length > 0) {
      (, , , , uint256 sendersLastPaymentAfterDeleteSentIndex, , , , ) = escrowContract
        .escrowedPayments(expectedSentPaymentIds[expectedSentPaymentIds.length - 1]);

      assertEq(
        sendersLastPaymentAfterDeleteSentIndex,
        payment.sentIndex,
        "sentIndex of last payment in sender's sentPaymentIds not updated properly"
      );
    }
    if (expectedReceivedPaymentIds.length > 0) {
      (, , , , , uint256 receiversLastPaymentAfterDeleteReceivedIndex, , , ) = escrowContract
        .escrowedPayments(expectedReceivedPaymentIds[expectedReceivedPaymentIds.length - 1]);
      assertEq(
        receiversLastPaymentAfterDeleteReceivedIndex,
        payment.receivedIndex,
        "receivedIndex of last payment in receiver's receivedPaymentIds not updated properly"
      );
    }
    EscrowedPayment memory deletedEscrowedPayment = getEscrowedPayment(deletedPaymentId);
    assertEq(deletedEscrowedPayment.value, 0);

    address[] memory trustedIssuersPerPayment = escrowContract.getTrustedIssuersPerPayment(
      deletedPaymentId
    );
    assertEq(trustedIssuersPerPayment, new address[](0), "trustedIssuersPerPayment not zeroed out");
  }

  function getEscrowedPayment(address paymentId) public view returns (EscrowedPayment memory) {
    (
      bytes32 recipientIdentifier,
      address _sender,
      address token,
      uint256 value,
      uint256 sentIndex,
      uint256 receivedIndex,
      uint256 timestamp,
      uint256 expirySeconds,
      uint256 minAttestations
    ) = escrowContract.escrowedPayments(paymentId);
    return
      EscrowedPayment(
        recipientIdentifier,
        _sender,
        token,
        value,
        sentIndex,
        receivedIndex,
        timestamp,
        expirySeconds,
        minAttestations
      );
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function mintAndTransfer(
    address escrowSender,
    bytes32 identifier,
    uint256 value,
    uint256 expirySeconds,
    address paymentId,
    uint256 minAttestations,
    address[] memory trustedIssuers
  ) public {
    mockERC20Token.mint(escrowSender, value);
    vm.prank(escrowSender);
    escrowContract.transferWithTrustedIssuers(
      identifier,
      address(mockERC20Token),
      value,
      expirySeconds,
      paymentId,
      minAttestations,
      trustedIssuers
    );
  }
}

contract EscrowInitialize is EscrowTest {
  function test_Should_have_set_the_owner() public {
    assertEq(escrowContract.owner(), address(this));
  }

  function test_Reverts_If_InitializedAgain() public {
    vm.expectRevert("contract already initialized");
    escrowContract.initialize();
  }
}

contract EscrowAddDefaultTrustedIssuer is EscrowTest {
  function test_AllowOwnerToAddTrustedIssuer() public {
    address[] memory expected1 = new address[](0);
    assertEq(escrowContract.getDefaultTrustedIssuers(), expected1);
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
    address[] memory expected2 = new address[](1);
    expected2[0] = trustedIssuer1;
    assertEq(escrowContract.getDefaultTrustedIssuers(), expected2);
  }

  function test_Reverts_WhenNonOwnerTriesToAdd() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(sender);
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
  }

  function test_EventEmitted() public {
    vm.expectEmit(true, false, false, false);
    emit DefaultTrustedIssuerAdded(trustedIssuer1);
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
  }

  function test_Reverts_WhenEmptyAddress() public {
    vm.expectRevert("trustedIssuer can't be null");
    escrowContract.addDefaultTrustedIssuer(address(0));
  }

  function test_ShouldNotAllowATrustedIssuerToBeAddedTwice() public {
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
    vm.expectRevert("trustedIssuer already in defaultTrustedIssuers");
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
  }
}

contract EscrowWhenMaxTrustedIssuersHaveBeenAdded is EscrowTest {
  address[] expectedTrustedIssuers;
  function setUp() public {
    super.setUp();

    uint256 maxTrustedIssuers = escrowContract.MAX_TRUSTED_ISSUERS_PER_PAYMENT();
    for (uint256 i = 0; i < maxTrustedIssuers; i++) {
      address newIssuer = actor(string(abi.encodePacked(i)));
      escrowContract.addDefaultTrustedIssuer(newIssuer);
      expectedTrustedIssuers.push(newIssuer);
    }
  }

  function test_SetExpectedDefaultTrustedIssuers() public {
    assertEq(escrowContract.getDefaultTrustedIssuers(), expectedTrustedIssuers);
  }

  function test_DoesntAllowToAddMoreIssuers() public {
    vm.expectRevert("defaultTrustedIssuers.length can't exceed allowed number of trustedIssuers");
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
  }

  function test_ShouldAllowRemovingAndAddingIssuer() public {
    escrowContract.removeDefaultTrustedIssuer(
      expectedTrustedIssuers[expectedTrustedIssuers.length - 1],
      expectedTrustedIssuers.length - 1
    );
    expectedTrustedIssuers.pop();
    expectedTrustedIssuers.push(trustedIssuer1);
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
    assertEq(escrowContract.getDefaultTrustedIssuers(), expectedTrustedIssuers);
  }
}

contract EscrowRemoveDefaultTrustedIssuer is EscrowTest {
  function setUp() public {
    super.setUp();
    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
    address[] memory expected2 = new address[](1);
    expected2[0] = trustedIssuer1;
    assertEq(escrowContract.getDefaultTrustedIssuers(), expected2);
  }

  function test_AllowOwnerToRemoveTrustedIssuer() public {
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer1, 0);
    address[] memory expected1 = new address[](0);
    assertEq(escrowContract.getDefaultTrustedIssuers(), expected1);
  }

  function test_Reverts_WhenNonOwnerTriesToRemoveTrustedIssuer() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(sender);
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer1, 0);
  }

  function test_Emits_TheDefaultTrustedIssuerEvent() public {
    vm.expectEmit(true, false, false, false);
    emit DefaultTrustedIssuerRemoved(trustedIssuer1);
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer1, 0);
  }

  function test_Reverts_WhenIndexIsIncorrect() public {
    vm.expectRevert("index is invalid");
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer1, 1);
  }

  function test_Reverts_WhenIssuerIsNotOnIndex() public {
    escrowContract.addDefaultTrustedIssuer(trustedIssuer2);
    vm.expectRevert("trustedIssuer does not match address found at defaultTrustedIssuers[index]");
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer1, 1);
  }

  function test_AllowOwnerToRemoveTrustedIssuersWhenTwoArePresent() public {
    escrowContract.addDefaultTrustedIssuer(trustedIssuer2);
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer2, 1);
    escrowContract.removeDefaultTrustedIssuer(trustedIssuer1, 0);
    address[] memory expected1 = new address[](0);
    assertEq(escrowContract.getDefaultTrustedIssuers(), expected1);
  }
}

contract EscrowTestsWithTokens is EscrowTest {
  uint256 aValue = 10;
  bytes32 aPhoneHash = keccak256("+18005555555");
  uint256 oneDayInSecs = 86400;

  address withdrawKeyAddress = actor("withdrawKeyAddress");
  address anotherWithdrawKeyAddress = actor("anotherWithdrawKeyAddress");

  function setUp() public {
    super.setUp();
    mockERC20Token.mint(sender, aValue);
  }

  function transferAndCheckState(
    address escrowSender,
    bytes32 identifier,
    uint256 value,
    uint256 expirySeconds,
    address paymentId,
    uint256 minAttestations,
    address[] memory trustedIssuers,
    address[] memory expectedSentPaymentIds,
    address[] memory expectedReceivedPaymentIds
  ) public {
    uint256 startingEscrowContractBalance = mockERC20Token.balanceOf(address(escrowContract));
    uint256 startingSenderBalance = mockERC20Token.balanceOf(escrowSender);

    vm.prank(escrowSender);
    escrowContract.transferWithTrustedIssuers(
      identifier,
      address(mockERC20Token),
      value,
      expirySeconds,
      paymentId,
      minAttestations,
      trustedIssuers
    );

    (, , , uint256 returnedValue, , , , , ) = escrowContract.escrowedPayments(paymentId);

    assertEq(returnedValue, value, "incorrect escrowedPayment.value in payment struct");

    assertEq(
      mockERC20Token.balanceOf(escrowSender),
      startingSenderBalance - value,
      "incorrect final sender balance"
    );

    assertEq(
      mockERC20Token.balanceOf(address(escrowContract)),
      startingEscrowContractBalance + value,
      "Incorrect final Escrow contract balance"
    );

    address[] memory receivedPaymentIds = escrowContract.getReceivedPaymentIds(identifier);
    assertEq(receivedPaymentIds, expectedReceivedPaymentIds);

    address[] memory sentPaymentIds = escrowContract.getSentPaymentIds(escrowSender);
    assertEq(sentPaymentIds, expectedSentPaymentIds);

    address[] memory trustedIssuersPerPayment = escrowContract.getTrustedIssuersPerPayment(
      paymentId
    );
    assertEq(trustedIssuers, trustedIssuersPerPayment);
  }

  function test_ShouldAllowUsersToTransferTokensToAnyUser() public {
    address[] memory expected = new address[](1);
    expected[0] = withdrawKeyAddress;

    transferAndCheckState(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      0,
      new address[](0),
      expected,
      expected
    );
  }

  function test_ShouldAllowTransferWhenMinAttestationsGt0AndIdentifierIsProvided() public {
    // should allow transfer when minAttestations > 0 and identifier is provided
    address[] memory expected = new address[](1);
    expected[0] = withdrawKeyAddress;

    transferAndCheckState(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      3,
      new address[](0),
      expected,
      expected
    );
  }

  function test_ShouldAllowTransferWhenTrustedIssuersAreProvided() public {
    // should allow transfer when trustedIssuers are provided
    address[] memory expected = new address[](1);
    expected[0] = withdrawKeyAddress;

    address[] memory trustedIssuers = new address[](2);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;

    transferAndCheckState(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      3,
      trustedIssuers,
      expected,
      expected
    );
  }

  function test_ShouldAllowTransferWhenMaxTrustedIssuersAreProvided() public {
    // should allow transfer when max trustedIssuers are provided
    address[] memory expected = new address[](1);
    expected[0] = withdrawKeyAddress;

    uint256 maxTrustedIssuers = escrowContract.MAX_TRUSTED_ISSUERS_PER_PAYMENT();

    address[] memory trustedIssuers = new address[](maxTrustedIssuers);
    for (uint256 i = 0; i < maxTrustedIssuers; i++) {
      address newIssuer = actor(string(abi.encodePacked(i)));
      trustedIssuers[i] = newIssuer;
    }

    transferAndCheckState(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      3,
      trustedIssuers,
      expected,
      expected
    );
  }

  function test_ShouldAllowTransferWhenNoIdentifierIsProvided() public {
    // should allow transfer when no identifier is provided
    address[] memory expected = new address[](1);
    expected[0] = withdrawKeyAddress;

    transferAndCheckState(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      0,
      new address[](0),
      expected,
      expected
    );
  }

  function test_ShouldAllowTransferFromSameSenderWithDifferentPaymentIds() public {
    // should allow transfers from same sender with different paymentIds
    address[] memory expected = new address[](2);
    expected[0] = anotherWithdrawKeyAddress;
    expected[1] = withdrawKeyAddress;

    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      0,
      new address[](0)
    );

    transferAndCheckState(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      0,
      new address[](0),
      expected,
      expected
    );
  }

  function test_Emits_TheTransferEvent() public {
    vm.expectEmit(true, true, true, true);
    emit Transfer(sender, aPhoneHash, address(mockERC20Token), aValue, withdrawKeyAddress, 2);

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      new address[](0)
    );
  }

  function test_Emits_TheTrustedIssuerEvent() public {
    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = trustedIssuer1;

    vm.expectEmit(true, true, true, true);
    emit TrustedIssuersSet(withdrawKeyAddress, trustedIssuers);

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      trustedIssuers
    );
  }

  function test_ShouldNotAllowTwoTransfersWithSamePaymentId() public {
    // should not allow two transfers with same paymentId
    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      new address[](0)
    );

    vm.expectRevert("paymentId already used");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      new address[](0)
    );
  }

  function test_ShouldNotAllowTransferWhenTooManyTrustedIssuersAreProvided() public {
    // should not allow a transfer when too many trustedIssuers are provided
    address[] memory expected = new address[](1);
    expected[0] = withdrawKeyAddress;

    uint256 maxTrustedIssuers = escrowContract.MAX_TRUSTED_ISSUERS_PER_PAYMENT();

    address[] memory trustedIssuers = new address[](maxTrustedIssuers + 1);
    for (uint256 i = 0; i < maxTrustedIssuers + 1; i++) {
      address newIssuer = actor(string(abi.encodePacked(i)));
      trustedIssuers[i] = newIssuer;
    }

    vm.expectRevert("Too many trustedIssuers provided");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      trustedIssuers
    );
  }

  function test_ShouldNotAllowTransferWhenTokenIs0() public {
    // should not allow a transfer if token is 0

    vm.expectRevert("Invalid transfer inputs.");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(0),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      new address[](0)
    );
  }

  function test_ShouldNotAllowTransferIfValueIs0() public {
    // should not allow a transfer if value is 0

    vm.expectRevert("Invalid transfer inputs.");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      0,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      new address[](0)
    );
  }

  function test_ShouldNotAllowTransferIfExpirySecondsIs0() public {
    // should not allow a transfer if expirySeconds is 0

    vm.expectRevert("Invalid transfer inputs.");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      0,
      withdrawKeyAddress,
      2,
      new address[](0)
    );
  }

  function test_ShouldNotAllowTransferIfIdentifierIsEmptyButMinAttestationsIsGt0() public {
    // should not allow a transfer if identifier is empty but minAttestations is > 0

    vm.expectRevert("Invalid privacy inputs: Can't require attestations if no identifier");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      bytes32(0),
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      1,
      new address[](0)
    );
  }

  function test_ShouldNotAllowTransferIfIdentifierIsEmptyButTrustedIssuersAreProvided() public {
    // should not allow a transfer if identifier is empty but trustedIssuers are provided

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = trustedIssuer1;

    vm.expectRevert("trustedIssuers may only be set when attestations are required");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      bytes32(0),
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      0,
      trustedIssuers
    );
  }

  function test_ShouldNotAllowSettingTrustedIssuersWithoutMinAttestations() public {
    // should not allow setting trustedIssuers without minAttestations

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = trustedIssuer1;

    vm.expectRevert("trustedIssuers may only be set when attestations are required");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      0,
      trustedIssuers
    );
  }

  function test_ShouldRevertIfTransferValueExceedsBalance() public {
    // should revert if transfer value exceeds balance

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = trustedIssuer1;

    vm.expectRevert("SafeERC20: low-level call failed");

    vm.prank(sender);
    escrowContract.transferWithTrustedIssuers(
      aPhoneHash,
      address(mockERC20Token),
      aValue + 1,
      oneDayInSecs,
      withdrawKeyAddress,
      2,
      new address[](0)
    );
  }

  function test_Transfer_WhenNoDefaultTrustedIssuersAreSet_ShouldSetThemToEmptyList() public {
    // when no defaut trustedIssuers are set; should set trustedIssuersPerPaymentId to empty list
    vm.prank(sender);
    escrowContract.transfer(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2
    );

    address[] memory expected = new address[](0);
    address[] memory trustedIssuersPerPayment = escrowContract.getTrustedIssuersPerPayment(
      withdrawKeyAddress
    );
    assertEq(trustedIssuersPerPayment, expected);
  }

  function test_Transfer_WhenDefaultTrustedIssuersAreSet_ShouldSetTrustedIssuersPerPaymentIdToDefaultWhenMinAttestationsGt0()
    public
  {
    // when defaut trustedIssuers are set; should set trustedIssuersPerPaymentId to default when minAttestations>0

    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
    escrowContract.addDefaultTrustedIssuer(trustedIssuer2);

    address[] memory trustedIssuers = new address[](2);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;

    vm.prank(sender);
    escrowContract.transfer(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      2
    );

    address[] memory trustedIssuersPerPayment = escrowContract.getTrustedIssuersPerPayment(
      withdrawKeyAddress
    );
    assertEq(trustedIssuersPerPayment, trustedIssuers);
  }

  function test_Transfer_WhenDefaultTrustedIssuersAreSet_ShouldSetTrustedIssuersPerPaymentIdToEmptyListWhenMinAttestationsEq0()
    public
  {
    // when defaut trustedIssuers are set; should set trustedIssuersPerPaymentId to empty list when minAttestations==0

    escrowContract.addDefaultTrustedIssuer(trustedIssuer1);
    escrowContract.addDefaultTrustedIssuer(trustedIssuer2);

    vm.prank(sender);
    escrowContract.transfer(
      aPhoneHash,
      address(mockERC20Token),
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      0
    );

    address[] memory trustedIssuersPerPayment = escrowContract.getTrustedIssuersPerPayment(
      withdrawKeyAddress
    );
    address[] memory expected = new address[](0);
    assertEq(trustedIssuersPerPayment, expected);
  }
}

contract EscrowWithdrawalTest is EscrowTest {
  uint256 aValue = 10;
  bytes32 aPhoneHash = keccak256("+18005555555");
  uint256 oneDayInSecs = 86400;

  address withdrawKeyAddress;
  uint256 withdrawalKeyAddressPK;
  address anotherWithdrawKeyAddress;
  uint256 anotherWithdrawKeyAddressPK;

  address uniquePaymentIDWithdraw;
  uint256 uniquePaymentIDWithdrawPK;

  function setUp() public {
    (withdrawKeyAddress, withdrawalKeyAddressPK) = actorWithPK("withdrawKeyAddress");
    (anotherWithdrawKeyAddress, anotherWithdrawKeyAddressPK) = actorWithPK(
      "anotherWithdrawKeyAddress"
    );

    uniquePaymentIDWithdraw = withdrawKeyAddress;
    uniquePaymentIDWithdrawPK = withdrawalKeyAddressPK;

    super.setUp();
    mockERC20Token.mint(sender, aValue);
  }

  function completeAttestations(
    address account,
    bytes32 identifier,
    uint256 attestationsToComplete
  ) public {
    for (uint256 i = 0; i < attestationsToComplete; i++) {
      vm.prank(account);
      mockAttestations.complete(identifier, 0, bytes32(0), bytes32(0));
    }
  }

  function withdrawAndCheckState(
    address escrowSender,
    address escrowReceiver,
    bytes32 identifier,
    address paymentId,
    address[] memory expectedSentPaymentIds,
    address[] memory expectedReceivedPaymentIds
  ) public {
    uint256 receiverBalanceBefore = mockERC20Token.balanceOf(escrowReceiver);
    uint256 escrowContractBalanceBefore = mockERC20Token.balanceOf(address(escrowContract));

    EscrowedPayment memory payment = getEscrowedPayment(paymentId);

    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      escrowReceiver,
      uniquePaymentIDWithdrawPK
    );
    vm.prank(escrowReceiver);
    escrowContract.withdraw(paymentId, v, r, s);

    assertEq(
      mockERC20Token.balanceOf(escrowReceiver),
      receiverBalanceBefore + payment.value,
      "incorrect final receiver balance"
    );
    assertEq(
      mockERC20Token.balanceOf(address(escrowContract)),
      escrowContractBalanceBefore - payment.value,
      "incorrect final Escrow contract balance"
    );
    checkStateAfterDeletingPayment(
      paymentId,
      payment,
      escrowSender,
      identifier,
      expectedSentPaymentIds,
      expectedReceivedPaymentIds
    );
  }

  function test_ShouldFailIfPaymentIdDoesNotExist() public {
    // should fail when no payment has been escrowed
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      receiver,
      uniquePaymentIDWithdrawPK
    );
    vm.expectRevert("Invalid withdraw value.");
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDWithdraw, v, r, s);
  }

  function test_ShouldAllowWithdrawalWithPossesionOfPKAndNoAttestations() public {
    // should allow withdrawal with possession of PK and no attestations
    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      0,
      new address[](0)
    );

    withdrawAndCheckState(
      sender,
      receiver,
      bytes32(0),
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }

  function test_Emits_TheTrustedIssuersUnsetEvent() public {
    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      0,
      new address[](0)
    );

    vm.expectEmit(true, true, true, true);
    emit TrustedIssuersUnset(uniquePaymentIDWithdraw);

    withdrawAndCheckState(
      sender,
      receiver,
      bytes32(0),
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }

  function test_Emits_WithdwaralEvent() public {
    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      0,
      new address[](0)
    );

    vm.expectEmit(true, true, true, true);
    emit Withdrawal(bytes32(0), receiver, address(mockERC20Token), aValue, uniquePaymentIDWithdraw);

    withdrawAndCheckState(
      sender,
      receiver,
      bytes32(0),
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }

  function test_ShouldWithdrawProperlyWhenSecondPaymentEscrowedWithEmptyIdentifier() public {
    // should withdraw properly when second payment escrowed with empty identifier

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      0,
      new address[](0)
    );
    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      0,
      new address[](0)
    );

    withdrawAndCheckState(
      sender,
      receiver,
      bytes32(0),
      uniquePaymentIDWithdraw,
      expected,
      expected
    );
  }

  function test_ShouldWithdawProperlyWhenSenderSecondPaymentHasAnIdentifierWithAttestations()
    public
  {
    // should withdraw properly when sender's second payment has an identifier with attestations

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      0,
      new address[](0)
    );
    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      3,
      new address[](0)
    );

    withdrawAndCheckState(
      sender,
      receiver,
      bytes32(0),
      uniquePaymentIDWithdraw,
      expected,
      new address[](0)
    );
  }

  function test_ShouldNotAllowWithdrawingWithoutAValidSignatureUsingTheWithdrawalKey() public {
    // should not allow withdrawing without a valid signature using the withdraw key

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    mintAndTransfer(
      sender,
      bytes32(0),
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      0,
      new address[](0)
    );

    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      receiver,
      uniquePaymentIDWithdrawPK
    );
    vm.expectRevert("Failed to prove ownership of the withdraw key");
    // The signature is invalidated if it's sent from a different address
    vm.prank(address(this));
    escrowContract.withdraw(uniquePaymentIDWithdraw, v, r, s);
  }

  function test_WhenFirstPaymentWithIdentifierAndMinAttestations_ShouldAllowToWithdraw() public {
    // when first payment is escrowed by a sender for identifier && minAttestations; should allow users to withdraw after completing attestations
    uint256 minAttestations = 3;

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      new address[](0)
    );

    completeAttestations(receiver, aPhoneHash, minAttestations);
    withdrawAndCheckState(
      sender,
      receiver,
      aPhoneHash,
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }

  function test_WhenFirstPaymentWithIdentifierAndMinAttestations_ShouldNotAllowToWithdrawWhenLessThanMinAttestations()
    public
  {
    // should not allow a user to withdraw a payment if they have fewer than minAttestations
    uint256 minAttestations = 3;

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      new address[](0)
    );

    completeAttestations(receiver, aPhoneHash, minAttestations - 1);
    vm.expectRevert(
      "This account does not have the required attestations to withdraw this payment."
    );
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      receiver,
      uniquePaymentIDWithdrawPK
    );
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDWithdraw, v, r, s);
  }

  function test_ShouldWithdawProperlyWhenSenderSecondPaymentHasAnIdentifier() public {
    // should withdraw properly when sender's second payment has an identifier
    uint256 minAttestations = 3;

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      new address[](0)
    );
    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      0,
      new address[](0)
    );

    completeAttestations(receiver, aPhoneHash, minAttestations);
    withdrawAndCheckState(
      sender,
      receiver,
      bytes32(0),
      uniquePaymentIDWithdraw,
      expected,
      new address[](0)
    );
  }

  function test_WhenTrustedIssuersAreSetForPayment_AttestationsSolIsTrustedIssuer_ShouldAllowTransferWhenCompletingAttestations()
    public
  {
    uint256 minAttestations = 3;

    address[] memory trustedIssuers = new address[](3);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;
    trustedIssuers[2] = address(mockAttestations);

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      trustedIssuers
    );

    completeAttestations(receiver, aPhoneHash, minAttestations);
    withdrawAndCheckState(
      sender,
      receiver,
      aPhoneHash,
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }

  function test_WhenTrustedIssuersAreSetForPayment_AttestationsSolIsTrustedIssuer_ShouldNotAllowWithdrawalIfNoAttestationsInFederatedAttestations()
    public
  {
    uint256 minAttestations = 3;

    address[] memory trustedIssuers = new address[](3);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;
    trustedIssuers[2] = address(mockAttestations);

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      trustedIssuers
    );

    completeAttestations(receiver, aPhoneHash, minAttestations - 1);
    vm.expectRevert(
      "This account does not have the required attestations to withdraw this payment."
    );
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      receiver,
      uniquePaymentIDWithdrawPK
    );
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDWithdraw, v, r, s);
  }

  function test_WhenTrustedIssuersAreSetForPayment_AttestationsSolIsTrustedIssuer_ShouldAllowWithdrawalIfAttestationInFederatedAttestations()
    public
  {
    uint256 minAttestations = 3;

    address[] memory trustedIssuers = new address[](3);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;
    trustedIssuers[2] = address(mockAttestations);

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      trustedIssuers
    );

    completeAttestations(receiver, aPhoneHash, minAttestations - 1);
    vm.prank(trustedIssuer2);
    federatedAttestations.registerAttestationAsIssuer(aPhoneHash, receiver, 0);
    withdrawAndCheckState(
      sender,
      receiver,
      aPhoneHash,
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }

  function test_WhenTrustedIssuersAreSetForPayment_AttestationsSolNotInTrustedIssuer_ShouldNotAllowWithdrawalIfNoAttestationsInFederatedAttestations()
    public
  {
    uint256 minAttestations = 2;

    address[] memory trustedIssuers = new address[](2);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      trustedIssuers
    );

    completeAttestations(receiver, aPhoneHash, minAttestations - 1);
    vm.expectRevert(
      "This account does not have the required attestations to withdraw this payment."
    );
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      receiver,
      uniquePaymentIDWithdrawPK
    );
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDWithdraw, v, r, s);
  }

  function test_WhenTrustedIssuersAreSetForPayment_AttestationsSolNotInTrustedIssuer_ShouldAllowWithdrawalIfAttestationInFederatedAttestations()
    public
  {
    uint256 minAttestations = 2;

    address[] memory trustedIssuers = new address[](2);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;

    mintAndTransfer(
      sender,
      aPhoneHash,
      aValue,
      oneDayInSecs,
      uniquePaymentIDWithdraw,
      minAttestations,
      trustedIssuers
    );

    completeAttestations(receiver, aPhoneHash, minAttestations - 1);
    vm.prank(trustedIssuer2);
    federatedAttestations.registerAttestationAsIssuer(aPhoneHash, receiver, 0);
    withdrawAndCheckState(
      sender,
      receiver,
      aPhoneHash,
      uniquePaymentIDWithdraw,
      new address[](0),
      new address[](0)
    );
  }
}

contract EscrowRevokeTestIdentifierEmptyMinAttestations0TrustedIssuersEmpty is EscrowTest {
  uint256 aValue = 10;
  bytes32 aPhoneHash = keccak256("+18005555555");
  uint256 oneDayInSecs = 86400;

  address withdrawKeyAddress;
  uint256 withdrawalKeyAddressPK;
  address anotherWithdrawKeyAddress;
  uint256 anotherWithdrawKeyAddressPK;

  address uniquePaymentIDRevoke;

  bytes32 identifier;
  uint256 minAttestations;
  address[] trustedIssuers;

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    (withdrawKeyAddress, withdrawalKeyAddressPK) = actorWithPK("withdrawKeyAddress");
    (anotherWithdrawKeyAddress, anotherWithdrawKeyAddressPK) = actorWithPK(
      "anotherWithdrawKeyAddress"
    );

    super.setUp();
    mockERC20Token.mint(sender, aValue);

    identifier = bytes32(0);
    minAttestations = 0;
    trustedIssuers = new address[](0);

    mintAndTransfer(
      sender,
      identifier,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      minAttestations,
      trustedIssuers
    );

    mintAndTransfer(
      sender,
      identifier,
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      minAttestations,
      trustedIssuers
    );
    uniquePaymentIDRevoke = withdrawKeyAddress;
    (v, r, s) = getParsedSignatureOfAddress(receiver, withdrawalKeyAddressPK);

    if (trustedIssuers.length > 0) {
      vm.prank(trustedIssuers[0]);
      federatedAttestations.registerAttestationAsIssuer(identifier, receiver, 0);
    }
  }

  function test_ShouldAllowSenderToRedeemPaymentAfterPaymentHasExpired() public {
    // should allow sender to redeem payment after payment has expired
    vm.warp(oneDayInSecs + 1);

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    uint256 senderBalanceBefore = mockERC20Token.balanceOf(sender);
    uint256 escrowContractBalanceBefore = mockERC20Token.balanceOf(address(escrowContract));
    EscrowedPayment memory paymentBefore = getEscrowedPayment(uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);

    assertEq(
      mockERC20Token.balanceOf(sender),
      senderBalanceBefore + aValue,
      "incorrect final sender balance"
    );

    assertEq(
      mockERC20Token.balanceOf(address(escrowContract)),
      escrowContractBalanceBefore - aValue,
      "incorrect final Escrow contract balance"
    );

    checkStateAfterDeletingPayment(
      uniquePaymentIDRevoke,
      paymentBefore,
      sender,
      identifier,
      expected,
      expected
    );
  }

  function test_Emits_TheTrustedIssuersUnsetEvent() public {
    vm.warp(oneDayInSecs + 1);

    vm.expectEmit(true, true, true, true);
    emit TrustedIssuersUnset(uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_Emits_RevokationEvent() public {
    vm.warp(oneDayInSecs + 1);

    vm.expectEmit(true, true, true, true);
    emit Revocation(identifier, sender, address(mockERC20Token), aValue, uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowSenderToRevokeAfterReceiverWithdraws() public {
    // should not allow sender to revoke after receiver withdraws
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDRevoke, v, r, s);
    vm.expectRevert("Only sender of payment can attempt to revoke payment.");
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowReceiverToRedeemPAymentAfterSenderRevokesIt() public {
    // should not allow receiver to redeem payment after sender revokes it
    vm.warp(oneDayInSecs + 1);
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
    vm.expectRevert("Invalid withdraw value.");
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDRevoke, v, r, s);
  }

  function test_ShouldNotAllowSenderToRevokePaymentBeforePaymentHasExpired() public {
    // should not allow sender to revoke payment before payment has expired
    vm.expectRevert("Transaction not redeemable for sender yet.");
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowReceiverToUseRevokeFunction() public {
    // should not allow receiver to use revoke function
    vm.expectRevert("Only sender of payment can attempt to revoke payment.");
    vm.prank(receiver);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }
}

contract EscrowRevokeTestIdentifierNotEmptyMinAttestations0TrustedIssuersEmpty is EscrowTest {
  uint256 aValue = 10;
  bytes32 aPhoneHash = keccak256("+18005555555");
  uint256 oneDayInSecs = 86400;

  address withdrawKeyAddress;
  uint256 withdrawalKeyAddressPK;
  address anotherWithdrawKeyAddress;
  uint256 anotherWithdrawKeyAddressPK;

  address uniquePaymentIDRevoke;

  bytes32 identifier;
  uint256 minAttestations;
  address[] trustedIssuers;

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    (withdrawKeyAddress, withdrawalKeyAddressPK) = actorWithPK("withdrawKeyAddress");
    (anotherWithdrawKeyAddress, anotherWithdrawKeyAddressPK) = actorWithPK(
      "anotherWithdrawKeyAddress"
    );

    super.setUp();
    mockERC20Token.mint(sender, aValue);

    identifier = aPhoneHash;
    minAttestations = 0;
    trustedIssuers = new address[](0);

    mintAndTransfer(
      sender,
      identifier,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      minAttestations,
      trustedIssuers
    );

    mintAndTransfer(
      sender,
      identifier,
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      minAttestations,
      trustedIssuers
    );
    uniquePaymentIDRevoke = withdrawKeyAddress;
    (v, r, s) = getParsedSignatureOfAddress(receiver, withdrawalKeyAddressPK);

    if (trustedIssuers.length > 0) {
      vm.prank(trustedIssuers[0]);
      federatedAttestations.registerAttestationAsIssuer(identifier, receiver, 0);
    }
  }

  function test_ShouldAllowSenderToRedeemPaymentAfterPaymentHasExpired() public {
    // should allow sender to redeem payment after payment has expired
    vm.warp(oneDayInSecs + 1);

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    uint256 senderBalanceBefore = mockERC20Token.balanceOf(sender);
    uint256 escrowContractBalanceBefore = mockERC20Token.balanceOf(address(escrowContract));
    EscrowedPayment memory paymentBefore = getEscrowedPayment(uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);

    assertEq(
      mockERC20Token.balanceOf(sender),
      senderBalanceBefore + aValue,
      "incorrect final sender balance"
    );

    assertEq(
      mockERC20Token.balanceOf(address(escrowContract)),
      escrowContractBalanceBefore - aValue,
      "incorrect final Escrow contract balance"
    );

    checkStateAfterDeletingPayment(
      uniquePaymentIDRevoke,
      paymentBefore,
      sender,
      identifier,
      expected,
      expected
    );
  }

  function test_Emits_TheTrustedIssuersUnsetEvent() public {
    vm.warp(oneDayInSecs + 1);

    vm.expectEmit(true, true, true, true);
    emit TrustedIssuersUnset(uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_Emits_RevokationEvent() public {
    vm.warp(oneDayInSecs + 1);

    vm.expectEmit(true, true, true, true);
    emit Revocation(identifier, sender, address(mockERC20Token), aValue, uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowSenderToRevokeAfterReceiverWithdraws() public {
    // should not allow sender to revoke after receiver withdraws
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDRevoke, v, r, s);
    vm.expectRevert("Only sender of payment can attempt to revoke payment.");
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowReceiverToRedeemPAymentAfterSenderRevokesIt() public {
    // should not allow receiver to redeem payment after sender revokes it
    vm.warp(oneDayInSecs + 1);
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
    vm.expectRevert("Invalid withdraw value.");
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDRevoke, v, r, s);
  }

  function test_ShouldNotAllowSenderToRevokePaymentBeforePaymentHasExpired() public {
    // should not allow sender to revoke payment before payment has expired
    vm.expectRevert("Transaction not redeemable for sender yet.");
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowReceiveToUseRevokeFunction() public {
    // should not allow receiver to use revoke function
    vm.expectRevert("Only sender of payment can attempt to revoke payment.");
    vm.prank(receiver);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }
}

contract EscrowRevokeTestIdentifierNotEmptyMinAttestations1TrustedIssuersNonEmpty is EscrowTest {
  uint256 aValue = 10;
  bytes32 aPhoneHash = keccak256("+18005555555");
  uint256 oneDayInSecs = 86400;

  address withdrawKeyAddress;
  uint256 withdrawalKeyAddressPK;
  address anotherWithdrawKeyAddress;
  uint256 anotherWithdrawKeyAddressPK;

  address uniquePaymentIDRevoke;

  bytes32 identifier;
  uint256 minAttestations;
  address[] trustedIssuers;

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    (withdrawKeyAddress, withdrawalKeyAddressPK) = actorWithPK("withdrawKeyAddress");
    (anotherWithdrawKeyAddress, anotherWithdrawKeyAddressPK) = actorWithPK(
      "anotherWithdrawKeyAddress"
    );

    super.setUp();
    mockERC20Token.mint(sender, aValue);

    identifier = aPhoneHash;
    minAttestations = 1;
    trustedIssuers = new address[](2);
    trustedIssuers[0] = trustedIssuer1;
    trustedIssuers[1] = trustedIssuer2;

    mintAndTransfer(
      sender,
      identifier,
      aValue,
      oneDayInSecs,
      withdrawKeyAddress,
      minAttestations,
      trustedIssuers
    );

    mintAndTransfer(
      sender,
      identifier,
      aValue,
      oneDayInSecs,
      anotherWithdrawKeyAddress,
      minAttestations,
      trustedIssuers
    );
    uniquePaymentIDRevoke = withdrawKeyAddress;
    (v, r, s) = getParsedSignatureOfAddress(receiver, withdrawalKeyAddressPK);

    if (trustedIssuers.length > 0) {
      vm.prank(trustedIssuers[0]);
      federatedAttestations.registerAttestationAsIssuer(identifier, receiver, 0);
    }
  }

  function test_ShouldAllowSenderToRedeemPaymentAfterPaymentHasExpired() public {
    // should allow sender to redeem payment after payment has expired
    vm.warp(oneDayInSecs + 1);

    address[] memory expected = new address[](1);
    expected[0] = anotherWithdrawKeyAddress;

    uint256 senderBalanceBefore = mockERC20Token.balanceOf(sender);
    uint256 escrowContractBalanceBefore = mockERC20Token.balanceOf(address(escrowContract));
    EscrowedPayment memory paymentBefore = getEscrowedPayment(uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);

    assertEq(
      mockERC20Token.balanceOf(sender),
      senderBalanceBefore + aValue,
      "incorrect final sender balance"
    );

    assertEq(
      mockERC20Token.balanceOf(address(escrowContract)),
      escrowContractBalanceBefore - aValue,
      "incorrect final Escrow contract balance"
    );

    checkStateAfterDeletingPayment(
      uniquePaymentIDRevoke,
      paymentBefore,
      sender,
      identifier,
      expected,
      expected
    );
  }

  function test_Emits_TheTrustedIssuersUnsetEvent() public {
    vm.warp(oneDayInSecs + 1);

    vm.expectEmit(true, true, true, true);
    emit TrustedIssuersUnset(uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_Emits_RevokationEvent() public {
    vm.warp(oneDayInSecs + 1);

    vm.expectEmit(true, true, true, true);
    emit Revocation(identifier, sender, address(mockERC20Token), aValue, uniquePaymentIDRevoke);

    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowSenderToRevokeAfterReceiverWithdraws() public {
    // should not allow sender to revoke after receiver withdraws
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDRevoke, v, r, s);
    vm.expectRevert("Only sender of payment can attempt to revoke payment.");
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowReceiverToRedeemPAymentAfterSenderRevokesIt() public {
    // should not allow receiver to redeem payment after sender revokes it
    vm.warp(oneDayInSecs + 1);
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
    vm.expectRevert("Invalid withdraw value.");
    vm.prank(receiver);
    escrowContract.withdraw(uniquePaymentIDRevoke, v, r, s);
  }

  function test_ShouldNotAllowSenderToRevokePaymentBeforePaymentHasExpired() public {
    // should not allow sender to revoke payment before payment has expired
    vm.expectRevert("Transaction not redeemable for sender yet.");
    vm.prank(sender);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }

  function test_ShouldNotAllowReceiveToUseRevokeFunction() public {
    // should not allow receiver to use revoke function
    vm.expectRevert("Only sender of payment can attempt to revoke payment.");
    vm.prank(receiver);
    escrowContract.revoke(uniquePaymentIDRevoke);
  }
}
