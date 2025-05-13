// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/test/AttestationsTest.sol";
import "@celo-contracts/identity/FederatedAttestations.sol";
import "@celo-contracts/identity/test/MockERC20Token.sol";
import "@celo-contracts/identity/test/MockRandom.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockLockedGold.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";

contract FederatedAttestationsFoundryTest is Test {
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
  FederatedAttestations federatedAttestations;

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
  address caller6;
  uint256 callerPK6;
  address caller7;
  uint256 callerPK7;
  address caller8;
  uint256 callerPK8;
  address nonIssuer = actor("nonIssuer");
  string phoneNumber = "+18005551212";
  bytes32 phoneHash;
  string phoneNumber2 = "+18005551213";
  bytes32 phoneHash2;

  uint256 attestationsRequested = 3;
  uint256 attestationExpiryBlocks = (60 * 60) / 5;
  uint256 selectIssuersWaitBlocks = 4;
  uint256 maxAttestations = 20;
  uint256 attestationFee = 0.5 ether;

  uint256 chainId = 31337;
  bytes32 constant AttestationSignerRole = keccak256(abi.encodePacked("celo.org/core/attestation"));
  bytes32 constant RandomRole = keccak256(abi.encodePacked("random"));

  address account1;
  address signer1;
  address issuer1;
  address account2;
  address issuer2;
  address issuer2Singer;
  address issuer2Singer2;
  address issuer3;

  mapping(address => uint256) public privateKeys;

  event EIP712DomainSeparatorSet(bytes32 eip712DomainSeparator);
  event AttestationRegistered(
    bytes32 indexed identifier,
    address indexed issuer,
    address indexed account,
    address signer,
    uint64 issuedOn,
    uint64 publishedOn
  );
  event AttestationRevoked(
    bytes32 indexed identifier,
    address indexed issuer,
    address indexed account,
    address signer,
    uint64 issuedOn,
    uint64 publishedOn
  );

  bytes32 constant EIP712DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

  bytes32 public constant EIP712_OWNERSHIP_ATTESTATION_TYPEHASH =
    keccak256(
      abi.encodePacked(
        "OwnershipAttestation(bytes32 identifier,address issuer,",
        "address account,address signer,uint64 issuedOn)"
      )
    );

  struct Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }

  struct OwnershipAttestations {
    bytes32 identifier;
    address issuer;
    address account;
    address signer;
    uint64 issuedOn;
  }

  struct AttestationTestCase {
    address account;
    address signer;
    uint256 issuedOn;
  }

  struct IdentifierTestCase {
    bytes32 identifier;
    address signer;
  }

  function getSignatureForAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    uint256 issuedOn,
    uint256 privateKeySigner, // This is used to simulate signing in the test environment
    uint256 _chainId,
    address verifyingContract
  ) public pure returns (uint8 v, bytes32 r, bytes32 s) {
    bytes32 dataHash = generateTypedDataHash(
      Domain("FederatedAttestations", "1.0", _chainId, verifyingContract),
      OwnershipAttestations(
        identifier,
        issuer,
        account,
        getAddressFromPrivateKey(privateKeySigner),
        uint64(issuedOn)
      )
    );

    // Simulate the signing of the digest with the provided private key using the EVM function
    (v, r, s) = vm.sign(privateKeySigner, dataHash);

    // Return the signature components
    return (v, r, s);
  }

  function generateTypedDataHash(
    Domain memory domain,
    OwnershipAttestations memory ownershipAttestations
  ) public pure returns (bytes32) {
    bytes32 domainSeparator = structHashEIP712Domain(domain);
    bytes32 ownershipAttestationsHash = getOwnershipAttestation(ownershipAttestations);
    return keccak256(abi.encodePacked("\x19\x01", domainSeparator, ownershipAttestationsHash));
  }

  function structHashEIP712Domain(Domain memory domain) private pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712DOMAIN_TYPEHASH,
          keccak256(bytes(domain.name)),
          keccak256(bytes(domain.version)),
          domain.chainId,
          domain.verifyingContract
        )
      );
  }

  function getOwnershipAttestation(
    OwnershipAttestations memory ownershipAttestations
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712_OWNERSHIP_ATTESTATION_TYPEHASH,
          ownershipAttestations.identifier,
          ownershipAttestations.issuer,
          ownershipAttestations.account,
          ownershipAttestations.signer,
          ownershipAttestations.issuedOn
        )
      );
  }

  function signAndRegisterAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    uint64 issuedOn,
    address signer
  ) public {
    (uint8 v, bytes32 r, bytes32 s) = getSignatureForAttestation(
      identifier,
      issuer,
      account,
      issuedOn,
      privateKeys[signer],
      chainId,
      address(federatedAttestations)
    );

    if (issuer != signer && !accounts.isSigner(issuer, signer, AttestationSignerRole)) {
      vm.prank(issuer);
      accounts.authorizeSigner(signer, AttestationSignerRole);
      vm.prank(signer);
      accounts.completeSignerAuthorization(issuer, AttestationSignerRole);
    }

    vm.prank(issuer);

    federatedAttestations.registerAttestation(
      identifier,
      issuer,
      account,
      signer,
      issuedOn,
      v,
      r,
      s
    );
  }

  function assertAttestationInStorage(
    bytes32 identifier,
    address issuer,
    uint256 attestationIndex,
    address account,
    uint64 issuedOn,
    address signer,
    uint256 identifierIndex
  ) public {
    (address _account, address _signer, uint64 _issuedOn, ) = federatedAttestations
      .identifierToAttestations(identifier, issuer, attestationIndex);

    assertEq(_account, account);
    assertEq(_signer, signer);
    assertEq(uint256(_issuedOn), uint256(issuedOn));

    bytes32 storedIdentifier = federatedAttestations.addressToIdentifiers(
      account,
      issuer,
      identifierIndex
    );
    assertEq(storedIdentifier, identifier);
  }

  function assertAttestationNotInStorage(
    bytes32 identifier,
    address issuer,
    address account,
    uint256 addressIndex,
    uint256 identifierIndex
  ) public {
    vm.expectRevert();
    federatedAttestations.identifierToAttestations(identifier, issuer, addressIndex);
    vm.expectRevert();
    federatedAttestations.addressToIdentifiers(account, issuer, identifierIndex);
  }

  function checkAgainstExpectedAttestations(
    uint256[] memory expectedCountsPerIssuer,
    AttestationTestCase[] memory expectedAttestations,
    uint256 expectedPublishedOnLowerBound,
    uint256[] memory actualCountsPerIssuer,
    address[] memory actualAddresses,
    address[] memory actualSigners,
    uint64[] memory actualIssuedOns,
    uint64[] memory actualPublishedOns
  ) public {
    assertEq(
      actualCountsPerIssuer.length,
      expectedCountsPerIssuer.length,
      "actualCountsPerIssuer.length"
    );
    assertEq(actualAddresses.length, expectedAttestations.length, "actualAddresses.length");
    assertEq(actualSigners.length, expectedAttestations.length, "actualSigners.length");
    assertEq(actualIssuedOns.length, expectedAttestations.length, "actualIssuedOns.length");
    assertEq(actualPublishedOns.length, expectedAttestations.length, "actualPublishedOns.length");

    for (uint256 i = 0; i < expectedAttestations.length; i++) {
      assertEq(actualAddresses[i], expectedAttestations[i].account, "account");
      assertEq(actualSigners[i], expectedAttestations[i].signer, "signer");
      assertEq(actualIssuedOns[i], expectedAttestations[i].issuedOn, "issuedOn");
      assertEq(actualPublishedOns[i] >= expectedPublishedOnLowerBound, true);
    }
  }

  function bytes32ToHexString(bytes32 data) public pure returns (string memory) {
    bytes memory alphabet = "0123456789abcdef";

    bytes memory str = new bytes(64); // Length of hex string is 32 bytes * 2 characters per byte
    for (uint256 i = 0; i < 32; i++) {
      // Takes each half-byte of bytes32 data and finds its ASCII character in the alphabet
      str[i * 2] = alphabet[uint8(data[i] >> 4)];
      str[1 + i * 2] = alphabet[uint8(data[i] & 0x0f)];
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

  function setUp() public {
    phoneHash = keccak256(abi.encodePacked(phoneNumber));
    phoneHash2 = keccak256(abi.encodePacked(phoneNumber2));

    address registryAddress = 0x000000000000000000000000000000000000ce10;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    attestationsTest = new AttestationsTest();
    mockERC20Token = new MockERC20Token();
    otherMockERC20Token = new MockERC20Token();
    mockElection = new MockElection();
    mockLockedGold = new MockLockedGold();
    mockValidators = new MockValidators();
    random = new MockRandom();
    registry = Registry(registryAddress);
    accounts = new Accounts(true);
    federatedAttestations = new FederatedAttestations(true);
    random.initialize(256);
    random.addTestRandomness(0, bytes32(0));
    accounts.initialize(address(registry));
    registry.setAddressFor("Validators", address(mockValidators));

    callerPK = 0xf2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d;
    caller = getAddressFromPrivateKey(callerPK);

    callerPK2 = 0x5d862464fe9303452126c8bc94274b8c5f9874cbd219789b3eb2128075a76f72;
    caller2 = getAddressFromPrivateKey(callerPK2);

    callerPK3 = 0xdf02719c4df8b9b8ac7f551fcb5d9ef48fa27eef7a66453879f4d8fdc6e78fb1;
    caller3 = getAddressFromPrivateKey(callerPK3);

    // (caller, callerPK) = actorWithPK("caller");
    // (caller2, callerPK2) = actorWithPK("caller2");
    // (caller3, callerPK3) = actorWithPK("caller3");
    (caller4, callerPK4) = actorWithPK("caller4");
    (caller5, callerPK5) = actorWithPK("caller5");
    (caller6, callerPK6) = actorWithPK("caller6");
    (caller7, callerPK7) = actorWithPK("caller7");
    (caller8, callerPK8) = actorWithPK("caller8");

    privateKeys[caller] = callerPK;
    privateKeys[caller2] = callerPK2;
    privateKeys[caller3] = callerPK3;
    privateKeys[caller4] = callerPK4;
    privateKeys[caller5] = callerPK5;
    privateKeys[caller6] = callerPK6;
    privateKeys[caller7] = callerPK7;
    privateKeys[caller8] = callerPK8;

    mockERC20Token.mint(address(this), 10 ether);

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

    account1 = caller7;
    signer1 = caller8;
    issuer1 = caller;
    account2 = caller2;
    issuer2 = caller3;
    issuer2Singer = caller4;
    issuer2Singer2 = caller5;
    issuer3 = caller6;

    vm.warp(10 * 60 * 60); // 10 hours
    vm.prank(issuer1);
    accounts.createAccount();
    vm.prank(issuer2);
    accounts.createAccount();
  }

  function setAccountWalletAddress(address account) public {
    vm.prank(account);
    accounts.setWalletAddress(account, 0, bytes32(0), bytes32(0));
  }
}

contract FederatedAttestations_EIP712_Ownership_Attestation_Typehash is
  FederatedAttestationsFoundryTest
{
  function setUp() public {
    super.setUp();
  }

  function test_ShouldHaveSetTheRightTypeHash() public {
    bytes32 expectedTypeHash = keccak256(
      abi.encodePacked(
        "OwnershipAttestation(bytes32 identifier,address issuer,address account,address signer,uint64 issuedOn)"
      )
    );
    assertEq(federatedAttestations.EIP712_OWNERSHIP_ATTESTATION_TYPEHASH(), expectedTypeHash);
  }
}

contract FederatedAttestations_Initialize is FederatedAttestationsFoundryTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldHaveSetOwner() public {
    vm.prank(caller);
    federatedAttestations.initialize();
    assertEq(federatedAttestations.owner(), caller);
  }

  function test_ShouldHaveSetTheEIP712DomainSeparator() public {
    federatedAttestations.initialize();
    bytes32 expectedDomainSeparator = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("FederatedAttestations")),
        keccak256("1.0"),
        chainId,
        address(federatedAttestations)
      )
    );

    assertEq(federatedAttestations.eip712DomainSeparator(), expectedDomainSeparator);
  }

  function test_Emits_TheEIP712DomainSeparatorSet_Event() public {
    bytes32 expectedDomainSeparator = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("FederatedAttestations")),
        keccak256("1.0"),
        chainId,
        address(federatedAttestations)
      )
    );

    vm.expectEmit(true, true, true, true);
    emit EIP712DomainSeparatorSet(expectedDomainSeparator);

    federatedAttestations.initialize();
  }

  function test_ShouldNotBeCallableAgain() public {
    federatedAttestations.initialize();
    vm.expectRevert("contract already initialized");
    federatedAttestations.initialize();
  }
}

