// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "../contracts/identity/test/AttestationsTest.sol";
import "../contracts/identity/test/MockERC20Token.sol";
import "../contracts/identity/test/MockRandom.sol";
import "../contracts/governance/test/MockElection.sol";
import "../contracts/governance/test/MockLockedGold.sol";
import "../contracts/governance/test/MockValidators.sol";
import "../contracts/common/Registry.sol";
import "../contracts/common/Accounts.sol";

contract AttestationsFoundryTest is Test {
  enum KeyOffsets {
    VALIDATING_KEY_OFFSET,
    ATTESTING_KEY_OFFSET,
    NEW_VALIDATING_KEY_OFFSET,
    VOTING_KEY_OFFSET
  }

  AttestationsTest attestationsTest;
  MockERC20Token mockERC20Token;
  MockERC20Token otherMockERC20Token;
  MockElection mockElection;
  MockLockedGold mockLockedGold;
  MockValidators mockValidators;
  MockRandom random;
  Registry registry;
  Accounts accounts;

  address caller;
  uint256 callerPK;
  address caller2;
  uint256 callerPK2;
  address caller3;
  uint256 callerPK3;
  address nonIssuer = actor("nonIssuer");
  string phoneNumber = "+18005551212";
  bytes32 phoneHash;

  uint256 attestationsRequested = 3;
  uint256 attestationExpiryBlocks = (60 * 60) / 5;
  uint256 selectIssuersWaitBlocks = 4;
  uint256 maxAttestations = 20;
  uint256 attestationFee = 0.5 ether;

  event AttestationsRequested(
    bytes32 indexed identifier,
    address indexed account,
    uint256 attestationsRequested,
    address attestationRequestFeeToken
  );

  event AttestationIssuerSelected(
    bytes32 indexed identifier,
    address indexed account,
    address indexed issuer,
    address attestationRequestFeeToken
  );

  event AttestationCompleted(
    bytes32 indexed identifier,
    address indexed account,
    address indexed issuer
  );

  event Withdrawal(address indexed account, address indexed token, uint256 amount);
  event AttestationExpiryBlocksSet(uint256 value);
  event AttestationRequestFeeSet(address indexed token, uint256 value);
  event SelectIssuersWaitBlocksSet(uint256 value);
  event MaxAttestationsSet(uint256 value);
  event AttestationsTransferred(
    bytes32 indexed identifier,
    address indexed fromAccount,
    address indexed toAccount
  );
  event TransferApproval(
    address indexed approver,
    bytes32 indexed indentifier,
    address from,
    address to,
    bool approved
  );

  // function getDerivedKey(uint8 offset, uint256 privateKey) public pure returns (bytes32) {
  //     bytes32 aKey;
  //     assembly {
  //         aKey := privateKey
  //     }

  //     bytes1 newByte = bytes1(uint8(aKey[0]) + offset);

  //     bytes32 result;
  //     assembly {
  //         result := mstore(add(aKey, 1), newByte)
  //     }
  //     return result;
  //   }
  function getDerivedKey(AttestationsFoundryTest.KeyOffsets offset, uint256 privateKey)
    public
    pure
    returns (uint256)
  {
    bytes32 aKey = bytes32(privateKey);
    bytes1 firstByte = aKey[0];
    bytes1 newByte = bytes1(uint8(firstByte) + uint8(offset));

    bytes32 shiftedKey = aKey >> 8; // Shift right to remove the first byte
    bytes32 result = (shiftedKey << 8) | bytes32(newByte); // Add the new byte

    return uint256(result);
  }

  function getAddressFromPrivateKey(uint256 privateKey) public returns (address) {
    return vm.addr(privateKey);
  }

  function activateAddress(address account, uint256 tokenBalance) public {
    mockERC20Token.mint(account, tokenBalance);
    otherMockERC20Token.mint(account, tokenBalance);
    vm.prank(account);
    accounts.createAccount();
  }

  function getParsedSignatureOfAddress(address _address, uint256 privateKey)
    public
    returns (uint8, bytes32, bytes32)
  {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function prepareAccount(address account, uint256 accountPK) public {
    mockERC20Token.mint(account, 10 ether);
    otherMockERC20Token.mint(account, 10 ether);
    vm.prank(account);
    accounts.createAccount();

    uint256 derivedValidatingPK = getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, accountPK);
    (uint8 vValidating, bytes32 rValidating, bytes32 sValidating) = getParsedSignatureOfAddress(
      account,
      derivedValidatingPK
    );

    uint256 derivedAttestationPK = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, accountPK);
    (uint8 vAttestation, bytes32 rAttestation, bytes32 sAttestation) = getParsedSignatureOfAddress(
      account,
      derivedAttestationPK
    );

    vm.prank(account);
    accounts.authorizeAttestationSigner(
      getAddressFromPrivateKey(derivedValidatingPK),
      vValidating,
      rValidating,
      sValidating
    );
    vm.prank(account);
    accounts.authorizeAttestationSigner(
      getAddressFromPrivateKey(derivedAttestationPK),
      vAttestation,
      rAttestation,
      sAttestation
    );
  }

  function setUp() public {
    phoneHash = keccak256(abi.encodePacked(phoneNumber));

    attestationsTest = new AttestationsTest();
    mockERC20Token = new MockERC20Token();
    otherMockERC20Token = new MockERC20Token();
    mockElection = new MockElection();
    mockLockedGold = new MockLockedGold();
    mockValidators = new MockValidators();
    random = new MockRandom();
    registry = new Registry(true);
    accounts = new Accounts(true);
    random.initialize(256);
    random.addTestRandomness(0, bytes32(0));
    accounts.initialize(address(registry));
    registry.setAddressFor("Validators", address(mockValidators));

    (caller, callerPK) = actorWithPK("caller");
    (caller2, callerPK2) = actorWithPK("caller2");
    (caller3, callerPK3) = actorWithPK("caller3");

    prepareAccount(caller, callerPK);
    prepareAccount(caller2, callerPK2);
    prepareAccount(caller3, callerPK3);

    address[] memory electedValidators = new address[](1);
    electedValidators[0] = getAddressFromPrivateKey(
      getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, callerPK)
    );
    mockElection.setElectedValidators(electedValidators);

    registry.setAddressFor("Election", address(mockElection));
    registry.setAddressFor("LockedGold", address(mockLockedGold));
    registry.setAddressFor("Random", address(random));
    registry.setAddressFor("Accounts", address(accounts));

    address[] memory mockTokens = new address[](2);
    mockTokens[0] = address(mockERC20Token);
    mockTokens[1] = address(otherMockERC20Token);

    uint256[] memory attestationsFees = new uint256[](2);
    attestationsFees[0] = attestationFee;
    attestationsFees[1] = attestationFee;

    attestationsTest.initialize(
      address(registry),
      attestationExpiryBlocks,
      selectIssuersWaitBlocks,
      maxAttestations,
      mockTokens,
      attestationsFees
    );

    attestationsTest.__setValidators(electedValidators);
  }

  function setAccountWalletAddress() public {
    accounts.setWalletAddress(caller, 0, bytes32(0), bytes32(0));
  }
}

