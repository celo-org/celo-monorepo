// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/test/AttestationsTest.sol";
import "@celo-contracts/identity/test/MockERC20Token.sol";
import "@celo-contracts/identity/test/MockRandom.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";

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
    bytes32 indexed identifier,
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

  function getVerificationCodeSignature(
    address account,
    uint256 issuerPK,
    bytes32 identifier
  ) public pure returns (uint8 v, bytes32 r, bytes32 s) {
    uint256 derivedPK = getDerivedKey(KeyOffsets.ATTESTING_KEY_OFFSET, issuerPK);
    bytes32 attestationMessage = keccak256(abi.encodePacked(identifier, account));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(attestationMessage);

    return vm.sign(derivedPK, prefixedHash);
  }

  function getIssuer(address account, bytes32 identifier) public view returns (address) {
    address[] memory issuers = attestationsTest.getAttestationIssuers(identifier, account);
    return issuers[0];
  }

  function completeAttestations(address account) public {
    vm.startPrank(account);
    address returnedIssuer = getIssuer(account, phoneHash);

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

  function requestAndCompleteAttestations(address account) public {
    requestAttestations(account);
    completeAttestations(account);
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
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
    unlockDerivedValidator(account, accountPK);
    unlockDerivedAttestator(account, accountPK);
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

    (caller, callerPK) = actorWithPK("caller");
    (caller2, callerPK2) = actorWithPK("caller2");
    (caller3, callerPK3) = actorWithPK("caller3");
    (caller4, callerPK4) = actorWithPK("caller4");
    (caller5, callerPK5) = actorWithPK("caller5");

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

  function setAccountWalletAddress(address account) public {
    vm.prank(account);
    accounts.setWalletAddress(account, 0, bytes32(0), bytes32(0));
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

  function test_Emits_AttestationExpiryBlocksSetEvent() public {
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

  function test_Emits_AttestationRequestFeeSetEvent() public {
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

  function test_Emits_AttestationRequestFeeSetEvent() public {
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

  function test_Emits_AttestationRequestFeeSetEvent() public {
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
    requestAndCompleteAttestations(caller);
    issuer = getIssuer(caller, phoneHash);
    mockERC20Token.mint(address(attestationsTest), attestationFee);
  }

  function test_ShouldRemoveTheBalanceOfAvailableRewardsForTheIssuerFromIssuer() public {
    vm.prank(issuer);
    attestationsTest.withdraw(address(mockERC20Token));
    assertEq(attestationsTest.pendingWithdrawals(address(mockERC20Token), issuer), 0);
  }

  function test_ShouldRemoveTheBalanceOfAvailableRewardsForTheIssuerFromAttestationSigner() public {
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

  function test_Emits_TheWithdrawalEvent() public {
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
  function setUp() public {
    super.setUp();
    requestAttestations(caller);
  }

  function setAccountWalletAddress(address account) public {
    vm.prank(account);
    accounts.setWalletAddress(account, 0, bytes32(0), bytes32(0));
  }

  function test_WhenAccountHasAClaim_ItDoesNotReturnTheUsersAccount() public {
    vm.prank(caller);
    assertEq(attestationsTest.lookupAccountsForIdentifier(phoneHash).length, 0);
  }

  function test_WhenAccountHasAnAttestation_WhenUserHasNoWalletAddressMapped_ShouldAllowUserToLookupTheAttestedAccountOfPhoneNumber()
    public
  {
    completeAttestations(caller);

    address[] memory expectedAttestedAccounts = new address[](1);
    expectedAttestedAccounts[0] = caller;

    vm.prank(caller);
    address[] memory attestedAccounts = attestationsTest.lookupAccountsForIdentifier(phoneHash);

    assertEq(attestedAccounts, expectedAttestedAccounts);
  }

  function test_WhenAccountHasAnAttestation_WhenUserHasWalletAddressMapped_ShouldAllowUserToLookupTheAttestedAccountOfPhoneNumber()
    public
  {
    completeAttestations(caller);
    setAccountWalletAddress(caller);

    address[] memory expectedAttestedAccounts = new address[](1);
    expectedAttestedAccounts[0] = caller;

    vm.prank(caller);
    address[] memory attestedAccounts = attestationsTest.lookupAccountsForIdentifier(phoneHash);

    assertEq(attestedAccounts, expectedAttestedAccounts);
  }

  function test_WhenAccountIsNotAttested_ShouldReturnEmptyArrayForPhoneNumber() public {
    address[] memory attestedAccounts = attestationsTest.lookupAccountsForIdentifier(phoneHash);
    assertEq(attestedAccounts.length, 0);
  }
}

contract AttestationsBatchGetAttestationStats is AttestationsFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_WhenAnAccountHasAClaimAndIsMappedWithAddressWallet_DoesNotReturnUserAccount()
    public
  {
    requestAttestations(caller);
    setAccountWalletAddress(caller);

    bytes32[] memory identifiers = new bytes32[](1);
    identifiers[0] = phoneHash;

    vm.prank(caller);
    (
      uint256[] memory matches,
      address[] memory addresses,
      uint64[] memory completed,
      uint64[] memory total
    ) = attestationsTest.batchGetAttestationStats(identifiers);

    assertEq(matches[0], 0);
    assertEq(addresses.length, 0);
    assertEq(completed.length, 0);
    assertEq(total.length, 0);
  }

  function test_WhenAnAccountHasAnAttestation_WHenTheAccountHasAWalletAddressMapped_ShouldAllowUserToLookupTheAttestedAccountOfPhoneNumber()
    public
  {
    requestAndCompleteAttestations(caller);
    setAccountWalletAddress(caller);

    bytes32[] memory identifiers = new bytes32[](1);
    identifiers[0] = phoneHash;

    vm.prank(caller);
    (
      uint256[] memory matches,
      address[] memory addresses,
      uint64[] memory completed,
      uint64[] memory total
    ) = attestationsTest.batchGetAttestationStats(identifiers);

    assertEq(matches.length, 1);
    assertEq(addresses.length, 1);
    assertEq(completed.length, 1);
    assertEq(total.length, 1);

    assertEq(matches[0], 1);
    assertEq(addresses[0], caller);
    assertEq(uint256(completed[0]), 1);
    assertEq(uint256(total[0]), 3);
  }

  function test_WhenAnAccountHasAnAttestation_WHenTheAccountHasAWalletAddressMapped_AndAnotherAccountAlsoHasAnAttestationToTheSamePhoneNumber_ShouldReturnMultipleAttestedAccounts_ShouldReturnMultipleAttestedAccounts()
    public
  {
    requestAndCompleteAttestations(caller);
    setAccountWalletAddress(caller);

    requestAndCompleteAttestations(caller2);
    setAccountWalletAddress(caller2);

    bytes32[] memory identifiers = new bytes32[](1);
    identifiers[0] = phoneHash;

    (
      uint256[] memory matches,
      address[] memory addresses,
      uint64[] memory completed,
      uint64[] memory total
    ) = attestationsTest.batchGetAttestationStats(identifiers);

    assertEq(matches.length, 1);
    assertEq(addresses.length, 2);
    assertEq(completed.length, 2);
    assertEq(total.length, 2);

    assertEq(matches[0], 2);
    assertEq(addresses[0], caller);
    assertEq(addresses[1], caller2);
    assertEq(uint256(completed[0]), 1);
    assertEq(uint256(completed[1]), 1);
    assertEq(uint256(total[0]), 3);
    assertEq(uint256(total[1]), 3);
  }

  function test_WhenAccountHasNoWalletAddressMapped_ReturnsTheUsersAccountWithAZeroAddress()
    public
  {
    requestAndCompleteAttestations(caller);

    bytes32[] memory identifiers = new bytes32[](1);
    identifiers[0] = phoneHash;

    vm.prank(caller);
    (
      uint256[] memory matches,
      address[] memory addresses,
      uint64[] memory completed,
      uint64[] memory total
    ) = attestationsTest.batchGetAttestationStats(identifiers);

    assertEq(matches.length, 1);
    assertEq(addresses.length, 1);
    assertEq(completed.length, 1);
    assertEq(total.length, 1);

    assertEq(matches[0], 1);
    assertEq(addresses[0], address(0));
    assertEq(uint256(completed[0]), 1);
    assertEq(uint256(total[0]), 3);
  }

  function test_WhenAnAccountIsNotClaimed() public {
    bytes32[] memory identifiers = new bytes32[](1);
    identifiers[0] = phoneHash;

    vm.prank(caller);
    (
      uint256[] memory matches,
      address[] memory addresses,
      uint64[] memory completed,
      uint64[] memory total
    ) = attestationsTest.batchGetAttestationStats(identifiers);

    assertEq(matches.length, 1);
    assertEq(addresses.length, 0);
    assertEq(completed.length, 0);
    assertEq(total.length, 0);

    assertEq(matches[0], 0);
  }
}

contract AttestationsRevoke is AttestationsFoundryTest {
  function setUp() public {
    super.setUp();
    requestAndCompleteAttestations(caller);
  }

  function test_ShouldAllowAUserToRevokeTheirAccountForAPhoneNumber() public {
    vm.startPrank(caller);
    attestationsTest.revoke(phoneHash, 0);
    assertEq(attestationsTest.lookupAccountsForIdentifier(phoneHash).length, 0);

    bytes32[] memory identifiers = new bytes32[](1);
    identifiers[0] = phoneHash;

    (
      uint256[] memory matches,
      address[] memory addresses,
      uint64[] memory completed,
      uint64[] memory total
    ) = attestationsTest.batchGetAttestationStats(identifiers);

    assertEq(matches.length, 1);
    assertEq(addresses.length, 0);
    assertEq(completed.length, 0);
    assertEq(total.length, 0);

    vm.stopPrank();
  }
}

contract AttestationsRequireNAttestationRequests is AttestationsFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_WithNoneRequested_DoesNotRevertWhenCalledWith0() public {
    vm.prank(caller);
    attestationsTest.requireNAttestationsRequested(phoneHash, caller, 0);
  }

  function test_WithNoneRequested_DoesRevertWhenCalledWithSomethingElse() public {
    vm.expectRevert("requested attestations does not match expected");
    vm.prank(caller);
    attestationsTest.requireNAttestationsRequested(phoneHash, caller, 2);
  }

  function test_WithSomeRequested_DoesRevertWhenCalledWith0() public {
    requestAttestations(caller);
    vm.expectRevert("requested attestations does not match expected");
    vm.prank(caller);
    attestationsTest.requireNAttestationsRequested(phoneHash, caller, 0);
  }

  function test_WithSomeRequested_DoesRevertWhenCalledWithCorrectNumber() public {
    requestAttestations(caller);
    vm.prank(caller);
    attestationsTest.requireNAttestationsRequested(phoneHash, caller, 3);
  }
}
