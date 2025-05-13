// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/FixidityLib.sol";
import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/governance/test/MockValidators.sol";

contract AccountsTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  Accounts accounts;
  MockValidators validators;

  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;

  string constant name = "Account";
  string constant metadataURL = "https://www.celo.org";
  string constant otherMetadataURL = "https://clabs.co";

  bytes storageRoot = abi.encodePacked(metadataURL);
  bytes otherStorageRoot = abi.encodePacked(otherMetadataURL);

  bytes constant dataEncryptionKey =
    hex"02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";
  bytes constant longDataEncryptionKey =
    hex"04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0161111111102f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";

  address caller;
  uint256 callerPK;

  address caller2;
  uint256 caller2PK;

  bytes32 constant EIP712DOMAIN_TYPEHASH =
    keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");

  bytes32 public constant EIP712_AUTHORIZE_SIGNER_TYPEHASH =
    keccak256("AuthorizeSigner(address account,address signer,bytes32 role)");

  struct Domain {
    string name;
    string version;
    uint256 chainId;
    address verifyingContract;
  }

  struct AuthorizeSigner {
    address account;
    address signer;
    bytes32 role;
  }

  event AttestationSignerAuthorized(address indexed account, address signer);
  event VoteSignerAuthorized(address indexed account, address signer);
  event ValidatorSignerAuthorized(address indexed account, address signer);
  event SignerAuthorized(address indexed account, address signer, bytes32 indexed role);
  event SignerAuthorizationStarted(address indexed account, address signer, bytes32 indexed role);
  event SignerAuthorizationCompleted(address indexed account, address signer, bytes32 indexed role);
  event AttestationSignerRemoved(address indexed account, address oldSigner);
  event VoteSignerRemoved(address indexed account, address oldSigner);
  event ValidatorSignerRemoved(address indexed account, address oldSigner);
  event IndexedSignerSet(address indexed account, address signer, bytes32 role);
  event IndexedSignerRemoved(address indexed account, address oldSigner, bytes32 role);
  event DefaultSignerSet(address indexed account, address signer, bytes32 role);
  event DefaultSignerRemoved(address indexed account, address oldSigner, bytes32 role);
  event LegacySignerSet(address indexed account, address signer, bytes32 role);
  event LegacySignerRemoved(address indexed account, address oldSigner, bytes32 role);
  event SignerRemoved(address indexed account, address oldSigner, bytes32 indexed role);
  event AccountDataEncryptionKeySet(address indexed account, bytes dataEncryptionKey);
  event AccountNameSet(address indexed account, string name);
  event AccountMetadataURLSet(address indexed account, string metadataURL);
  event AccountWalletAddressSet(address indexed account, address walletAddress);
  event AccountCreated(address indexed account);
  event OffchainStorageRootAdded(address indexed account, bytes url);
  event OffchainStorageRootRemoved(address indexed account, bytes url, uint256 index);
  event PaymentDelegationSet(address indexed beneficiary, uint256 fraction);

  function setUp() public {
    address registryAddress = 0x000000000000000000000000000000000000ce10;

    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);

    accounts = new Accounts(true);
    validators = new MockValidators();

    registry = Registry(registryAddress);

    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("Accounts", address(accounts));

    accounts.initialize(address(registry));
    accounts.setEip712DomainSeparator();

    (caller, callerPK) = actorWithPK("caller");
    (caller2, caller2PK) = actorWithPK("caller2");
  }

  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function assertStorageRoots(
    string memory rootsHex,
    uint256[] memory lengths,
    string[] memory expectedRoots
  ) public {
    assertEq(lengths.length, expectedRoots.length);

    bytes memory roots = bytes(abi.encodePacked(rootsHex));
    uint256 currentIndex = 0;

    for (uint256 i = 0; i < expectedRoots.length; i++) {
      bytes memory root = slice(roots, currentIndex, currentIndex + lengths[i]);
      currentIndex += lengths[i];
      assertEq(string(root), expectedRoots[i]);
    }

    assertEq(roots.length, currentIndex);
  }

  function slice(
    bytes memory data,
    uint256 start,
    uint256 end
  ) internal pure returns (bytes memory) {
    bytes memory part = new bytes(end - start);
    for (uint256 i = 0; i < part.length; i++) {
      part[i] = data[i + start];
    }
    return part;
  }

  function getAddressFromPrivateKey(uint256 privateKey) public pure returns (address) {
    return vm.addr(privateKey);
  }

  function getSignatureForAuthorization(
    address account,
    bytes32 _role,
    uint256 privateKeySigner, // This is used to simulate signing in the test environment
    uint256 _chainId,
    address verifyingContract
  ) public pure returns (uint8 v, bytes32 r, bytes32 s) {
    bytes32 dataHash = generateTypedDataHash(
      Domain("Celo Core Contracts", "1.0", _chainId, verifyingContract),
      AuthorizeSigner(account, getAddressFromPrivateKey(privateKeySigner), _role)
    );

    // Simulate the signing of the digest with the provided private key using the EVM function
    (v, r, s) = vm.sign(privateKeySigner, dataHash);

    // Return the signature components
    return (v, r, s);
  }

  function generateTypedDataHash(
    Domain memory domain,
    AuthorizeSigner memory authorizeSigner
  ) public pure returns (bytes32) {
    bytes32 domainSeparator = structHashEIP712Domain(domain);
    bytes32 authorizeSignerHash = getAuthorizeSigner(authorizeSigner);
    return keccak256(abi.encodePacked("\x19\x01", domainSeparator, authorizeSignerHash));
  }

  function getAuthorizeSigner(
    AuthorizeSigner memory authorizeSigner
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712_AUTHORIZE_SIGNER_TYPEHASH,
          authorizeSigner.account,
          authorizeSigner.signer,
          authorizeSigner.role
        )
      );
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
}

contract AccountsTest_createAccount is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldCreateTheAccount() public {
    assertEq(accounts.isAccount(address(this)), false);
    accounts.createAccount();
    assertEq(accounts.isAccount(address(this)), true);
  }

  function test_Emits_AccountCreatedEvent() public {
    vm.expectEmit(true, true, true, true);
    emit AccountCreated(address(this));
    accounts.createAccount();
  }
}