contract FederatedAttestations_LookupAttestations is FederatedAttestationsFoundryTest {
  uint256 HOURS_10 = 10 * 60 * 60;

  function setUp() public {
    super.setUp();
    federatedAttestations.initialize();
  }

  function test_WhenIdentifierHasNotBeenRegistered_ShouldReturnEmptyList() public {
    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = caller;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;

    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](0);
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function prepareTest() public {
    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), signer1);
    signAndRegisterAttestation(phoneHash, issuer1, account2, uint64(block.timestamp), signer1);

    signAndRegisterAttestation(
      phoneHash,
      issuer2,
      account1,
      uint64(block.timestamp),
      issuer2Singer
    );
    signAndRegisterAttestation(
      phoneHash,
      issuer2,
      account2,
      uint64(block.timestamp),
      issuer2Singer2
    );
  }

  function getIssuer1Attestations() public view returns (AttestationTestCase[] memory) {
    AttestationTestCase[] memory issuer1Attestations = new AttestationTestCase[](2);
    issuer1Attestations[0] = AttestationTestCase(account1, signer1, HOURS_10);
    issuer1Attestations[1] = AttestationTestCase(account2, signer1, HOURS_10);
    return issuer1Attestations;
  }

  function getIssuer2Attestations() public view returns (AttestationTestCase[] memory) {
    AttestationTestCase[] memory issuer2Attestations = new AttestationTestCase[](2);
    issuer2Attestations[0] = AttestationTestCase(account1, issuer2Singer, HOURS_10);
    issuer2Attestations[1] = AttestationTestCase(account2, issuer2Singer2, HOURS_10);
    return issuer2Attestations;
  }

  function getIssuer2AndIssuer1Attestations() public view returns (AttestationTestCase[] memory) {
    AttestationTestCase[] memory issuer2Attestations = new AttestationTestCase[](4);
    issuer2Attestations[0] = AttestationTestCase(account1, issuer2Singer, HOURS_10);
    issuer2Attestations[1] = AttestationTestCase(account2, issuer2Singer2, HOURS_10);
    issuer2Attestations[2] = AttestationTestCase(account1, signer1, HOURS_10);
    issuer2Attestations[3] = AttestationTestCase(account2, signer1, HOURS_10);
    return issuer2Attestations;
  }

  function getPublishedOnLowerBound() public view returns (uint64) {
    // Set lower bound to (now - 1 hour) in seconds
    return uint64(block.timestamp - 60 * 60);
  }

  function test_WhenIdentifierHasBeenRegistered_ShouldReturnEmptyCountAndListIfNoIssuersSpecified()
    public
  {
    prepareTest();

    address[] memory trustedIssuers = new address[](0);
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](0);
    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](0);
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_ShouldReturnAllAttestationsFromOneIssuer() public {
    prepareTest();

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 2;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      getIssuer1Attestations(),
      getPublishedOnLowerBound(),
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_ShouldReturnEmptyListIfNoAttestationsExistForAnIssuer() public {
    prepareTest();

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer3;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;
    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](0);
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_ShouldReturnAttestationsFromMultipleIssuersInCorrectOrder() public {
    prepareTest();

    address[] memory trustedIssuers = new address[](3);
    trustedIssuers[0] = issuer3;
    trustedIssuers[1] = issuer2;
    trustedIssuers[2] = issuer1;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](3);
    expectedCountsPerIssuer[0] = 0;
    expectedCountsPerIssuer[1] = getIssuer2Attestations().length;
    expectedCountsPerIssuer[2] = getIssuer1Attestations().length;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      getIssuer2AndIssuer1Attestations(),
      getPublishedOnLowerBound(),
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_WhenIdentifierHasBeenRegisteredAndThenRevoked_ShouldReturnEmptyList() public {
    vm.warp(HOURS_10);
    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), signer1);
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;
    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](0);
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }
}

