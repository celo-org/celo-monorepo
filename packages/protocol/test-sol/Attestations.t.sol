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
import "forge-std/console.sol";

contract AttestationsFoundryTest is Test {
  enum KeyOffsets {
    NO_OFFSET,
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
  address caller4;
  uint256 callerPK4;
  address caller5;
  uint256 callerPK5;
  address nonIssuer = actor("nonIssuer");
  string phoneNumber = "+18005551212";
  bytes32 phoneHash;

  uint256 attestationsRequested = 3;
  uint256 attestationExpiryBlocks = (60 * 60) / 5;
  uint256 selectIssuersWaitBlocks = 4;
  uint256 maxAttestations = 20;
  uint256 attestationFee = 0.5 ether;

  mapping(address => uint256) public privateKeys;

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

  // offsets first byte of the original private key and creates new private key
  function getDerivedKey(KeyOffsets offset, uint256 privateKey) public pure returns (uint256) {
    // Isolate the first byte
    uint8 firstByte = uint8(privateKey >> 248);
    // Add the offset
    firstByte += uint8(offset);

    uint256 mask = 0x00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    uint256 clearedPrivateKey = privateKey & mask;
    // Add the byte back to the private key at the beginning
    uint256 result = clearedPrivateKey | (uint256(firstByte) << 248);
    return result;
  }

  function uint256ToHexString(uint256 number) public pure returns (string memory) {
    if (number == 0) {
      return "0x0";
    }
    // Maximum uint256 value is 78 digits in hexadecimal.
    bytes memory buffer = new bytes(78);
    uint256 length = 0;
    while (number != 0) {
      buffer[length++] = bytes16("0123456789abcdef")[number & 0xf];
      number >>= 4;
    }
    bytes memory str = new bytes(length + 2);
    str[0] = "0";
    str[1] = "x";
    for (uint256 i = 0; i < length; ++i) {
      str[i + 2] = buffer[length - 1 - i];
    }
    return string(str);
  }

  function getAddressFromPrivateKey(uint256 privateKey) public pure returns (address) {
    return vm.addr(privateKey);
  }

  function activateAddress(address account, uint256 tokenBalance) public {
    mockERC20Token.mint(account, tokenBalance);
    otherMockERC20Token.mint(account, tokenBalance);
    vm.prank(account);
    accounts.createAccount();
  }

  function requestAttestations(address account) public {
    vm.startPrank(account);
    attestationsTest.request(phoneHash, attestationsRequested, address(mockERC20Token));
    uint256 requestBlockNumber = block.number;
    random.addTestRandomness(requestBlockNumber + selectIssuersWaitBlocks, bytes32(uint256(1)));
    attestationsTest.selectIssuers(phoneHash);
    vm.stopPrank();
  }

  function getVerificationCodeSignature(address account, uint256 issuerPK, bytes32 identifier)
    public
    pure
    returns (uint8 v, bytes32 r, bytes32 s)
  {
    uint256 derivedPK = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, issuerPK);
    bytes32 attestationMessage = keccak256(abi.encodePacked(identifier, account));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(attestationMessage);

    return vm.sign(derivedPK, prefixedHash);
  }

  function getIssuer(address account, bytes32 identifier) public view returns (address) {
    address[] memory issuers = attestationsTest.getAttestationIssuers(identifier, account);
    return issuers[0];
  }

  function requestAndCompleteAttestations(address account, uint256 accountPK) public {
    requestAttestations(account);
    vm.startPrank(account);
    console.log("we are talking about account", account);
    address returnedIssuer = getIssuer(account, phoneHash);

    console.log("issuer returned", returnedIssuer);
    uint256 returnedIssuerPK = privateKeys[returnedIssuer];
    require(returnedIssuerPK != 0, "issuer not found");

    (uint8 v, bytes32 r, bytes32 s) = getVerificationCodeSignature(
      account,
      returnedIssuerPK,
      phoneHash
    );

    attestationsTest.complete(phoneHash, v, r, s);
    vm.stopPrank();
  }

  function getParsedSignatureOfAddress(address _address, uint256 privateKey)
    public
    pure
    returns (uint8, bytes32, bytes32)
  {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function prepareAccount(address account, uint256 accountPK) public {
    mockERC20Token.mint(account, 10 ether);
    otherMockERC20Token.mint(account, 10 ether);
    vm.startPrank(account);
    accounts.createAccount();
    vm.stopPrank();
    address validatingAddress = unlockDerivedValidator(account, accountPK);
    address attestationAddress = unlockDerivedAttestator(account, accountPK);

    console.log("for account", account);
    console.log("validatingAddress", validatingAddress);
    console.log("attestationAddress", attestationAddress);
    console.log("confirmedValidator", accounts.validatorSignerToAccount(validatingAddress));
    console.log("confirmedAttestattor", accounts.attestationSignerToAccount(attestationAddress));

  }

  function unlockDerivedAttestator(address account, uint256 accountPK) public returns (address) {
    vm.startPrank(account);
    uint256 derivedAttestationPK = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, accountPK);
    (uint8 vAttestation, bytes32 rAttestation, bytes32 sAttestation) = getParsedSignatureOfAddress(
      account,
      derivedAttestationPK
    );

    address attestationAddress = getAddressFromPrivateKey(derivedAttestationPK);

    accounts.authorizeAttestationSigner(
      attestationAddress,
      vAttestation,
      rAttestation,
      sAttestation
    );
    vm.stopPrank();
    return attestationAddress;

  }

  function unlockDerivedValidator(address account, uint256 accountPK) public returns (address) {
    vm.startPrank(account);
    uint256 derivedValidatingPK = getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, accountPK);
    (uint8 vValidating, bytes32 rValidating, bytes32 sValidating) = getParsedSignatureOfAddress(
      account,
      derivedValidatingPK
    );

    address validatingAddress = getAddressFromPrivateKey(derivedValidatingPK);

    accounts.authorizeValidatorSigner(validatingAddress, vValidating, rValidating, sValidating);
    vm.stopPrank();
    return validatingAddress;
  }

  function unlockDerivedVoter(address account, uint256 accountPK) public returns (address) {
    vm.startPrank(account);
    uint256 derivedVotingPK = getDerivedKey(KeyOffsets.VOTING_KEY_OFFSET, accountPK);
    (uint8 vVoting, bytes32 rVoting, bytes32 sVoting) = getParsedSignatureOfAddress(
      account,
      derivedVotingPK
    );

    address votingAddress = getAddressFromPrivateKey(derivedVotingPK);

    accounts.authorizeVoteSigner(votingAddress, vVoting, rVoting, sVoting);

    vm.stopPrank();
    return votingAddress;
  }

  function unlockDerivedValidator2(address account, uint256 accountPK) public returns (address) {
    vm.startPrank(account);
    uint256 derivedValidatingPK = getDerivedKey(KeyOffsets.NEW_VALIDATING_KEY_OFFSET, accountPK);
    (uint8 vValidating, bytes32 rValidating, bytes32 sValidating) = getParsedSignatureOfAddress(
      account,
      derivedValidatingPK
    );

    address validatingAddress = getAddressFromPrivateKey(derivedValidatingPK);

    accounts.authorizeValidatorSigner(validatingAddress, vValidating, rValidating, sValidating);
    vm.stopPrank();
    return validatingAddress;
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

    uint256 _callerPK = 0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d;

    caller = getAddressFromPrivateKey(_callerPK);
    callerPK = _callerPK;

    // (caller, callerPK) = actorWithPK("caller");
    (caller2, callerPK2) = actorWithPK("caller2");
    (caller3, callerPK3) = actorWithPK("caller3");
    (caller4, callerPK4) = actorWithPK("caller4");
    (caller5, callerPK5) = actorWithPK("caller5");
    console.log("caller", caller);
    console.log("caller2", caller2);
    console.log("caller3", caller3);
    console.log("caller4", caller4);
    console.log("caller5", caller5);

    privateKeys[caller] = callerPK;
    privateKeys[caller2] = callerPK2;
    privateKeys[caller3] = callerPK3;
    privateKeys[caller4] = callerPK4;
    privateKeys[caller5] = callerPK5;

    mockERC20Token.mint(address(this), 10 ether);

    prepareAccount(caller, callerPK);
    prepareAccount(caller2, callerPK2);
    prepareAccount(caller3, callerPK3);
    prepareAccount(caller4, callerPK4);
    prepareAccount(caller5, callerPK5);

    address[] memory electedValidators = new address[](5);
    electedValidators[0] = getAddressFromPrivateKey(
      getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, callerPK)
    );
    electedValidators[1] = getAddressFromPrivateKey(
      getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, callerPK2)
    );
    electedValidators[2] = getAddressFromPrivateKey(
      getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, callerPK3)
    );
    electedValidators[3] = getAddressFromPrivateKey(
      getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, callerPK4)
    );
    electedValidators[4] = getAddressFromPrivateKey(
      getDerivedKey(KeyOffsets.VALIDATING_KEY_OFFSET, callerPK5)
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

contract AttestationsWithdraw is AttestationsFoundryTest {
  address issuer;

  function setUp() public {
    super.setUp();
    requestAndCompleteAttestations(caller, callerPK);
    issuer = getIssuer(caller, phoneHash);
    mockERC20Token.mint(address(attestationsTest), attestationFee);
  }

  function test_ShouldRemoveTHeBlaanceOfAVailabelRewardsForTheIssuerFromIssuer() public {
    vm.prank(issuer);
    attestationsTest.withdraw(address(mockERC20Token));
    assertEq(attestationsTest.pendingWithdrawals(address(mockERC20Token), issuer), 0);
  }

  function test_ShouldRemoveTheBalanceOfAvailiableREwardsForTheIssuerFromAttestationSigner()
    public
  {
    address signer = accounts.getAttestationSigner(issuer);
    vm.prank(signer);
    attestationsTest.withdraw(address(mockERC20Token));
    assertEq(attestationsTest.pendingWithdrawals(address(mockERC20Token), issuer), 0);
  }

  function test_ShouldRevertFromNonAttestationSignerOrIssuerAccount() public {
    address voterSigner = unlockDerivedVoter(caller, callerPK);
    address contractVoterSigner = accounts.getVoteSigner(caller);
    assertEq(voterSigner, contractVoterSigner);
    vm.expectRevert("not active authorized signer for role");
    vm.prank(voterSigner);
    attestationsTest.withdraw(address(mockERC20Token));
  }

  function test_ShouldEmitTheWithdrawalEvent() public {
    vm.expectEmit(true, true, true, true);
    emit Withdrawal(issuer, address(mockERC20Token), attestationFee);
    vm.prank(issuer);
    attestationsTest.withdraw(address(mockERC20Token));
  }

  function test_ShouldNotAllowSomeoneWithNoPendingWithdrawalsToWithdraw() public {
    vm.expectRevert("value was negative/zero");
    vm.prank(caller);
    attestationsTest.withdraw(address(mockERC20Token));
  }
}

contract AttestationsLookupAccountsForIdentifier is AttestationsFoundryTest {
  address issuer;

  function setUp() public {
    super.setUp();
    requestAttestations(caller);
  }

  function test_WhenAccountHasAClaim_ItDoesNotReturnTheUsersAccount() public {
    vm.prank(caller);
    assertEq(attestationsTest.lookupAccountsForIdentifier(phoneHash).length, 0);
  }

  // function test_WhenAccountHasAnAttestation_ItDoesNotReturnTheUsersAccount() public {
  //   vm.prank(caller);
  //   assertEq(attestationsTest.lookupAccountsForIdentifier(phoneHash).length, 0);
  // }

}