contract AccountsTest_setAccountDataEncryptionKey is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetDataEncryptionKey() public {
    accounts.setAccountDataEncryptionKey(dataEncryptionKey);
    assertEq(accounts.getDataEncryptionKey(address(this)), dataEncryptionKey);
  }

  function test_ShouldAllowSettingAKeyWithLEadingZeros() public {
    bytes
      memory keyWithLeadingZeros = hex"00000000000000000000000000000000000000000000000f2f48ee19680706191111";
    accounts.setAccountDataEncryptionKey(keyWithLeadingZeros);
    assertEq(accounts.getDataEncryptionKey(address(this)), keyWithLeadingZeros);
  }

  function test_ShouldRevertWhenKeyIsInvalid() public {
    bytes memory invalidKey = hex"321329312493";
    vm.expectRevert(bytes("data encryption key length <= 32"));
    accounts.setAccountDataEncryptionKey(invalidKey);
  }

  function test_ShouldAllowKeyLongerThan33Bytes() public {
    accounts.setAccountDataEncryptionKey(longDataEncryptionKey);
    assertEq(accounts.getDataEncryptionKey(address(this)), longDataEncryptionKey);
  }

  function test_Emits_AccountDataEncryptionKeySet() public {
    vm.expectEmit(true, true, true, true);
    emit AccountDataEncryptionKeySet(address(this), dataEncryptionKey);
    accounts.setAccountDataEncryptionKey(dataEncryptionKey);
  }
}

contract AccountsTest_setAccount is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldSetTheNameDataEncryptionKeyAndWalletAddress_WhenTheAccountHasBeenCreated()
    public
  {
    accounts.createAccount();
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
    assertEq(accounts.getName(address(this)), name);
    assertEq(accounts.getDataEncryptionKey(address(this)), dataEncryptionKey);
    assertEq(accounts.getWalletAddress(address(this)), address(this));
  }

  function test_Emits_AccountNameSetEvent_WhenTheAccountHasBeenCreated() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit AccountNameSet(address(this), name);
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_Emits_AccountDataEncryptionKeySetEvent_WhenTheAccountHasBeenCreated() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit AccountDataEncryptionKeySet(address(this), dataEncryptionKey);
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_Emits_AccountWalletAddressSetEvent_WhenTheAccountHasBeenCreated() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit AccountWalletAddressSet(address(this), address(this));
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_ShouldSetADifferentAddressWithAppropriateSignature_WhenTheAccountHasBeenCreated()
    public
  {
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(address(this), caller2PK);
    accounts.setAccount(name, dataEncryptionKey, caller2, v, r, s);
    assertEq(accounts.getWalletAddress(address(this)), caller2);
  }

  function test_ShouldSetTheNameDataEncryptionKeyAndWalletAddress_WhenTheAccountHasNotBeenCreated()
    public
  {
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
    assertEq(accounts.getName(address(this)), name);
    assertEq(accounts.getDataEncryptionKey(address(this)), dataEncryptionKey);
    assertEq(accounts.getWalletAddress(address(this)), address(this));
    assertEq(accounts.isAccount(address(this)), true);
  }

  function test_Emits_AccountCreated_WhenTheAccountHasNotBeenCreated() public {
    vm.expectEmit(true, true, true, true);
    emit AccountCreated(address(this));
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_Emits_AccountNameSetEvent_WhenTheAccountHasNotBeenCreated() public {
    vm.expectEmit(true, true, true, true);
    emit AccountNameSet(address(this), name);
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_Emits_AccountDataEncryptionKeySetEvent_WhenTheAccountHasNotBeenCreated() public {
    vm.expectEmit(true, true, true, true);
    emit AccountDataEncryptionKeySet(address(this), dataEncryptionKey);
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_Emits_AccountWalletAddressSetEvent_WhenTheAccountHasNotBeenCreated() public {
    vm.expectEmit(true, true, true, true);
    emit AccountWalletAddressSet(address(this), address(this));
    accounts.setAccount(name, dataEncryptionKey, address(this), 0, 0x0, 0x0);
  }

  function test_ShouldRevertWhenIncorrectSignature() public {
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(address(caller), caller2PK);
    vm.prank(caller);
    vm.expectRevert("Invalid signature");
    accounts.setAccount(name, dataEncryptionKey, address(this), v, r, s);
  }
}

contract AccountsTest_setWalletAddress is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldRevert_WhenAccountHasNotBeenCreated() public {
    vm.expectRevert("Unknown account");
    accounts.setWalletAddress(address(this), 0, 0x0, 0x0);
  }

  function test_ShouldSetWalletAddress_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    accounts.setWalletAddress(address(this), 0, 0x0, 0x0);
    assertEq(accounts.getWalletAddress(address(this)), address(this));
  }

  function test_ShouldSetDifferentAddressWithTheAppropriateSignature_WhenAccountHasBeenCreated()
    public
  {
    vm.startPrank(caller);
    accounts.createAccount();
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(address(caller), caller2PK);
    accounts.setWalletAddress(caller2, v, r, s);
    assertEq(accounts.getWalletAddress(address(caller)), caller2);
  }

  function test_ShouldSetTheNULLAddress_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    accounts.setWalletAddress(address(0), 0, 0x0, 0x0);
    assertEq(accounts.getWalletAddress(address(this)), address(0));
  }

  function test_Emits_TheAccountWalletAddressSetEvent_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit AccountWalletAddressSet(address(this), address(this));
    accounts.setWalletAddress(address(this), 0, 0x0, 0x0);
  }

  function test_ShouldRevertWithWrongSignatureForADifferentAddress_WhenAccountHasBEenCreated()
    public
  {
    vm.startPrank(caller);
    accounts.createAccount();
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(address(caller), caller2PK);
    vm.expectRevert("Invalid signature");
    accounts.setWalletAddress(address(this), v, r, s);
  }
}