contract FederatedAttestations_LookupIdentifiers is FederatedAttestationsFoundryTest {
  uint256 HOURS_10 = 10 * 60 * 60;

  function setUp() public {
    super.setUp();
    federatedAttestations.initialize();
  }

  function prepareTest_WhenAddressHasBEenRegistered() public {
    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), signer1);
    signAndRegisterAttestation(phoneHash2, issuer1, account1, uint64(block.timestamp), signer1);

    signAndRegisterAttestation(
      phoneHash,
      issuer2,
      account1,
      uint64(block.timestamp),
      issuer2Singer2
    );
    signAndRegisterAttestation(
      phoneHash2,
      issuer2,
      account1,
      uint64(block.timestamp),
      issuer2Singer
    );
  }

  function getIssuer1IdCases() public view returns (IdentifierTestCase[] memory) {
    IdentifierTestCase[] memory issuer1Attestations = new IdentifierTestCase[](2);
    issuer1Attestations[0] = IdentifierTestCase(phoneHash, signer1);
    issuer1Attestations[1] = IdentifierTestCase(phoneHash2, signer1);
    return issuer1Attestations;
  }

  function getIssuer2IdCases() public view returns (IdentifierTestCase[] memory) {
    IdentifierTestCase[] memory issuer2Attestations = new IdentifierTestCase[](2);
    issuer2Attestations[0] = IdentifierTestCase(phoneHash, issuer2Singer2);
    issuer2Attestations[1] = IdentifierTestCase(phoneHash2, issuer2Singer);
    return issuer2Attestations;
  }

  function getIssuer2AndIssuer1IdCasesIdentifiers() public view returns (bytes32[] memory) {
    bytes32[] memory idCasesIdentifiers = new bytes32[](4);
    idCasesIdentifiers[0] = phoneHash;
    idCasesIdentifiers[1] = phoneHash2;
    idCasesIdentifiers[2] = phoneHash;
    idCasesIdentifiers[3] = phoneHash2;
    return idCasesIdentifiers;
  }

  function test_WhenAddressHasNotBeenRegistered() public {
    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) = federatedAttestations
      .lookupIdentifiers(account1, trustedIssuers);
    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;
    assertEq(expectedCountsPerIssuer, countsPerIssuer);
    assertEq(identifiers.length, 0);
  }

  function test_WhenAddressHasBeenRegistered_ItShouldReturnEmptyCountIfNoIssuersSpecifier() public {
    prepareTest_WhenAddressHasBEenRegistered();

    address[] memory trustedIssuers = new address[](0);
    (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) = federatedAttestations
      .lookupIdentifiers(account1, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](0);
    assertEq(expectedCountsPerIssuer, countsPerIssuer);
    assertEq(identifiers.length, 0);
  }

  function test_WhenAddressHasBeenRegistered_ShouldReturnAllIdentifiersFromOneIssuer() public {
    prepareTest_WhenAddressHasBEenRegistered();

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) = federatedAttestations
      .lookupIdentifiers(account1, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 2;
    bytes32[] memory expectedIdentifiers = new bytes32[](2);
    expectedIdentifiers[0] = phoneHash;
    expectedIdentifiers[1] = phoneHash2;
    assertEq(expectedCountsPerIssuer, countsPerIssuer);
    assertEq(identifiers, expectedIdentifiers);
  }

  function test_WhenAddressHasBeenRegistered_ShouldReturnEmptyListIfNoIdentifiersExistForAnIssuerAddress()
    public
  {
    prepareTest_WhenAddressHasBEenRegistered();

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer3;
    (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) = federatedAttestations
      .lookupIdentifiers(account1, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;
    bytes32[] memory expectedIdentifiers = new bytes32[](0);
    assertEq(expectedCountsPerIssuer, countsPerIssuer);
    assertEq(identifiers, expectedIdentifiers);
  }

  function test_WhenAddressHasBeenRegistered_ShouldReturnIdentifiersFromMultipleIssuersInCorrectOrder()
    public
  {
    prepareTest_WhenAddressHasBEenRegistered();

    address[] memory trustedIssuers = new address[](3);
    trustedIssuers[0] = issuer3;
    trustedIssuers[1] = issuer2;
    trustedIssuers[2] = issuer1;
    (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) = federatedAttestations
      .lookupIdentifiers(account1, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](3);
    expectedCountsPerIssuer[0] = 0;
    expectedCountsPerIssuer[1] = getIssuer2IdCases().length;
    expectedCountsPerIssuer[2] = getIssuer1IdCases().length;
    assertEq(countsPerIssuer, expectedCountsPerIssuer, "invalid counts");

    assertEq(identifiers, getIssuer2AndIssuer1IdCasesIdentifiers());
  }

  function test_WhenIdentifierHasBeenRegisteredAndThenRevoked_ShouldReturnEmptyList() public {
    vm.warp(HOURS_10);
    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), signer1);
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) = federatedAttestations
      .lookupIdentifiers(account1, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;
    bytes32[] memory expectedIdentifiers = new bytes32[](0);
    assertEq(expectedCountsPerIssuer, countsPerIssuer);
    assertEq(identifiers, expectedIdentifiers);
  }
}