contract AttestationsInitialize is AttestationsFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldHaveSetAttestationExpiryBlocks() public {
    assertEq(attestationsTest.attestationExpiryBlocks(), attestationExpiryBlocks);
  }

  function test_ShouldHaveSetTheFee() public {
    assertEq(attestationsTest.attestationRequestFees(address(mockERC20Token)), attestationFee);
    assertEq(attestationsTest.attestationRequestFees(address(otherMockERC20Token)), attestationFee);
  }

  function test_ShouldNotBeCallableAgain() public {
    vm.expectRevert("contract already initialized");
    attestationsTest.initialize(
      address(registry),
      attestationExpiryBlocks,
      selectIssuersWaitBlocks,
      maxAttestations,
      new address[](0),
      new uint256[](0)
    );
  }
}

contract AttestationsSetAttestationsExpirySeconds is AttestationsFoundryTest {
  uint256 newMaxNumBlocksPerAttestation = attestationExpiryBlocks + 1;

  function setUp() public {
    super.setUp();
  }

  function test_SetAttestationsExpiryBlocks() public {
    attestationsTest.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation);
    assertEq(attestationsTest.attestationExpiryBlocks(), newMaxNumBlocksPerAttestation);
  }

  function test_ShouldEmitAttestationExpiryBlocksSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit AttestationExpiryBlocksSet(newMaxNumBlocksPerAttestation);
    attestationsTest.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation);
  }

  function test_ShouldRevertWhenSetByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonIssuer);
    attestationsTest.setAttestationExpiryBlocks(newMaxNumBlocksPerAttestation);
  }
}

contract AttestationsSetAttestationsRequestFee is AttestationsFoundryTest {
  uint256 newAttestationFee = attestationExpiryBlocks + 1;

  function setUp() public {
    super.setUp();
  }

  function test_SetAttestationsRequestFee() public {
    attestationsTest.setAttestationRequestFee(address(mockERC20Token), newAttestationFee);
    assertEq(attestationsTest.getAttestationRequestFee(address(mockERC20Token)), newAttestationFee);
  }

  function test_ShouldRevertWhenSetTo0() public {
    vm.expectRevert("You have to specify a fee greater than 0");
    attestationsTest.setAttestationRequestFee(address(mockERC20Token), 0);
  }

  function test_ShouldEmitAttestationRequestFeeSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit AttestationRequestFeeSet(address(mockERC20Token), newAttestationFee);
    attestationsTest.setAttestationRequestFee(address(mockERC20Token), newAttestationFee);
  }

  function test_ShouldRevertWhenSetByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonIssuer);
    attestationsTest.setAttestationRequestFee(address(mockERC20Token), newAttestationFee);
  }
}

contract AttestationsSetSelectedIssuersWaitBlock is AttestationsFoundryTest {
  uint256 newSelectIssuersWaitBlocks = selectIssuersWaitBlocks + 1;

  function setUp() public {
    super.setUp();
  }

  function test_SelectedIssuersWaitBlock() public {
    attestationsTest.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks);
    assertEq(attestationsTest.selectIssuersWaitBlocks(), newSelectIssuersWaitBlocks);
  }

  function test_ShouldEmitAttestationRequestFeeSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit SelectIssuersWaitBlocksSet(newSelectIssuersWaitBlocks);
    attestationsTest.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks);
  }

  function test_ShouldRevertWhenSetByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonIssuer);
    attestationsTest.setSelectIssuersWaitBlocks(newSelectIssuersWaitBlocks);
  }
}

contract AttestationsSetMaxAttestations is AttestationsFoundryTest {
  uint256 newMaxAttestations = maxAttestations + 1;

  function setUp() public {
    super.setUp();
  }

  function test_SelectedIssuersWaitBlock() public {
    attestationsTest.setMaxAttestations(newMaxAttestations);
    assertEq(attestationsTest.maxAttestations(), newMaxAttestations);
  }

  function test_ShouldEmitAttestationRequestFeeSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit MaxAttestationsSet(newMaxAttestations);
    attestationsTest.setMaxAttestations(newMaxAttestations);
  }

  function test_ShouldRevertWhenSetByNonOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonIssuer);
    attestationsTest.setMaxAttestations(newMaxAttestations);
  }
}