contract AccountsTest_setMetadataURL is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldRevert_WhenAccountHasNotBeenCreated() public {
    vm.expectRevert("Unknown account");
    accounts.setMetadataURL(metadataURL);
  }

  function test_ShouldSetMetadatURL_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    accounts.setMetadataURL(metadataURL);
    assertEq(accounts.getMetadataURL(address(this)), metadataURL);
  }

  function test_Emits_TheAccountMetadataURLSetEvent() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit AccountMetadataURLSet(address(this), metadataURL);
    accounts.setMetadataURL(metadataURL);
  }
}

contract AccountsTest_batchGetMetadataURL is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function parseSolidityStringArray(
    uint256[] memory stringLengths,
    bytes memory data
  ) private pure returns (string[] memory) {
    string[] memory strings = new string[](stringLengths.length);
    uint256 offset = 0;

    for (uint256 i = 0; i < stringLengths.length; i++) {
      bytes memory stringBytes = new bytes(stringLengths[i]);
      for (uint256 j = 0; j < stringLengths[i]; j++) {
        stringBytes[j] = data[offset + j];
      }
      strings[i] = string(stringBytes);
      offset += stringLengths[i];
    }

    return strings;
  }

  function test_ShouldReturnTheMetadataURLs() public {
    accounts.createAccount();
    accounts.setMetadataURL(metadataURL);
    vm.prank(caller2);
    accounts.createAccount();
    vm.prank(caller2);
    accounts.setMetadataURL(otherMetadataURL);

    address[] memory addresses = new address[](2);
    addresses[0] = address(this);
    addresses[1] = address(caller2);

    string[] memory urlStrings = new string[](2);
    urlStrings[0] = metadataURL;
    urlStrings[1] = otherMetadataURL;

    (uint256[] memory sizes, bytes memory data) = accounts.batchGetMetadataURL(addresses);

    string[] memory returnedStrings = parseSolidityStringArray(sizes, data);

    for (uint256 i = 0; i < returnedStrings.length; i++) {
      assertEq(returnedStrings[i], urlStrings[i]);
    }
  }
}

contract AccountsTest_addStorageRoot is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldRevert_WhenAccountHasNotBeenCreated() public {
    vm.expectRevert("Unknown account");
    accounts.addStorageRoot(storageRoot);
  }

  function test_ShouldAddANewStorageRoot_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    accounts.addStorageRoot(bytes(storageRoot));
    (bytes memory concatenated, uint256[] memory length) = accounts.getOffchainStorageRoots(
      address(this)
    );

    string[] memory urls = new string[](1);
    urls[0] = metadataURL;

    assertStorageRoots(string(concatenated), length, urls);
  }

  function test_Emits_TheOffchainStorageRootAddedEvent_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit OffchainStorageRootAdded(address(this), bytes(metadataURL));
    accounts.addStorageRoot(bytes(metadataURL));
  }

  function test_ShouldAddMultipleStorageRoots_WhenAccountHasBeenCreated() public {
    accounts.createAccount();
    accounts.addStorageRoot(bytes(metadataURL));
    accounts.addStorageRoot(bytes(otherMetadataURL));
    (bytes memory concatenated, uint256[] memory length) = accounts.getOffchainStorageRoots(
      address(this)
    );

    string[] memory urls = new string[](2);
    urls[0] = metadataURL;
    urls[1] = otherMetadataURL;

    assertStorageRoots(string(concatenated), length, urls);
  }
}

contract AccountsTest_removeStorageRoot is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldRevert_WhenAccountHasNotBeenCreated() public {
    vm.expectRevert("Unknown account");
    accounts.removeStorageRoot(0);
  }

  function test_ShouldRevertWithMessage_WhenThereAreNoStorageRootsAndAccountHasBeenCreated()
    public
  {
    accounts.createAccount();
    vm.expectRevert("Invalid storage root index");
    accounts.removeStorageRoot(0);
  }

  function test_ShouldRemoveOneOfTheRoots_WhenThereAreStorageRootsAndAccountHasBeenCreated()
    public
  {
    accounts.createAccount();
    accounts.addStorageRoot(storageRoot);
    accounts.addStorageRoot(otherStorageRoot);
    accounts.removeStorageRoot(0);

    (bytes memory concatenated, uint256[] memory length) = accounts.getOffchainStorageRoots(
      address(this)
    );

    string[] memory urls = new string[](1);
    urls[0] = otherMetadataURL;

    assertStorageRoots(string(concatenated), length, urls);
  }

  function test_ShouldRemoveDifferentRoot_WhenThereAreStorageRootsAndAccountHasBeenCreated()
    public
  {
    accounts.createAccount();
    accounts.addStorageRoot(storageRoot);
    accounts.addStorageRoot(otherStorageRoot);
    accounts.removeStorageRoot(1);

    (bytes memory concatenated, uint256[] memory length) = accounts.getOffchainStorageRoots(
      address(this)
    );

    string[] memory urls = new string[](1);
    urls[0] = metadataURL;

    assertStorageRoots(string(concatenated), length, urls);
  }

  function test_Emits_OffchainStorageRootRemovedEvent_WhenThereAreStorageRootsAndAccountHasBeenCreated()
    public
  {
    accounts.createAccount();
    accounts.addStorageRoot(storageRoot);
    accounts.addStorageRoot(otherStorageRoot);

    vm.expectEmit(true, true, true, true);
    emit OffchainStorageRootRemoved(address(this), bytes(otherMetadataURL), 1);
    accounts.removeStorageRoot(1);

    (bytes memory concatenated, uint256[] memory length) = accounts.getOffchainStorageRoots(
      address(this)
    );

    string[] memory urls = new string[](1);
    urls[0] = metadataURL;

    assertStorageRoots(string(concatenated), length, urls);
  }
}