contract FederatedAttestations_ValidateAttestation is FederatedAttestationsFoundryTest {
  uint256 HOURS_10 = 10 * 60 * 60;

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    super.setUp();
    federatedAttestations.initialize();
  }

  function prepareTest_WithAnAuthorizedSigner(address issuer, address signer) public {
    vm.prank(issuer);
    accounts.authorizeSigner(signer, AttestationSignerRole);
    vm.prank(signer);
    accounts.completeSignerAuthorization(issuer, AttestationSignerRole);
    (v, r, s) = getSignatureForAttestation(
      phoneHash,
      issuer,
      account1,
      uint64(block.timestamp),
      privateKeys[signer],
      chainId,
      address(federatedAttestations)
    );
  }

  function test_WithAnAuthorizedSigner_ShouldReturnSuccessfullyIfAValidSignatureIsUsed() public {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_WithAnAuthorizedSigner_ShouldReturnFalseIfAnInvalidSignatureIsProvided() public {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    (uint8 v2, bytes32 r2, bytes32 s2) = getSignatureForAttestation(
      phoneHash,
      issuer1,
      account1,
      uint64(block.timestamp),
      privateKeys[issuer2],
      chainId,
      address(federatedAttestations)
    );

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v2,
      r2,
      s2
    );
  }

  function test_WithAnAuthorizedSigner_ShouldFailIfTheProvidedIdentifierIsDifferentFromAttestation()
    public
  {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash2,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_WithAnAuthorizedSigner_ShouldFailIfTheProvidedIssuerIsDifferentFromAttestation()
    public
  {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer2,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_WithAnAuthorizedSigner_ShouldFailIfTheProvidedAccountIsDifferentFromAttestation()
    public
  {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account2,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_WithAnAuthorizedSigner_ShouldFailIfTheProviderSignerIsDifferentFromAttestation()
    public
  {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account1,
      issuer2Singer,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_WithAnAuthorizedSigner_ShouldFailIfTheIssuerIssuedOnIsDifferentFromAttestation()
    public
  {
    prepareTest_WithAnAuthorizedSigner(issuer1, signer1);

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp - 1),
      v,
      r,
      s
    );
  }

  function test_ShouldRevertIfTheSignerIsNotAuthorizedAsAnAttestationSignerByTheIssuer() public {
    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_ShouldFailIfTheSignerIsAuthorizedAsADifferentRoleByTheIssuer() public {
    vm.prank(issuer1);
    accounts.authorizeSigner(signer1, RandomRole);
    vm.prank(signer1);
    accounts.completeSignerAuthorization(issuer1, RandomRole);

    vm.expectRevert();
    federatedAttestations.validateAttestationSig(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }
}

contract FederatedAttestations_RegisterAttestation is FederatedAttestationsFoundryTest {
  uint256 HOURS_10 = 10 * 60 * 60;

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    super.setUp();
    federatedAttestations.initialize();

    vm.prank(issuer1);
    accounts.authorizeSigner(signer1, AttestationSignerRole);
    vm.prank(signer1);
    accounts.completeSignerAuthorization(issuer1, AttestationSignerRole);

    (v, r, s) = getSignatureForAttestation(
      phoneHash,
      issuer1,
      account1,
      uint64(block.timestamp),
      privateKeys[signer1],
      chainId,
      address(federatedAttestations)
    );
  }

  function test_Emits_AttestationRegisteredForAValidAttestation() public {
    vm.expectEmit(true, true, true, true);
    emit AttestationRegistered(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      uint64(block.timestamp)
    );

    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_ShouldSucceedIfIssuerIsEqualToSigner() public {
    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), issuer1);
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      issuer1,
      0
    );
  }

  function test_ShouldRevertIfAnInvalidSignatureIsProvided() public {
    (uint8 v2, bytes32 r2, bytes32 s2) = getSignatureForAttestation(
      phoneHash,
      issuer1,
      account1,
      uint64(block.timestamp),
      privateKeys[issuer2],
      chainId,
      address(federatedAttestations)
    );

    vm.expectRevert();
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v2,
      r2,
      s2
    );
  }

  function test_ShouldRevertIfSignerHasBeenDeregistered() public {
    vm.prank(issuer1);
    accounts.removeSigner(signer1, AttestationSignerRole);
    vm.expectRevert("not active authorized signer for role");

    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_ShouldModifyIdentifierToAttestationsAndAddressToIdentifiersAccordingly() public {
    assertAttestationNotInStorage(phoneHash, issuer1, account1, 0, 0);
    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), signer1);
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      0
    );
  }

  function prepareTest_WhenRegisteringASecondAttestations() public {
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_WhenRegisteringASecondAttestations_ShouldModifyIdentifierToAttestationsAndAddressToIdentifiersAccordingly()
    public
  {
    prepareTest_WhenRegisteringASecondAttestations();
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      0
    );
    assertAttestationNotInStorage(phoneHash, issuer1, account2, 1, 0);

    signAndRegisterAttestation(phoneHash, issuer1, account2, uint64(block.timestamp), signer1);
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      1,
      account2,
      uint64(block.timestamp),
      signer1,
      0
    );
  }

  function test_WhenRegisteringASecondAttestations_ShouldRevertIfAnAttestationWithTheSame_Issuer_Identifiers_Account_IsUploadedAgain()
    public
  {
    prepareTest_WhenRegisteringASecondAttestations();

    // Upload the same attestation signed by a different signer, authorized under the same issuer
    vm.prank(issuer1);
    accounts.authorizeSigner(issuer2Singer2, AttestationSignerRole);
    vm.prank(issuer2Singer2);
    accounts.completeSignerAuthorization(issuer1, AttestationSignerRole);

    (uint8 v2, bytes32 r2, bytes32 s2) = getSignatureForAttestation(
      phoneHash,
      issuer1,
      account1,
      uint64(block.timestamp + 1),
      privateKeys[issuer2Singer2],
      chainId,
      address(federatedAttestations)
    );

    vm.expectRevert("Signature is invalid");
    vm.prank(issuer1);
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      issuer2Singer2,
      uint64(block.timestamp),
      v2,
      r2,
      s2
    );
  }

  function test_WhenRegisteringASecondAttestations_ShouldSucceedWithDifferentIdentifier() public {
    prepareTest_WhenRegisteringASecondAttestations();

    signAndRegisterAttestation(phoneHash2, issuer1, account1, uint64(block.timestamp), signer1);
    assertAttestationInStorage(
      phoneHash2,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      1
    );
  }

  function test_WhenRegisteringASecondAttestations_ShouldSucceedWithADifferentIssuer() public {
    prepareTest_WhenRegisteringASecondAttestations();

    signAndRegisterAttestation(
      phoneHash,
      issuer2,
      account1,
      uint64(block.timestamp),
      issuer2Singer2
    );
    assertAttestationInStorage(
      phoneHash,
      issuer2,
      0,
      account1,
      uint64(block.timestamp),
      issuer2Singer2,
      0
    );
  }

  function test_WhenRegisteringASecondAttestations_ShouldSucceedWithADifferentAccount() public {
    prepareTest_WhenRegisteringASecondAttestations();

    signAndRegisterAttestation(phoneHash, issuer1, account2, uint64(block.timestamp), signer1);
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      1,
      account2,
      uint64(block.timestamp),
      signer1,
      0
    );
  }

  function test_ShouldSucceedIfAnyUserAttemptsToRegisterTheAttestationWithAValidSignature() public {
    vm.prank(issuer2);
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_ShouldSucceedIfADifferentAttestationSignerAuthorizedByTheSameIssuerRegistersTheAttestation()
    public
  {
    vm.prank(issuer1);
    accounts.authorizeSigner(issuer2Singer2, AttestationSignerRole);
    vm.prank(issuer2Singer2);
    accounts.completeSignerAuthorization(issuer1, AttestationSignerRole);

    vm.prank(issuer2Singer2);
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );

    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      0
    );
  }

  function test_ShouldSucceedIfTheIssuerSubmitsTheAttestationDirectly() public {
    vm.prank(issuer1);
    federatedAttestations.registerAttestationAsIssuer(phoneHash, account1, uint64(block.timestamp));

    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      issuer1,
      0
    );
  }

  function test_ShouldSucceedIfIssuerIsNotRegisteredInAccounts() public {
    assertEq(accounts.isAccount(address(issuer3)), false);

    vm.prank(issuer3);
    federatedAttestations.registerAttestationAsIssuer(phoneHash, account1, uint64(block.timestamp));

    assertAttestationInStorage(
      phoneHash,
      issuer3,
      0,
      account1,
      uint64(block.timestamp),
      issuer3,
      0
    );
  }

  function test_ShouldRevertIfMAX_ATTESTATIONS_PER_IDENTIFIERHaveAlreadyBeenRegistered() public {
    for (uint256 i = 0; i < federatedAttestations.MAX_ATTESTATIONS_PER_IDENTIFIER(); i++) {
      address actor = actor(string(abi.encodePacked(i)));

      vm.prank(issuer1);
      federatedAttestations.registerAttestationAsIssuer(phoneHash, actor, uint64(block.timestamp));
    }

    vm.expectRevert("Max attestations already registered for identifier");
    vm.prank(issuer1);
    federatedAttestations.registerAttestationAsIssuer(phoneHash, account1, uint64(block.timestamp));
  }

  function test_ShouldRevertIfMAX_IDENTIFIERS_PER_ADDRESSHaveAlreadyBeenRegistered() public {
    for (uint256 i = 0; i < federatedAttestations.MAX_ATTESTATIONS_PER_IDENTIFIER(); i++) {
      bytes32 newIdentifier = keccak256(abi.encodePacked(i));

      vm.prank(issuer1);
      federatedAttestations.registerAttestationAsIssuer(
        newIdentifier,
        account1,
        uint64(block.timestamp)
      );
    }

    vm.expectRevert("Max identifiers already registered for account");
    vm.prank(issuer1);
    federatedAttestations.registerAttestationAsIssuer(phoneHash, account1, uint64(block.timestamp));
  }
}

