pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

import "./interfaces/IFederatedAttestations.sol";
import "../common/interfaces/IAccounts.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistryV2.sol";
import "../common/Signatures.sol";

/**
 * @title Contract mapping identifiers to accounts
 */
contract FederatedAttestations is
  IFederatedAttestations,
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistryV2
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  struct OwnershipAttestation {
    address account;
    address signer;
    uint64 issuedOn;
    uint64 publishedOn;
    // using uint64 to allow for extra space to add parameters
  }

  // Mappings from identifier <-> attestation are separated by issuer,
  // *requiring* users to specify issuers when retrieving attestations.
  // Maintaining bidirectional mappings (vs. in Attestations.sol) makes it possible
  // to perform lookups by identifier or account without indexing event data.

  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => OwnershipAttestation[])) public identifierToAttestations;
  // account -> issuer -> identifiers
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;

  // unique attestation hash -> isRevoked
  mapping(bytes32 => bool) public revokedAttestations;

  bytes32 public eip712DomainSeparator;
  bytes32 public constant EIP712_OWNERSHIP_ATTESTATION_TYPEHASH =
    keccak256(
      abi.encodePacked(
        "OwnershipAttestation(bytes32 identifier,address issuer,",
        "address account,address signer,uint64 issuedOn)"
      )
    );

  // Changing any of these constraints will require re-benchmarking
  // and checking assumptions for batch revocation.
  // These can only be modified by releasing a new version of this contract.
  uint256 public constant MAX_ATTESTATIONS_PER_IDENTIFIER = 20;
  uint256 public constant MAX_IDENTIFIERS_PER_ADDRESS = 20;

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

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   */
  function initialize() external initializer {
    _transferOwnership(msg.sender);
    setEip712DomainSeparator();
  }

  /**
   * @notice Registers an attestation directly from the issuer
   * @param identifier Hash of the identifier to be attested
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @dev Attestation signer and issuer in storage is set to msg.sender
   * @dev Throws if an attestation with the same (identifier, issuer, account) already exists
   */
  function registerAttestationAsIssuer(
    bytes32 identifier,
    address account,
    uint64 issuedOn
  ) external {
    _registerAttestation(identifier, msg.sender, account, msg.sender, issuedOn);
  }

  /**
   * @notice Registers an attestation with a valid signature
   * @param identifier Hash of the identifier to be attested
   * @param issuer Address of the attestation issuer
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @param signer Address of the signer of the attestation
   * @param v The recovery id of the incoming ECDSA signature
   * @param r Output value r of the ECDSA signature
   * @param s Output value s of the ECDSA signature
   * @dev Throws if an attestation with the same (identifier, issuer, account) already exists
   */
  function registerAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external {
    validateAttestationSig(identifier, issuer, account, signer, issuedOn, v, r, s);
    _registerAttestation(identifier, issuer, account, signer, issuedOn);
  }

  /**
   * @notice Revokes an attestation
   * @param identifier Hash of the identifier to be revoked
   * @param issuer Address of the attestation issuer
   * @param account Address of the account mapped to the identifier
   * @dev Throws if sender is not the issuer, signer, or account
   */
  function revokeAttestation(bytes32 identifier, address issuer, address account) external {
    require(
      account == msg.sender ||
        // Minor gas optimization to prevent storage lookup in Accounts.sol if issuer == msg.sender
        issuer == msg.sender ||
        getAccounts().attestationSignerToAccount(msg.sender) == issuer,
      "Sender does not have permission to revoke this attestation"
    );
    _revokeAttestation(identifier, issuer, account);
  }

  /**
   * @notice Revokes attestations [identifiers <-> accounts] from issuer
   * @param issuer Address of the issuer of all attestations to be revoked
   * @param identifiers Hash of the identifiers
   * @param accounts Addresses of the accounts mapped to the identifiers
   *   at the same indices
   * @dev Throws if the number of identifiers and accounts is not the same
   * @dev Throws if sender is not the issuer or currently registered signer of issuer
   * @dev Throws if an attestation is not found for identifiers[i] <-> accounts[i]
   */
  function batchRevokeAttestations(
    address issuer,
    bytes32[] calldata identifiers,
    address[] calldata accounts
  ) external {
    require(identifiers.length == accounts.length, "Unequal number of identifiers and accounts");
    require(
      issuer == msg.sender || getAccounts().attestationSignerToAccount(msg.sender) == issuer,
      "Sender does not have permission to revoke attestations from this issuer"
    );

    for (uint256 i = 0; i < identifiers.length; i = i.add(1)) {
      _revokeAttestation(identifiers[i], issuer, accounts[i]);
    }
  }

  /**
   * @notice Returns info about attestations for `identifier` produced by
   *    signers of `trustedIssuers`
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @return countsPerIssuer Array of number of attestations returned per issuer
   *          For m (== sum([0])) found attestations:
   * @return accounts Array of m accounts
   * @return signers Array of m signers
   * @return issuedOns Array of m issuedOns
   * @return publishedOns Array of m publishedOns
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupAttestations(
    bytes32 identifier,
    address[] calldata trustedIssuers
  )
    external
    view
    returns (
      uint256[] memory countsPerIssuer,
      address[] memory accounts,
      address[] memory signers,
      uint64[] memory issuedOns,
      uint64[] memory publishedOns
    )
  {
    uint256 totalAttestations;
    (totalAttestations, countsPerIssuer) = getNumAttestations(identifier, trustedIssuers);

    accounts = new address[](totalAttestations);
    signers = new address[](totalAttestations);
    issuedOns = new uint64[](totalAttestations);
    publishedOns = new uint64[](totalAttestations);

    totalAttestations = 0;
    OwnershipAttestation[] memory attestationsPerIssuer;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      attestationsPerIssuer = identifierToAttestations[identifier][trustedIssuers[i]];
      for (uint256 j = 0; j < attestationsPerIssuer.length; j = j.add(1)) {
        accounts[totalAttestations] = attestationsPerIssuer[j].account;
        signers[totalAttestations] = attestationsPerIssuer[j].signer;
        issuedOns[totalAttestations] = attestationsPerIssuer[j].issuedOn;
        publishedOns[totalAttestations] = attestationsPerIssuer[j].publishedOn;
        totalAttestations = totalAttestations.add(1);
      }
    }
    return (countsPerIssuer, accounts, signers, issuedOns, publishedOns);
  }

  /**
   * @notice Returns identifiers mapped to `account` by signers of `trustedIssuers`
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifier mappings will be used
   * @return countsPerIssuer Array of number of identifiers returned per issuer
   * @return identifiers Array (length == sum([0])) of identifiers
   * @dev Adds identifier info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupIdentifiers(
    address account,
    address[] calldata trustedIssuers
  ) external view returns (uint256[] memory countsPerIssuer, bytes32[] memory identifiers) {
    uint256 totalIdentifiers;
    (totalIdentifiers, countsPerIssuer) = getNumIdentifiers(account, trustedIssuers);

    identifiers = new bytes32[](totalIdentifiers);
    bytes32[] memory identifiersPerIssuer;

    uint256 currIndex = 0;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      identifiersPerIssuer = addressToIdentifiers[account][trustedIssuers[i]];
      for (uint256 j = 0; j < identifiersPerIssuer.length; j = j.add(1)) {
        identifiers[currIndex] = identifiersPerIssuer[j];
        currIndex = currIndex.add(1);
      }
    }
    return (countsPerIssuer, identifiers);
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Validates the given attestation and signature
   * @param identifier Hash of the identifier to be attested
   * @param issuer Address of the attestation issuer
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @param signer Address of the signer of the attestation
   * @param v The recovery id of the incoming ECDSA signature
   * @param r Output value r of the ECDSA signature
   * @param s Output value s of the ECDSA signature
   * @dev Throws if attestation has been revoked
   * @dev Throws if signer is not an authorized AttestationSigner of the issuer
   */
  function validateAttestationSig(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view {
    // attestationSignerToAccount instead of isSigner allows the issuer to act as its own signer
    require(
      getAccounts().attestationSignerToAccount(signer) == issuer,
      "Signer is not a currently authorized AttestationSigner for the issuer"
    );
    bytes32 structHash = getUniqueAttestationHash(identifier, issuer, account, signer, issuedOn);
    address guessedSigner = Signatures.getSignerOfTypedDataHash(
      eip712DomainSeparator,
      structHash,
      v,
      r,
      s
    );
    require(guessedSigner == signer, "Signature is invalid");
  }

  function getUniqueAttestationHash(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn
  ) public pure returns (bytes32) {
    return
      keccak256(
        abi.encode(
          EIP712_OWNERSHIP_ATTESTATION_TYPEHASH,
          identifier,
          issuer,
          account,
          signer,
          issuedOn
        )
      );
  }

  /**
   * @notice Sets the EIP712 domain separator for the Celo FederatedAttestations abstraction.
   */
  function setEip712DomainSeparator() internal {
    uint256 chainId;
    assembly {
      chainId := chainid
    }

    eip712DomainSeparator = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("FederatedAttestations")),
        keccak256("1.0"),
        chainId,
        address(this)
      )
    );
    emit EIP712DomainSeparatorSet(eip712DomainSeparator);
  }

  /**
   * @notice Helper function for lookupAttestations to calculate the
             total number of attestations completed for an identifier
             by each trusted issuer
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @return totalAttestations Sum total of attestations found
   * @return countsPerIssuer Array of number of attestations found per issuer
   */
  function getNumAttestations(
    bytes32 identifier,
    address[] memory trustedIssuers
  ) internal view returns (uint256 totalAttestations, uint256[] memory countsPerIssuer) {
    totalAttestations = 0;
    uint256 numAttestationsForIssuer;
    countsPerIssuer = new uint256[](trustedIssuers.length);

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      numAttestationsForIssuer = identifierToAttestations[identifier][trustedIssuers[i]].length;
      totalAttestations = totalAttestations.add(numAttestationsForIssuer);
      countsPerIssuer[i] = numAttestationsForIssuer;
    }
    return (totalAttestations, countsPerIssuer);
  }

  /**
   * @notice Helper function for lookupIdentifiers to calculate the
             total number of identifiers completed for an identifier
             by each trusted issuer
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifiers will be included
   * @return totalIdentifiers Sum total of identifiers found
   * @return countsPerIssuer Array of number of identifiers found per issuer
   */
  function getNumIdentifiers(
    address account,
    address[] memory trustedIssuers
  ) internal view returns (uint256 totalIdentifiers, uint256[] memory countsPerIssuer) {
    totalIdentifiers = 0;
    uint256 numIdentifiersForIssuer;
    countsPerIssuer = new uint256[](trustedIssuers.length);

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      numIdentifiersForIssuer = addressToIdentifiers[account][trustedIssuers[i]].length;
      totalIdentifiers = totalIdentifiers.add(numIdentifiersForIssuer);
      countsPerIssuer[i] = numIdentifiersForIssuer;
    }
    return (totalIdentifiers, countsPerIssuer);
  }

  /**
   * @notice Registers an attestation
   * @param identifier Hash of the identifier to be attested
   * @param issuer Address of the attestation issuer
   * @param account Address of the account being mapped to the identifier
   * @param issuedOn Time at which the issuer issued the attestation in Unix time
   * @param signer Address of the signer of the attestation
   */
  function _registerAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn
  ) private {
    require(
      !revokedAttestations[getUniqueAttestationHash(identifier, issuer, account, signer, issuedOn)],
      "Attestation has been revoked"
    );
    uint256 numExistingAttestations = identifierToAttestations[identifier][issuer].length;
    require(
      numExistingAttestations.add(1) <= MAX_ATTESTATIONS_PER_IDENTIFIER,
      "Max attestations already registered for identifier"
    );
    require(
      addressToIdentifiers[account][issuer].length.add(1) <= MAX_IDENTIFIERS_PER_ADDRESS,
      "Max identifiers already registered for account"
    );

    for (uint256 i = 0; i < numExistingAttestations; i = i.add(1)) {
      // This enforces only one attestation to be uploaded
      // for a given set of (identifier, issuer, account)
      // Editing/upgrading an attestation requires that it be revoked before a new one is registered
      require(
        identifierToAttestations[identifier][issuer][i].account != account,
        "Attestation for this account already exists"
      );
    }
    uint64 publishedOn = uint64(block.timestamp);
    OwnershipAttestation memory attestation = OwnershipAttestation(
      account,
      signer,
      issuedOn,
      publishedOn
    );
    identifierToAttestations[identifier][issuer].push(attestation);
    addressToIdentifiers[account][issuer].push(identifier);
    emit AttestationRegistered(identifier, issuer, account, signer, issuedOn, publishedOn);
  }

  /**
   * @notice Revokes an attestation:
   *  helper function for revokeAttestation and batchRevokeAttestations
   * @param identifier Hash of the identifier to be revoked
   * @param issuer Address of the attestation issuer
   * @param account Address of the account mapped to the identifier
   * @dev Reverts if attestation is not found mapping identifier <-> account
   */
  function _revokeAttestation(bytes32 identifier, address issuer, address account) private {
    OwnershipAttestation[] storage attestations = identifierToAttestations[identifier][issuer];
    uint256 lenAttestations = attestations.length;
    for (uint256 i = 0; i < lenAttestations; i = i.add(1)) {
      if (attestations[i].account != account) {
        continue;
      }

      OwnershipAttestation memory attestation = attestations[i];
      // This is meant to delete the attestations in the array
      // and then move the last element in the array to that empty spot,
      // to avoid having empty elements in the array
      if (i != lenAttestations - 1) {
        attestations[i] = attestations[lenAttestations - 1];
      }
      attestations.pop();

      bool deletedIdentifier = false;
      bytes32[] storage identifiers = addressToIdentifiers[account][issuer];
      uint256 lenIdentifiers = identifiers.length;

      for (uint256 j = 0; j < lenIdentifiers; j = j.add(1)) {
        if (identifiers[j] != identifier) {
          continue;
        }
        if (j != lenIdentifiers - 1) {
          identifiers[j] = identifiers[lenIdentifiers - 1];
        }
        identifiers.pop();
        deletedIdentifier = true;
        break;
      }
      // Should never be false - both mappings should always be updated in unison
      assert(deletedIdentifier);

      bytes32 attestationHash = getUniqueAttestationHash(
        identifier,
        issuer,
        account,
        attestation.signer,
        attestation.issuedOn
      );
      revokedAttestations[attestationHash] = true;

      emit AttestationRevoked(
        identifier,
        issuer,
        account,
        attestation.signer,
        attestation.issuedOn,
        attestation.publishedOn
      );
      return;
    }
    revert("Attestation to be revoked does not exist");
  }
}