contract AccountsTest_setPaymentDelegation is AccountsTest {
  address beneficiary = actor("beneficiary");
  uint256 fraction = FixidityLib.newFixedFraction(2, 10).unwrap();
  uint256 badFraction = FixidityLib.newFixedFraction(12, 10).unwrap();

  function setUp() public {
    super.setUp();
  }

  function test_ShouldNotBeCallableByNonAccount() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    accounts.setPaymentDelegation((beneficiary), fraction);
  }

  function test_ShouldSetAnAddressAndAFraction() public {
    accounts.createAccount();
    accounts.setPaymentDelegation(beneficiary, fraction);
    (address realBeneficiary, uint256 realFraction) = accounts.getPaymentDelegation(address(this));
    assertEq(realBeneficiary, beneficiary);
    assertEq(realFraction, fraction);
  }

  function test_Revert_SetPaymentDelegation_WhenL2() public {
    _whenL2();
    accounts.createAccount();
    vm.expectRevert("This method is no longer supported in L2.");
    accounts.setPaymentDelegation(beneficiary, fraction);
  }

  function test_ShouldNotAllowFractionGreaterThan1() public {
    accounts.createAccount();
    vm.expectRevert("Fraction must not be greater than 1");
    accounts.setPaymentDelegation(beneficiary, badFraction);
  }

  function test_ShouldNotAllowABeneficiaryWithNullAddress() public {
    accounts.createAccount();
    vm.expectRevert("Beneficiary cannot be address 0x0");
    accounts.setPaymentDelegation(address(0), badFraction);
  }

  function test_Emits_APaymentDelegationSetEvent() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit PaymentDelegationSet(beneficiary, fraction);
    accounts.setPaymentDelegation(beneficiary, fraction);
  }
}

contract AccountsTest_deletePaymentDelegation is AccountsTest {
  address beneficiary = actor("beneficiary");
  uint256 fraction = FixidityLib.newFixedFraction(2, 10).unwrap();

  function setUp() public {
    super.setUp();
    accounts.createAccount();
    accounts.setPaymentDelegation(beneficiary, fraction);
  }

  function test_ShouldNotBeCallableByNonAccount() public {
    vm.prank(caller);
    vm.expectRevert("Must first register address with Account.createAccount");
    accounts.deletePaymentDelegation();
  }

  function test_ShouldSetTheAddressAndBeneficiaryTo0() public {
    accounts.deletePaymentDelegation();
    (address realBeneficiary, uint256 realFraction) = accounts.getPaymentDelegation(address(this));
    assertEq(realBeneficiary, address(0));
    assertEq(realFraction, 0);
  }

  function test_Emits_APaymentDelegationSetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit PaymentDelegationSet(address(0), 0);
    accounts.deletePaymentDelegation();
  }
}

contract AccountsTest_setName is AccountsTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldNotBeCallableByNonAccount() public {
    vm.expectRevert("Register with createAccount to set account name");
    accounts.setName(name);
  }

  function test_ShouldSetTheName() public {
    accounts.createAccount();
    accounts.setName(name);
    assertEq(accounts.getName(address(this)), name);
  }

  function test_Emits_AccountNameSetEvent() public {
    accounts.createAccount();
    vm.expectEmit(true, true, true, true);
    emit AccountNameSet(address(this), name);
    accounts.setName(name);
  }
}