contract FederatedAttestations_RevokeAttestation is FederatedAttestationsFoundryTest {
  uint256 HOURS_10 = 10 * 60 * 60;

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    super.setUp();
    federatedAttestations.initialize();

    vm.prank(issuer1);
    accounts.authorizeSigner(signer1, AttestationSignerRole);
    vm.prank(signer1);
    accounts.completeSignerAuthorization(issuer1, AttestationSignerRole);

    (v, r, s) = getSignatureForAttestation(
      phoneHash,
      issuer1,
      account1,
      uint64(block.timestamp),
      privateKeys[signer1],
      chainId,
      address(federatedAttestations)
    );

    vm.prank(issuer1);
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }

  function test_ShouldModifyIdentifierToAttestationsAndAddressToIdentifiersAccordingly() public {
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      0
    );
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);
    assertAttestationNotInStorage(phoneHash, issuer1, account1, 0, 0);
  }

  function test_ShouldSucceedWhenRevokedByACurrentSignerOfIssuer() public {
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);
    assertAttestationNotInStorage(phoneHash, issuer1, account1, 0, 0);
  }

  function test_ShouldRevertWhenSIgnerHasBeenDeregistered() public {
    vm.prank(issuer1);
    accounts.removeSigner(signer1, AttestationSignerRole);
    vm.expectRevert("not active authorized signer for role");
    vm.prank(signer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);
  }

  function test_Emits_AnAttestationRevokedEventAfterSuccessfullyRevoking() public {
    vm.expectEmit(true, true, true, true);
    emit AttestationRevoked(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      uint64(block.timestamp)
    );

    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);
  }

  function test_ShouldSucceedIfIssuerIsNotRegisteredInAccounts() public {
    assertEq(accounts.isAccount(address(issuer3)), false);

    vm.prank(issuer3);
    federatedAttestations.registerAttestationAsIssuer(phoneHash, account1, uint64(block.timestamp));

    assertAttestationInStorage(
      phoneHash,
      issuer3,
      0,
      account1,
      uint64(block.timestamp),
      issuer3,
      0
    );

    vm.prank(issuer3);
    federatedAttestations.revokeAttestation(phoneHash, issuer3, account1);
    assertAttestationNotInStorage(phoneHash, issuer3, account1, 0, 0);
  }

  function test_ShouldRevertWhenRevokingAnAttestationThatDoesNotExist() public {
    vm.expectRevert("Attestation to be revoked does not exist");
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, issuer1);
  }

  function test_ShouldSucceedWhenMoreThan1AttestationsAreRegisteredForIdentifierAndIssuer() public {
    signAndRegisterAttestation(phoneHash, issuer1, account2, uint64(block.timestamp), signer1);
    vm.prank(account2);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account2);
    assertAttestationNotInStorage(phoneHash, issuer1, account2, 1, 0);
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      0
    );
  }

  function test_ShouldSucceedWhenMoreThan1IdentifiersAreRegisteredForAccountAndIssuer() public {
    signAndRegisterAttestation(phoneHash2, issuer1, account1, uint64(block.timestamp), signer1);
    vm.prank(account1);
    federatedAttestations.revokeAttestation(phoneHash2, issuer1, account1);
    assertAttestationNotInStorage(phoneHash2, issuer1, account1, 0, 1);
    assertAttestationInStorage(
      phoneHash,
      issuer1,
      0,
      account1,
      uint64(block.timestamp),
      signer1,
      0
    );
  }

  function test_AfterRevokingAnAttestation_ShouldSucceedInRegisteringNewAttestationWithDifferentIdentifier()
    public
  {
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    signAndRegisterAttestation(phoneHash2, issuer1, account1, uint64(block.timestamp), signer1);
  }

  function test_AfterRevokingAnAttestation_ShouldSucceedInRegisteringNewAttestationWithDifferentAccount()
    public
  {
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    signAndRegisterAttestation(phoneHash, issuer1, account2, uint64(block.timestamp), signer1);
  }

  function test_AfterRevokingAnAttestation_ShouldSucceedInRegisteringNewAttestationWithDifferentIssuedOn()
    public
  {
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp + 1), signer1);
  }

  function test_AfterRevokingAnAttestation_ShouldSucceedInRegisteringNewAttestationWithDifferentSigner()
    public
  {
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    signAndRegisterAttestation(
      phoneHash,
      issuer1,
      account1,
      uint64(block.timestamp),
      issuer2Singer2
    );
  }

  function test_ShouldRevertWhenInvalidUserAttemptsToRevokeTheAttestation() public {
    vm.expectRevert("Sender does not have permission to revoke this attestation");
    vm.prank(issuer2);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);
  }

  function test_ShouldFailToRegisterARevokedAttestation() public {
    vm.prank(issuer1);
    federatedAttestations.revokeAttestation(phoneHash, issuer1, account1);

    vm.expectRevert("Attestation has been revoked");
    vm.prank(issuer1);
    federatedAttestations.registerAttestation(
      phoneHash,
      issuer1,
      account1,
      signer1,
      uint64(block.timestamp),
      v,
      r,
      s
    );
  }
}