contract AccountsTest_GenericAuthorization is AccountsTest {
  address account2 = actor("account2");
  address signer;
  uint256 signerPK;
  address signer2;
  uint256 signer2PK;
  bytes32 role = keccak256("Test Role");
  bytes32 role2 = keccak256("Test Role 2");

  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    super.setUp();
    (signer, signerPK) = actorWithPK("signer");
    (signer2, signer2PK) = actorWithPK("signer2");
    (v, r, s) = getSignatureForAuthorization(
      address(this),
      role,
      signerPK,
      31337,
      address(accounts)
    );
    accounts.createAccount();
    vm.prank(account2);
    accounts.createAccount();
  }

  function test_ShouldRecoverTheCorrectSignerFromEIP712Signature() public {
    address recoveredSigner = accounts.getRoleAuthorizationSigner(
      address(this),
      signer,
      role,
      v,
      r,
      s
    );
    assertEq(recoveredSigner, signer);
  }

  function test_ShouldNotCompleteAnAuthorizationThatHasntBeenStarted_WhenSmartContractSigner()
    public
  {
    vm.expectRevert("Signer authorization not started");
    vm.prank(signer);
    accounts.completeSignerAuthorization(address(this), role);
  }

  function test_ShouldNotCompleteAuthorizationThatWasOnlyStarted_WhenSmartContractSigner() public {
    accounts.authorizeSigner(signer, role);
    assertEq(accounts.isSigner(address(this), signer, role), false);
  }

  function test_ShouldSetAuthorizedSignerInTwoSteps_WhenSmartContractSigner() public {
    accounts.authorizeSigner(signer, role);
    vm.prank(signer);
    accounts.completeSignerAuthorization(address(this), role);
    assertEq(accounts.isSigner(address(this), signer, role), true);
    assertEq(accounts.authorizedBy(signer), address(this));
    assertEq(accounts.isAuthorizedSigner(signer), true);
  }

  function test_Emits_TheRightEvents_WhenSmartContractSigner() public {
    vm.expectEmit(true, true, true, true);
    emit SignerAuthorizationStarted(address(this), signer, role);
    accounts.authorizeSigner(signer, role);
    vm.expectEmit(true, true, true, true);
    emit SignerAuthorizationCompleted(address(this), signer, role);
    vm.prank(signer);
    accounts.completeSignerAuthorization(address(this), role);
  }

  function test_ShouldSetAuthorizedSignerInOneStep_WhenEOASigner() public {
    assertEq(accounts.isSigner(address(this), signer, role), false);
    accounts.authorizeSignerWithSignature(signer, role, v, r, s);

    assertEq(accounts.isSigner(address(this), signer, role), true);
    assertEq(accounts.authorizedBy(signer), address(this));
    assertEq(accounts.isAuthorizedSigner(signer), true);
  }

  function test_Emits_TheRightEvents_WhenEOASigner() public {
    vm.expectEmit(true, true, true, true);
    emit SignerAuthorized(address(this), signer, role);
    accounts.authorizeSignerWithSignature(signer, role, v, r, s);
  }

  function test_ShouldRemoveTheAuthorizedSigner() public {
    accounts.authorizeSignerWithSignature(signer, role, v, r, s);
    accounts.removeSigner(signer, role);
    assertEq(accounts.isSigner(address(this), signer, role), false);
  }

  function test_ShouldAuthorizeMultipleSignersForARole() public {
    assertEq(accounts.isSigner(address(this), signer, role), false);
    assertEq(accounts.isSigner(address(this), signer2, role), false);

    accounts.authorizeSignerWithSignature(signer, role, v, r, s);

    (uint8 v2, bytes32 r2, bytes32 s2) = getSignatureForAuthorization(
      address(this),
      role,
      signer2PK,
      31337,
      address(accounts)
    );

    accounts.authorizeSignerWithSignature(signer2, role, v2, r2, s2);

    assertEq(accounts.isSigner(address(this), signer, role), true);
    assertEq(accounts.isSigner(address(this), signer2, role), true);
    assertEq(accounts.authorizedBy(signer), address(this));
    assertEq(accounts.authorizedBy(signer2), address(this));
    assertEq(accounts.isAuthorizedSigner(signer), true);
    assertEq(accounts.isAuthorizedSigner(signer2), true);
  }

  function test_ShouldAuthorizeMultipleSignersForMultipleRoles() public {
    assertEq(accounts.isSigner(address(this), signer, role), false);
    assertEq(accounts.isSigner(address(this), signer2, role2), false);

    accounts.authorizeSignerWithSignature(signer, role, v, r, s);

    (uint8 v2, bytes32 r2, bytes32 s2) = getSignatureForAuthorization(
      address(this),
      role2,
      signer2PK,
      31337,
      address(accounts)
    );

    accounts.authorizeSignerWithSignature(signer2, role2, v2, r2, s2);

    assertEq(accounts.isSigner(address(this), signer, role), true);
    assertEq(accounts.isSigner(address(this), signer2, role2), true);
    assertEq(accounts.authorizedBy(signer), address(this));
    assertEq(accounts.authorizedBy(signer2), address(this));
    assertEq(accounts.isAuthorizedSigner(signer), true);
    assertEq(accounts.isAuthorizedSigner(signer2), true);
  }

  function test_ShouldNotAllowToAuthorizeSignerForTwoAccounts() public {
    accounts.authorizeSignerWithSignature(signer, role, v, r, s);

    (uint8 v2, bytes32 r2, bytes32 s2) = getSignatureForAuthorization(
      account2,
      role,
      signerPK,
      31337,
      address(accounts)
    );

    vm.expectRevert("Invalid signature");
    accounts.authorizeSignerWithSignature(signer, role, v2, r2, s2);
  }

  function test_ShouldSetDefaultSignerForTheRole() public {
    assertEq(accounts.isSigner(address(this), signer, role), false);
    assertEq(accounts.hasDefaultSigner(address(this), role), false);
    assertEq(accounts.getDefaultSigner(address(this), role), address(this));

    vm.expectRevert("Must authorize signer before setting as default");
    accounts.setIndexedSigner(signer, role);

    accounts.authorizeSignerWithSignature(signer, role, v, r, s);
    accounts.setIndexedSigner(signer, role);

    assertEq(accounts.isSigner(address(this), signer, role), true);
    assertEq(accounts.hasDefaultSigner(address(this), role), true);
    assertEq(accounts.getDefaultSigner(address(this), role), signer);
  }

  function test_ShouldRemoveTheDefaultSignerForARole() public {
    accounts.authorizeSignerWithSignature(signer, role, v, r, s);
    accounts.setIndexedSigner(signer, role);
    accounts.removeDefaultSigner(role);

    assertEq(accounts.isSigner(address(this), signer, role), true);
    assertEq(accounts.hasDefaultSigner(address(this), role), false);
    assertEq(accounts.getDefaultSigner(address(this), role), address(this));
  }
}

contract AccountsTest_BackwardCompatibility is AccountsTest {
  address account = address(this);
  address otherAccount = actor("otherAccount");

  address signer;
  uint256 signerPK;
  address signer2;
  uint256 signer2PK;

  enum Role {
    Attestation,
    Vote,
    Validator
  }

  function setUp() public {
    super.setUp();

    (signer, signerPK) = actorWithPK("signer");
    (signer2, signer2PK) = actorWithPK("signer2");

    accounts.createAccount();
  }

  function authorizeSignerFactory(
    address _signer,
    bytes32 _role,
    uint8 _v,
    bytes32 _r,
    bytes32 _s,
    bool expectRevert
  ) public {
    accounts.authorizeSignerWithSignature(_signer, _role, _v, _r, _s);
    if (!expectRevert) {
      accounts.setIndexedSigner(_signer, _role);
    }
  }

  function getSignature(
    address _account,
    bytes32 role,
    uint256 _signerPK,
    bool genericWrite
  ) public view returns (uint8, bytes32, bytes32) {
    if (genericWrite) {
      return getSignatureForAuthorization(_account, role, _signerPK, 31337, address(accounts));
    }

    return getParsedSignatureOfAddress(_account, _signerPK);
  }

  function getRole(Role role) public pure returns (bytes32 _role) {
    if (role == Role.Attestation) {
      _role = keccak256(abi.encodePacked("celo.org/core/attestation"));
    } else if (role == Role.Vote) {
      _role = keccak256(abi.encodePacked("celo.org/core/vote"));
    } else if (role == Role.Validator) {
      _role = keccak256(abi.encodePacked("celo.org/core/validator"));
    }
  }

  function hasAuthorizedSigner(
    Role role,
    address _signer,
    bool genericRead
  ) public view returns (bool) {
    bytes32 _role = getRole(role);
    if (genericRead) {
      return accounts.hasIndexedSigner(_signer, _role);
    } else {
      if (role == Role.Attestation) {
        return accounts.hasAuthorizedAttestationSigner(_signer);
      } else if (role == Role.Vote) {
        return accounts.hasAuthorizedVoteSigner(_signer);
      } else if (role == Role.Validator) {
        return accounts.hasAuthorizedValidatorSigner(_signer);
      }
    }
  }

  function authorize(
    Role role,
    bool genericWrite,
    address _account,
    address _signer,
    uint256 _signerPK
  ) public {
    bytes32 _role = getRole(role);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(_account, _role, _signerPK, genericWrite);
    vm.startPrank(_account);
    if (genericWrite) {
      authorizeSignerFactory(_signer, _role, _v, _r, _s, false);
    } else {
      if (role == Role.Attestation) {
        accounts.authorizeAttestationSigner(_signer, _v, _r, _s);
      } else if (role == Role.Vote) {
        accounts.authorizeVoteSigner(_signer, _v, _r, _s);
      } else if (role == Role.Validator) {
        accounts.authorizeValidatorSigner(_signer, _v, _r, _s);
      }
    }
    vm.stopPrank();
  }

  function removeSigner(bool genericWrite, Role role, address _account) public {
    vm.startPrank(_account);
    bytes32 _role = getRole(role);
    if (genericWrite) {
      address defaultSigner = accounts.getIndexedSigner(_account, _role);
      accounts.removeSigner(defaultSigner, _role);
    } else {
      if (role == Role.Attestation) {
        accounts.removeAttestationSigner();
      } else if (role == Role.Vote) {
        accounts.removeVoteSigner();
      } else if (role == Role.Validator) {
        accounts.removeValidatorSigner();
      }
    }
    vm.stopPrank();
  }

  function getAuthorizedFromAccount(
    Role role,
    bool genericRead,
    address _account
  ) public view returns (address) {
    bytes32 _role = getRole(role);
    if (genericRead) {
      return accounts.getIndexedSigner(_account, _role);
    } else {
      if (role == Role.Attestation) {
        return accounts.getAttestationSigner(_account);
      } else if (role == Role.Vote) {
        return accounts.getVoteSigner(_account);
      } else if (role == Role.Validator) {
        return accounts.getValidatorSigner(_account);
      }
    }
  }

  function authorizedSignerToAccount(
    Role role,
    bool genericRead,
    address _signer
  ) public view returns (address) {
    if (genericRead) {
      return accounts.signerToAccount(_signer);
    } else {
      if (role == Role.Attestation) {
        return accounts.attestationSignerToAccount(_signer);
      } else if (role == Role.Vote) {
        return accounts.voteSignerToAccount(_signer);
      } else if (role == Role.Validator) {
        return accounts.validatorSignerToAccount(_signer);
      }
    }
  }

  function helperShouldSetAuthorizedKey(bool genericRead, bool genericWrite, Role role) public {
    assertEq(hasAuthorizedSigner(role, account, genericRead), false);
    authorize(role, genericWrite, account, signer, signerPK);
    assertEq(accounts.authorizedBy(signer), account);
    assertEq(getAuthorizedFromAccount(role, genericRead, account), signer);
    assertEq(authorizedSignerToAccount(role, genericRead, signer), account);
    assertEq(hasAuthorizedSigner(role, account, genericRead), true);
  }

  function test_ShouldAuthorizeVoteSigningKey_GenericReadFalse_GenericWriteFalse() public {
    helperShouldSetAuthorizedKey(false, false, Role.Vote);
  }

  function test_ShouldAuthorizeVoteSigningKey_GenericReadFalse_GenericWriteTrue() public {
    helperShouldSetAuthorizedKey(false, true, Role.Vote);
  }

  function test_ShouldAuthorizeVoteSigningKey_GenericReadTrue_GenericWriteFalse() public {
    helperShouldSetAuthorizedKey(true, false, Role.Vote);
  }

  function test_ShouldAuthorizeVoteSigningKey_GenericReadTrue_GenericWriteTrue() public {
    helperShouldSetAuthorizedKey(true, true, Role.Vote);
  }

  function test_ShouldAuthorizeAttestationSigningKey_GenericReadFalse_GenericWriteFalse() public {
    helperShouldSetAuthorizedKey(false, false, Role.Attestation);
  }

  function test_ShouldAuthorizeAttestationSigningKey_GenericReadFalse_GenericWriteTrue() public {
    helperShouldSetAuthorizedKey(false, true, Role.Attestation);
  }

  function test_ShouldAuthorizeAttestationSigningKey_GenericReadTrue_GenericWriteFalse() public {
    helperShouldSetAuthorizedKey(true, false, Role.Attestation);
  }

  function test_ShouldAuthorizeAttestationSigningKey_GenericReadTrue_GenericWriteTrue() public {
    helperShouldSetAuthorizedKey(true, true, Role.Attestation);
  }

  function test_ShouldAuthorizeValidatorSigningKey_GenericReadFalse_GenericWriteFalse() public {
    helperShouldSetAuthorizedKey(false, false, Role.Validator);
  }

  function test_ShouldAuthorizeValidatorSigningKey_GenericReadFalse_GenericWriteTrue() public {
    helperShouldSetAuthorizedKey(false, true, Role.Validator);
  }

  function test_ShouldAuthorizeValidatorSigningKey_GenericReadTrue_GenericWriteFalse() public {
    helperShouldSetAuthorizedKey(true, false, Role.Validator);
  }

  function test_ShouldAuthorizeValidatorSigningKey_GenericReadTrue_GenericWriteTrue() public {
    helperShouldSetAuthorizedKey(true, true, Role.Validator);
  }

  function test_Emits_RightEventVote_GenericWriteTrue() public {
    vm.expectEmit(true, true, true, true);
    emit SignerAuthorized(account, signer, getRole(Role.Vote));
    authorize(Role.Vote, true, account, signer, signerPK);
  }

  function test_Emits_RightEventVote_GenericWriteFalse() public {
    vm.expectEmit(true, true, true, true);
    emit VoteSignerAuthorized(account, signer);
    authorize(Role.Vote, false, account, signer, signerPK);
  }

  function test_Emits_RightEventAttestation_GenericWriteTrue() public {
    vm.expectEmit(true, true, true, true);
    emit SignerAuthorized(account, signer, getRole(Role.Attestation));
    authorize(Role.Attestation, true, account, signer, signerPK);
  }

  function test_Emits_RightEventAttestation_GenericWriteFalse() public {
    vm.expectEmit(true, true, true, true);
    emit AttestationSignerAuthorized(account, signer);
    authorize(Role.Attestation, false, account, signer, signerPK);
  }

  function test_Emits_RightEventValidator_GenericWriteTrue() public {
    vm.expectEmit(true, true, true, true);
    emit SignerAuthorized(account, signer, getRole(Role.Validator));
    authorize(Role.Validator, true, account, signer, signerPK);
  }

  function test_Emits_RightEventValidator_GenericWriteFalse() public {
    vm.expectEmit(true, true, true, true);
    emit ValidatorSignerAuthorized(account, signer);
    authorize(Role.Validator, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfVoteIsAnAccount_GenericWriteTrue() public {
    vm.prank(signer);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    bytes32 _role = getRole(Role.Vote);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(account, _role, signerPK, true);
    authorizeSignerFactory(signer, _role, _v, _r, _s, true);
  }

  function test_ShouldRevertIfVoteIsAnAccount_GenericWriteFalse() public {
    vm.prank(signer);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    authorize(Role.Vote, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfValidatorIsAnAccount_GenericWriteTrue() public {
    vm.prank(signer);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    bytes32 _role = getRole(Role.Validator);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(account, _role, signerPK, true);
    authorizeSignerFactory(signer, _role, _v, _r, _s, true);
  }

  function test_ShouldRevertIfValidatorIsAnAccount_GenericWriteFalse() public {
    vm.prank(signer);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    authorize(Role.Validator, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfAttestationIsAnAccount_GenericWriteTrue() public {
    vm.prank(signer);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    bytes32 _role = getRole(Role.Attestation);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(account, _role, signerPK, true);
    authorizeSignerFactory(signer, _role, _v, _r, _s, true);
  }

  function test_ShouldRevertIfAttestationIsAnAccount_GenericWriteFalse() public {
    vm.prank(signer);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    authorize(Role.Attestation, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfVoteIsAlreadyAuthorized_GenericWriteFalse() public {
    vm.prank(otherAccount);
    accounts.createAccount();
    authorize(Role.Vote, true, otherAccount, signer, signerPK);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");

    authorize(Role.Vote, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfVoteIsAlreadyAuthorized_GenericWriteTrue() public {
    vm.prank(otherAccount);
    accounts.createAccount();
    authorize(Role.Vote, true, otherAccount, signer, signerPK);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    bytes32 _role = getRole(Role.Vote);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(account, _role, signerPK, true);
    authorizeSignerFactory(signer, _role, _v, _r, _s, true);
  }

  function test_ShouldRevertIfValidatorIsAlreadyAuthorized_GenericWriteFalse() public {
    vm.prank(otherAccount);
    accounts.createAccount();
    authorize(Role.Validator, true, otherAccount, signer, signerPK);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");

    authorize(Role.Validator, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfValidatorIsAlreadyAuthorized_GenericWriteTrue() public {
    vm.prank(otherAccount);
    accounts.createAccount();
    authorize(Role.Validator, true, otherAccount, signer, signerPK);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    bytes32 _role = getRole(Role.Validator);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(account, _role, signerPK, true);
    authorizeSignerFactory(signer, _role, _v, _r, _s, true);
  }

  function test_ShouldRevertIfAttestationIsAlreadyAuthorized_GenericWriteFalse() public {
    vm.prank(otherAccount);
    accounts.createAccount();
    authorize(Role.Attestation, true, otherAccount, signer, signerPK);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");

    authorize(Role.Attestation, false, account, signer, signerPK);
  }

  function test_ShouldRevertIfAttestationIsAlreadyAuthorized_GenericWriteTrue() public {
    vm.prank(otherAccount);
    accounts.createAccount();
    authorize(Role.Attestation, true, otherAccount, signer, signerPK);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    bytes32 _role = getRole(Role.Attestation);
    (uint8 _v, bytes32 _r, bytes32 _s) = getSignature(account, _role, signerPK, true);
    authorizeSignerFactory(signer, _role, _v, _r, _s, true);
  }

  function helperShouldRevertIfSignatureIsIncorrect(Role role, bool genericWrite) public {
    (, uint256 otherSignerPK) = actorWithPK("otherSigner");
    bytes32 _role = getRole(role);
    (uint8 v, bytes32 r, bytes32 s) = getSignature(account, _role, otherSignerPK, genericWrite);
    vm.expectRevert("Invalid signature");
    authorizeSignerFactory(signer, _role, v, r, s, true);
  }

  function test_ShouldRevertIfSignatureIsIncorrect_Attestations_GenericWriteTrue() public {
    helperShouldRevertIfSignatureIsIncorrect(Role.Attestation, true);
  }

  function test_ShouldRevertIfSignatureIsIncorrect_Attestations_GenericWriteFalse() public {
    helperShouldRevertIfSignatureIsIncorrect(Role.Attestation, false);
  }

  function test_ShouldRevertIfSignatureIsIncorrect_Vote_GenericWriteTrue() public {
    helperShouldRevertIfSignatureIsIncorrect(Role.Vote, true);
  }

  function test_ShouldRevertIfSignatureIsIncorrect_Vote_GenericWriteFalse() public {
    helperShouldRevertIfSignatureIsIncorrect(Role.Vote, false);
  }

  function test_ShouldRevertIfSignatureIsIncorrect_Validator_GenericWriteTrue() public {
    helperShouldRevertIfSignatureIsIncorrect(Role.Validator, true);
  }

  function test_ShouldRevertIfSignatureIsIncorrect_Validator_GenericWriteFalse() public {
    helperShouldRevertIfSignatureIsIncorrect(Role.Validator, false);
  }

  function helperShouldSetTheNewAuthorized(Role role, bool genericWrite, bool genericRead) public {
    authorize(role, genericWrite, account, signer, signerPK);
    (address newAuthorized, uint256 newAuthorizedPK) = actorWithPK("otherSigner");
    authorize(role, genericWrite, account, newAuthorized, newAuthorizedPK);

    assertEq(accounts.authorizedBy(newAuthorized), account);
    assertEq(getAuthorizedFromAccount(role, genericRead, account), newAuthorized);
    assertEq(authorizedSignerToAccount(role, genericRead, newAuthorized), account);
    assertEq(accounts.authorizedBy(signer), account);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Attestations_GenericWriteTrue_GenericReadTrue()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Attestation, true, true);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Attestations_GenericWriteTrue_GenericReadFalse()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Attestation, true, false);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Attestations_GenericWriteFalse_GenericReadTrue()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Attestation, false, true);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Attestations_GenericWriteFalse_GenericReadFalse()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Attestation, false, false);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Vote_GenericWriteTrue_GenericReadTrue()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Vote, true, true);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Vote_GenericWriteTrue_GenericReadFalse()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Vote, true, false);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Vote_GenericWriteFalse_GenericReadTrue()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Vote, false, true);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Vote_GenericWriteFalse_GenericReadFalse()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Vote, false, false);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Validator_GenericWriteTrue_GenericReadTrue()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Validator, true, true);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Validator_GenericWriteTrue_GenericReadFalse()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Validator, true, false);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Validator_GenericWriteFalse_GenericReadTrue()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Validator, false, true);
  }

  function test_ShouldSetTheNewAuthorized_WhenPreviousAuthorizationHasBeenMade_Validator_GenericWriteFalse_GenericReadFalse()
    public
  {
    helperShouldSetTheNewAuthorized(Role.Validator, false, false);
  }

  function helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(
    Role role,
    bool genericRead
  ) public {
    assertEq(authorizedSignerToAccount(role, genericRead, account), account);

    vm.expectRevert("Must first register address with Account.createAccount");
    authorizedSignerToAccount(role, genericRead, otherAccount);

    assertEq(getAuthorizedFromAccount(role, genericRead, account), account);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasNotAuthorized_Attestation_GenericReadTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(Role.Attestation, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasNotAuthorized_Attestation_GenericReadFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(Role.Attestation, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasNotAuthorized_Vote_GenericReadTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(Role.Vote, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasNotAuthorized_Vote_GenericReadFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(Role.Vote, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasNotAuthorized_Validator_GenericReadTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(Role.Validator, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasNotAuthorized_Validator_GenericReadFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasNotAuthorized(Role.Validator, false);
  }

  function helperShouldReturnCorrectValues_WhenAccountHasAuthorized(
    Role role,
    bool genericRead,
    bool genericWrite
  ) public {
    assertEq(authorizedSignerToAccount(role, genericRead, account), account);

    authorize(role, genericWrite, account, signer, signerPK);
    assertEq(authorizedSignerToAccount(role, genericRead, signer), account);
    assertEq(getAuthorizedFromAccount(role, genericRead, account), signer);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Attestation_GenericReadTrue_GenericWriteTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Attestation, true, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Attestation_GenericReadFalse_GenericWriteTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Attestation, false, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Attestation_GenericReadTrue_GenericWriteFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Attestation, true, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Attestation_GenericReadFalse_GenericWriteFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Attestation, false, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Vote_GenericReadTrue_GenericWriteTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Vote, true, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Vote_GenericReadFalse_GenericWriteTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Vote, false, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Vote_GenericReadTrue_GenericWriteFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Vote, true, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Vote_GenericReadFalse_GenericWriteFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Vote, false, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Validator_GenericReadTrue_GenericWriteTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Validator, true, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Validator_GenericReadFalse_GenericWriteTrue()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Validator, false, true);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Validator_GenericReadTrue_GenericWriteFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Validator, true, false);
  }

  function test_ShouldReturnCorrectValues_WhenAccountHasAuthorized_Validator_GenericReadFalse_GenericWriteFalse()
    public
  {
    helperShouldReturnCorrectValues_WhenAccountHasAuthorized(Role.Validator, false, false);
  }

  function helper_ShouldRemoveSigner(Role role, bool genericRead, bool genericWrite) public {
    authorize(role, genericWrite, account, signer, signerPK);
    assertEq(hasAuthorizedSigner(role, account, genericRead), true, "No authorized signer");
    assertEq(
      getAuthorizedFromAccount(role, genericRead, account),
      signer,
      "authorized from account"
    );

    removeSigner(genericWrite, role, account);

    assertEq(hasAuthorizedSigner(role, account, genericRead), false, "Authorized signer");
    assertEq(getAuthorizedFromAccount(role, genericRead, account), account);
  }

  function test_ShouldRemoveSigner_Attestations_GenericReadTrue_GenericWriteTrue() public {
    helper_ShouldRemoveSigner(Role.Attestation, true, true);
  }

  function test_ShouldRemoveSigner_Attestations_GenericReadFalse_GenericWriteTrue() public {
    helper_ShouldRemoveSigner(Role.Attestation, false, true);
  }

  function test_ShouldRemoveSigner_Attestations_GenericReadTrue_GenericWriteFalse() public {
    helper_ShouldRemoveSigner(Role.Attestation, true, false);
  }

  function test_ShouldRemoveSigner_Attestations_GenericReadFalse_GenericWriteFalse() public {
    helper_ShouldRemoveSigner(Role.Attestation, false, true);
  }

  function test_ShouldRemoveSigner_Vote_GenericReadTrue_GenericWriteTrue() public {
    helper_ShouldRemoveSigner(Role.Vote, true, true);
  }

  function test_ShouldRemoveSigner_Vote_GenericReadFalse_GenericWriteTrue() public {
    helper_ShouldRemoveSigner(Role.Vote, false, true);
  }

  function test_ShouldRemoveSigner_Vote_GenericReadTrue_GenericWriteFalse() public {
    helper_ShouldRemoveSigner(Role.Vote, true, false);
  }

  function test_ShouldRemoveSigner_Vote_GenericReadFalse_GenericWriteFalse() public {
    helper_ShouldRemoveSigner(Role.Vote, false, true);
  }

  function test_ShouldRemoveSigner_Validator_GenericReadTrue_GenericWriteTrue() public {
    helper_ShouldRemoveSigner(Role.Validator, true, true);
  }

  function test_ShouldRemoveSigner_Validator_GenericReadFalse_GenericWriteTrue() public {
    helper_ShouldRemoveSigner(Role.Validator, false, true);
  }

  function test_ShouldRemoveSigner_Validator_GenericReadTrue_GenericWriteFalse() public {
    helper_ShouldRemoveSigner(Role.Validator, true, false);
  }

  function test_ShouldRemoveSigner_Validator_GenericReadFalse_GenericWriteFalse() public {
    helper_ShouldRemoveSigner(Role.Validator, false, true);
  }
}