contract FederatedAttestations_BatchRevokeAttestations is FederatedAttestationsFoundryTest {
  function setUp() public {
    super.setUp();
    federatedAttestations.initialize();

    signAndRegisterAttestation(phoneHash, issuer1, account1, uint64(block.timestamp), signer1);
    signAndRegisterAttestation(
      phoneHash,
      issuer1,
      account2,
      uint64(block.timestamp),
      issuer2Singer
    );
    signAndRegisterAttestation(phoneHash2, issuer1, account2, uint64(block.timestamp), signer1);
  }

  function test_ShouldSucceedIfIssuerBatchRevokesAttestations() public {
    bytes32[] memory attestationsToRevoke = new bytes32[](2);
    attestationsToRevoke[0] = phoneHash;
    attestationsToRevoke[1] = phoneHash2;

    address[] memory accountsToRevoke = new address[](2);
    accountsToRevoke[0] = account1;
    accountsToRevoke[1] = account2;

    vm.prank(issuer1);
    federatedAttestations.batchRevokeAttestations(issuer1, attestationsToRevoke, accountsToRevoke);

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 1;

    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](1);
    expectedAttestations[0] = AttestationTestCase(account2, issuer2Singer, uint64(block.timestamp));
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );

    trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (countsPerIssuer, _accounts, signers, issuedOns, publishedOns) = federatedAttestations
      .lookupAttestations(phoneHash2, trustedIssuers);

    expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;

    expectedAttestations = new AttestationTestCase[](0);

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_ShouldSucceedRegardlessOfOrderOfAttestationsAndIdentifiers() public {
    bytes32[] memory attestationsToRevoke = new bytes32[](2);
    attestationsToRevoke[0] = phoneHash2;
    attestationsToRevoke[1] = phoneHash;

    address[] memory accountsToRevoke = new address[](2);
    accountsToRevoke[0] = account2;
    accountsToRevoke[1] = account1;

    vm.prank(issuer1);
    federatedAttestations.batchRevokeAttestations(issuer1, attestationsToRevoke, accountsToRevoke);

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 1;

    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](1);
    expectedAttestations[0] = AttestationTestCase(account2, issuer2Singer, uint64(block.timestamp));
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );

    trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (countsPerIssuer, _accounts, signers, issuedOns, publishedOns) = federatedAttestations
      .lookupAttestations(phoneHash2, trustedIssuers);

    expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;

    expectedAttestations = new AttestationTestCase[](0);

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_ShouldSucceedIfCurrentlyRegisteredSignerOfIssuerBatchRevokesAttestations() public {
    bytes32[] memory attestationsToRevoke = new bytes32[](2);
    attestationsToRevoke[0] = phoneHash2;
    attestationsToRevoke[1] = phoneHash;

    address[] memory accountsToRevoke = new address[](2);
    accountsToRevoke[0] = account2;
    accountsToRevoke[1] = account1;

    vm.prank(signer1);
    federatedAttestations.batchRevokeAttestations(issuer1, attestationsToRevoke, accountsToRevoke);

    address[] memory trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (
      uint256[] memory countsPerIssuer,
      address[] memory _accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    ) = federatedAttestations.lookupAttestations(phoneHash, trustedIssuers);

    uint256[] memory expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 1;

    AttestationTestCase[] memory expectedAttestations = new AttestationTestCase[](1);
    expectedAttestations[0] = AttestationTestCase(account2, issuer2Singer, uint64(block.timestamp));
    uint256 expectedPublishedOnLowerBound = 0;

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );

    trustedIssuers = new address[](1);
    trustedIssuers[0] = issuer1;
    (countsPerIssuer, _accounts, signers, issuedOns, publishedOns) = federatedAttestations
      .lookupAttestations(phoneHash2, trustedIssuers);

    expectedCountsPerIssuer = new uint256[](1);
    expectedCountsPerIssuer[0] = 0;

    expectedAttestations = new AttestationTestCase[](0);

    checkAgainstExpectedAttestations(
      expectedCountsPerIssuer,
      expectedAttestations,
      expectedPublishedOnLowerBound,
      countsPerIssuer,
      _accounts,
      signers,
      issuedOns,
      publishedOns
    );
  }

  function test_ShouldSucceedIfIssuerIsNotRegisteredInAccounts() public {
    assertEq(accounts.isAccount(address(issuer3)), false);

    vm.prank(issuer3);
    federatedAttestations.registerAttestationAsIssuer(phoneHash, account1, uint64(block.timestamp));

    assertAttestationInStorage(
      phoneHash,
      issuer3,
      0,
      account1,
      uint64(block.timestamp),
      issuer3,
      0
    );

    bytes32[] memory attestationsToRevoke = new bytes32[](1);
    attestationsToRevoke[0] = phoneHash;

    address[] memory accountsToRevoke = new address[](1);
    accountsToRevoke[0] = account1;

    vm.prank(issuer3);
    federatedAttestations.batchRevokeAttestations(issuer3, attestationsToRevoke, accountsToRevoke);

    assertAttestationNotInStorage(phoneHash, issuer3, account1, 0, 0);
  }

  function test_ShouldRevertIfDeregisteredSignerOfIssuerBatchRevokesAttestations() public {
    vm.prank(issuer1);
    accounts.removeSigner(signer1, AttestationSignerRole);
    vm.expectRevert("not active authorized signer for role");

    bytes32[] memory attestationsToRevoke = new bytes32[](2);
    attestationsToRevoke[0] = phoneHash2;
    attestationsToRevoke[1] = phoneHash;

    address[] memory accountsToRevoke = new address[](2);
    accountsToRevoke[0] = account2;
    accountsToRevoke[1] = account1;

    vm.prank(signer1);
    federatedAttestations.batchRevokeAttestations(issuer1, attestationsToRevoke, accountsToRevoke);
  }

  function test_ShouldRevertIfIdentifiersLengthIsNotEqualAccountsLength() public {
    bytes32[] memory attestationsToRevoke = new bytes32[](2);
    attestationsToRevoke[0] = phoneHash2;
    attestationsToRevoke[1] = phoneHash;

    address[] memory accountsToRevoke = new address[](1);
    accountsToRevoke[0] = account2;

    vm.prank(signer1);
    vm.expectRevert("Unequal number of identifiers and accounts");
    federatedAttestations.batchRevokeAttestations(issuer1, attestationsToRevoke, accountsToRevoke);
  }

  function test_ShouldRevertIfOneOfTheIdentifierAccountPairsIsInvalid() public {
    bytes32[] memory attestationsToRevoke = new bytes32[](2);
    attestationsToRevoke[0] = phoneHash2;
    attestationsToRevoke[1] = phoneHash2;

    address[] memory accountsToRevoke = new address[](2);
    accountsToRevoke[0] = account2;
    accountsToRevoke[1] = account1;

    vm.prank(signer1);
    vm.expectRevert("Attestation to be revoked does not exist");
    federatedAttestations.batchRevokeAttestations(issuer1, attestationsToRevoke, accountsToRevoke);
  }
}
