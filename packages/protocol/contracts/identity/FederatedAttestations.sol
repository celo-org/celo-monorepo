pragma solidity ^0.5.13;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

import "./interfaces/IFederatedAttestations.sol";
import "../common/interfaces/IAccounts.sol";
import "../common/interfaces/ICeloVersionedContract.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/Signatures.sol";

/**
 * @title Contract mapping identifiers to accounts
 */
contract FederatedAttestations is
  IFederatedAttestations,
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  struct OwnershipAttestation {
    address account;
    uint256 issuedOn;
    address signer;
  }

  // TODO ASv2 revisit linting issues & all solhint-disable-next-line max-line-length

  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => OwnershipAttestation[])) public identifierToAddresses;
  // account -> issuer -> identifiers
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;
  // signer => isRevoked
  mapping(address => bool) public revokedSigners;

  bytes32 public constant EIP712_VALIDATE_ATTESTATION_TYPEHASH = keccak256(
    "OwnershipAttestation(bytes32 identifier,address issuer,address account,uint256 issuedOn)"
  );
  bytes32 public eip712DomainSeparator;

  event EIP712DomainSeparatorSet(bytes32 eip712DomainSeparator);
  event AttestationRegistered(
    bytes32 indexed identifier,
    address indexed issuer,
    address indexed account,
    uint256 issuedOn,
    address signer
  );
  event AttestationDeleted(
    bytes32 indexed identifier,
    address indexed issuer,
    address indexed account
  );

  /**
   * @notice Sets initialized == true on implementation contracts
   * @param test Set to true to skip implementation initialization
   */
  constructor(bool test) public Initializable(test) {}

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setEip712DomainSeparator();
    // TODO ASv2 initialize any other variables here
  }

  /**
   * @notice Sets the EIP712 domain separator for the Celo FederatedAttestations abstraction.
   */
  function setEip712DomainSeparator() public {
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
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Helper function for _lookupAttestations to calculate the
             total number of attestations completed for an identifier
             by each trusted issuer, from unrevoked signers only
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @return [0] Sum total of attestations found
   *         [1] Array of number of attestations found per issuer
   */
  function getNumUnrevokedAttestations(bytes32 identifier, address[] memory trustedIssuers)
    internal
    view
    returns (uint256, uint256[] memory)
  {
    uint256 totalAttestations = 0;
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);

    OwnershipAttestation[] memory attestationsPerIssuer;
    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      attestationsPerIssuer = identifierToAddresses[identifier][trustedIssuers[i]];
      for (uint256 j = 0; j < attestationsPerIssuer.length; j = j.add(1)) {
        if (!revokedSigners[attestationsPerIssuer[j].signer]) {
          totalAttestations = totalAttestations.add(1);
          countsPerIssuer[i] = countsPerIssuer[i].add(1);
        }
      }
    }
    return (totalAttestations, countsPerIssuer);
  }

  /**
   * @notice Helper function for _lookupAttestations to calculate the
             total number of attestations completed for an identifier
             by each trusted issuer
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @return [0] Sum total of attestations found
   *         [1] Array of number of attestations found per issuer
   */
  function getNumAttestations(bytes32 identifier, address[] memory trustedIssuers)
    internal
    view
    returns (uint256, uint256[] memory)
  {
    uint256 totalAttestations = 0;
    uint256 numAttestationsForIssuer;
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      numAttestationsForIssuer = identifierToAddresses[identifier][trustedIssuers[i]].length;
      totalAttestations = totalAttestations.add(numAttestationsForIssuer);
      countsPerIssuer[i] = numAttestationsForIssuer;
    }
    return (totalAttestations, countsPerIssuer);
  }

  /**
   * @notice Returns info about up to `maxAttestations` attestations for
   *   `identifier` produced by unrevoked signers of `trustedIssuers`
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @param maxAttestations Limit the number of attestations that will be returned
   * @return [0] Array of number of attestations returned per issuer
   * @return [1 - 3] for m (== sum([0])) found attestations, m <= maxAttestations:
   *         [
   *           Array of m accounts,
   *           Array of m issuedOns,
   *           Array of m signers
   *         ]; index corresponds to the same attestation
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupUnrevokedAttestations(
    bytes32 identifier,
    address[] calldata trustedIssuers,
    uint256 maxAttestations
  ) external view returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory) {
    // TODO reviewers: this is to get around a stack too deep error;
    // are there better ways of dealing with this?
    return _lookupUnrevokedAttestations(identifier, trustedIssuers, maxAttestations);
  }

  /**
   * @notice Helper function for lookupUnrevokedAttestations to get around stack too deep
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @param maxAttestations Limit the number of attestations that will be returned
   * @return [0] Array of number of attestations returned per issuer
   * @return [1 - 3] for m (== sum([0])) found attestations, m <= maxAttestations:
   *         [
   *           Array of m accounts,
   *           Array of m issuedOns,
   *           Array of m signers
   *         ]; index corresponds to the same attestation
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function _lookupUnrevokedAttestations(
    bytes32 identifier,
    address[] memory trustedIssuers,
    uint256 maxAttestations
  ) internal view returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory) {
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);

    // Pre-computing length of unrevoked attestations requires many storage lookups.
    // Allow users to call that first and pass this in as maxAttestations.
    // Same index corresponds to same attestation
    address[] memory accounts = new address[](maxAttestations);
    uint256[] memory issuedOns = new uint256[](maxAttestations);
    address[] memory signers = new address[](maxAttestations);

    uint256 currIndex = 0;
    OwnershipAttestation[] memory attestationsPerIssuer;

    for (uint256 i = 0; i < trustedIssuers.length && currIndex < maxAttestations; i = i.add(1)) {
      attestationsPerIssuer = identifierToAddresses[identifier][trustedIssuers[i]];
      for (
        uint256 j = 0;
        j < attestationsPerIssuer.length && currIndex < maxAttestations;
        j = j.add(1)
      ) {
        if (!revokedSigners[attestationsPerIssuer[j].signer]) {
          accounts[currIndex] = attestationsPerIssuer[j].account;
          issuedOns[currIndex] = attestationsPerIssuer[j].issuedOn;
          signers[currIndex] = attestationsPerIssuer[j].signer;
          currIndex = currIndex.add(1);
          countsPerIssuer[i] = countsPerIssuer[i].add(1);
        }
      }
    }

    // Trim returned structs if necessary
    if (currIndex < maxAttestations) {
      address[] memory trimmedAccounts = new address[](currIndex);
      uint256[] memory trimmedIssuedOns = new uint256[](currIndex);
      address[] memory trimmedSigners = new address[](currIndex);

      for (uint256 i = 0; i < currIndex; i = i.add(1)) {
        trimmedAccounts[i] = accounts[i];
        trimmedIssuedOns[i] = issuedOns[i];
        trimmedSigners[i] = signers[i];
      }
      return (countsPerIssuer, trimmedAccounts, trimmedIssuedOns, trimmedSigners);
    } else {
      return (countsPerIssuer, accounts, issuedOns, signers);
    }
  }

  /**
   * @notice Similar to lookupUnrevokedAttestations but returns all attestations
   *   for `identifier` produced by `trustedIssuers`,
   *   either including or excluding attestations from revoked signers
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @param includeRevoked Whether to include attestations produced by revoked signers
   * @return [0] Array of number of attestations returned per issuer
   * @return [1 - 3] for m (== sum([0])) found attestations:
   *         [
   *           Array of m accounts,
   *           Array of m issuedOns,
   *           Array of m signers
   *         ]; index corresponds to the same attestation
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupAttestations(
    bytes32 identifier,
    address[] calldata trustedIssuers,
    bool includeRevoked
  ) external view returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory) {
    // TODO reviewers: this is to get around a stack too deep error;
    // are there better ways of dealing with this?
    return _lookupAttestations(identifier, trustedIssuers, includeRevoked);
  }

  /**
   * @notice Helper function for lookupAttestations to get around stack too deep
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @param includeRevoked Whether to include attestations produced by revoked signers
   * @return [0] Array of number of attestations returned per issuer
   * @return [1 - 3] for m (== sum([0])) found attestations:
   *         [
   *           Array of m accounts,
   *           Array of m issuedOns,
   *           Array of m signers
   *         ]; index corresponds to the same attestation
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function _lookupAttestations(
    bytes32 identifier,
    address[] memory trustedIssuers,
    bool includeRevoked
  ) internal view returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory) {
    uint256 totalAttestations;
    uint256[] memory countsPerIssuer;

    (totalAttestations, countsPerIssuer) = includeRevoked
      ? getNumAttestations(identifier, trustedIssuers)
      : getNumUnrevokedAttestations(identifier, trustedIssuers);

    address[] memory accounts = new address[](totalAttestations);
    uint256[] memory issuedOns = new uint256[](totalAttestations);
    address[] memory signers = new address[](totalAttestations);

    OwnershipAttestation[] memory attestationsPerIssuer;
    // Reset this and use as current index to get around stack-too-deep
    // TODO reviewers: is it preferable to pack two uint256 counters into a struct
    // and use one for total (above) & one for currIndex (below)?
    totalAttestations = 0;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      attestationsPerIssuer = identifierToAddresses[identifier][trustedIssuers[i]];
      for (uint256 j = 0; j < attestationsPerIssuer.length; j = j.add(1)) {
        if (includeRevoked || (!revokedSigners[attestationsPerIssuer[j].signer])) {
          accounts[totalAttestations] = attestationsPerIssuer[j].account;
          issuedOns[totalAttestations] = attestationsPerIssuer[j].issuedOn;
          signers[totalAttestations] = attestationsPerIssuer[j].signer;
          totalAttestations = totalAttestations.add(1);
        }
      }
    }
    return (countsPerIssuer, accounts, issuedOns, signers);
  }

  /**
    * @notice Helper function for lookupIdentifiers to calculate the
             total number of identifiers completed for an identifier
             by each trusted issuer, from unrevoked signers only
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifiers will be included
   * @return [0] Sum total of identifiers found
   *         [1] Array of number of identifiers found per issuer
   */
  function getNumUnrevokedIdentifiers(address account, address[] memory trustedIssuers)
    internal
    view
    returns (uint256, uint256[] memory)
  {
    uint256 totalIdentifiers = 0;
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);

    OwnershipAttestation[] memory attestationsPerIssuer;
    bytes32[] memory identifiersPerIssuer;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      identifiersPerIssuer = addressToIdentifiers[account][trustedIssuers[i]];
      for (uint256 j = 0; j < identifiersPerIssuer.length; j = j.add(1)) {
        bytes32 identifier = identifiersPerIssuer[j];
        // Check if the mapping was produced by a revoked signer
        attestationsPerIssuer = identifierToAddresses[identifier][trustedIssuers[i]];
        for (uint256 k = 0; k < attestationsPerIssuer.length; k = k.add(1)) {
          OwnershipAttestation memory attestation = attestationsPerIssuer[k];
          // (identifier, account, issuer) tuples are checked for uniqueness on registration
          if (attestation.account == account && !revokedSigners[attestation.signer]) {
            totalIdentifiers = totalIdentifiers.add(1);
            countsPerIssuer[i] = countsPerIssuer[i].add(1);
            break;
          }
        }
      }
    }
    return (totalIdentifiers, countsPerIssuer);
  }

  /**
   * @notice Helper function for lookupIdentifiers to calculate the
             total number of identifiers completed for an identifier
             by each trusted issuer
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifiers will be included
   * @return [0] Sum total of identifiers found
   *         [1] Array of number of identifiers found per issuer
   */
  function getNumIdentifiers(address account, address[] memory trustedIssuers)
    internal
    view
    returns (uint256, uint256[] memory)
  {
    uint256 totalIdentifiers = 0;
    uint256 numIdentifiersForIssuer;
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      numIdentifiersForIssuer = addressToIdentifiers[account][trustedIssuers[i]].length;
      totalIdentifiers = totalIdentifiers.add(numIdentifiersForIssuer);
      countsPerIssuer[i] = numIdentifiersForIssuer;
    }
    return (totalIdentifiers, countsPerIssuer);
  }

  /**
   * @notice Returns up to `maxIdentifiers` identifiers mapped to `account`
   *   by unrevoked signers of `trustedIssuers`
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifier mappings will be used
   * @param maxIdentifiers Limit the number of identifiers that will be returned
   * @return [0] Array of number of identifiers returned per issuer
   * @return [1] Array (length == sum([0]) <= maxIdentifiers) of identifiers
   * @dev Adds identifier info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupUnrevokedIdentifiers(
    address account,
    address[] calldata trustedIssuers,
    uint256 maxIdentifiers
  ) external view returns (uint256[] memory, bytes32[] memory) {
    uint256[] memory countsPerIssuer = new uint256[](trustedIssuers.length);
    // Same as for the other lookup, preallocate and then trim for now
    uint256 currIndex = 0;
    bytes32[] memory identifiers = new bytes32[](maxIdentifiers);

    OwnershipAttestation[] memory attestationsPerIssuer;
    bytes32[] memory identifiersPerIssuer;

    for (uint256 i = 0; i < trustedIssuers.length && currIndex < maxIdentifiers; i = i.add(1)) {
      identifiersPerIssuer = addressToIdentifiers[account][trustedIssuers[i]];
      for (
        uint256 j = 0;
        j < identifiersPerIssuer.length && currIndex < maxIdentifiers;
        j = j.add(1)
      ) {
        bytes32 identifier = identifiersPerIssuer[j];
        // Check if the mapping was produced by a revoked signer
        attestationsPerIssuer = identifierToAddresses[identifier][trustedIssuers[i]];
        for (uint256 k = 0; k < attestationsPerIssuer.length; k = k.add(1)) {
          // (identifier, account, issuer) tuples are checked for uniqueness on registration
          if (
            attestationsPerIssuer[k].account == account &&
            !revokedSigners[attestationsPerIssuer[k].signer]
          ) {
            identifiers[currIndex] = identifier;
            currIndex = currIndex.add(1);
            countsPerIssuer[i] = countsPerIssuer[i].add(1);
            break;
          }
        }
      }
    }
    if (currIndex < maxIdentifiers) {
      // Allocate and fill properly-sized array
      bytes32[] memory trimmedIdentifiers = new bytes32[](currIndex);
      for (uint256 i = 0; i < currIndex; i = i.add(1)) {
        trimmedIdentifiers[i] = identifiers[i];
      }
      return (countsPerIssuer, trimmedIdentifiers);
    } else {
      return (countsPerIssuer, identifiers);
    }
  }

  /**
   * @notice Similar to lookupUnrevokedIdentifiers but returns all identifiers
   *   mapped to an address with attestations from a list of issuers,
   *   either including or excluding attestations from revoked signers
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifier mappings will be used
   * @param includeRevoked Whether to include identifiers attested by revoked signers
   * @return [0] Array of number of identifiers returned per issuer
   * @return [1] Array (length == sum([0])) of identifiers
   * @dev Adds identifier info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupIdentifiers(
    address account,
    address[] calldata trustedIssuers,
    bool includeRevoked
  ) external view returns (uint256[] memory, bytes32[] memory) {
    uint256 totalIdentifiers;
    uint256[] memory countsPerIssuer;

    (totalIdentifiers, countsPerIssuer) = includeRevoked
      ? getNumIdentifiers(account, trustedIssuers)
      : getNumUnrevokedIdentifiers(account, trustedIssuers);

    bytes32[] memory identifiers = new bytes32[](totalIdentifiers);
    bytes32[] memory identifiersPerIssuer;

    uint256 currIndex = 0;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      identifiersPerIssuer = addressToIdentifiers[account][trustedIssuers[i]];
      for (uint256 j = 0; j < identifiersPerIssuer.length; j = j.add(1)) {
        if (
          includeRevoked ||
          foundUnrevokedAttestation(account, identifiersPerIssuer[j], trustedIssuers[i])
        ) {
          identifiers[currIndex] = identifiersPerIssuer[j];
          currIndex = currIndex.add(1);
        }
      }
    }
    return (countsPerIssuer, identifiers);
  }

  /**
   * @notice Helper function for lookupIdentifiers to search through the
   *   attestations from `issuer` for one with an unrevoked signer
   *   that maps `account` -> `identifier
   * @param account Address of the account
   * @param identifier Hash of the identifier
   * @param issuer Issuer whose attestations to search
   * @return Whether or not an unrevoked attestation is found establishing the mapping
   */
  function foundUnrevokedAttestation(address account, bytes32 identifier, address issuer)
    internal
    view
    returns (bool)
  {
    OwnershipAttestation[] memory attestations = identifierToAddresses[identifier][issuer];
    for (uint256 i = 0; i < attestations.length; i = i.add(1)) {
      if (attestations[i].account == account && !revokedSigners[attestations[i].signer]) {
        return true;
      }
    }
    return false;
  }

  // TODO do we want to restrict permissions, or should anyone
  // with a valid signature be able to register an attestation?
  modifier isValidUser(address issuer, address account) {
    require(
      msg.sender == account ||
        msg.sender == issuer ||
        getAccounts().attestationSignerToAccount(msg.sender) == issuer,
      "User does not have permission to perform this action"
    );
    require(!revokedSigners[msg.sender], "User has been revoked ");
    _;
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
   * @return Whether the signature is valid
   * @dev Throws if signer is revoked
   * @dev Throws if signer is not an authorized AttestationSigner of the issuer
   */
  function isValidAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    uint256 issuedOn,
    address signer,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (bool) {
    require(!revokedSigners[signer], "Signer has been revoked");
    require(
      getAccounts().attestationSignerToAccount(signer) == issuer,
      "Signer has not been authorized as an AttestationSigner by the issuer"
    );
    bytes32 structHash = keccak256(
      abi.encode(EIP712_VALIDATE_ATTESTATION_TYPEHASH, identifier, issuer, account, issuedOn)
    );
    address guessedSigner = Signatures.getSignerOfTypedDataHash(
      eip712DomainSeparator,
      structHash,
      v,
      r,
      s
    );
    return guessedSigner == signer;
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
   * @dev Throws if sender is not the issuer, account, or an authorized AttestationSigner
   * @dev Throws if an attestation with the same (identifier, issuer, account) already exists
   */
  function registerAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    uint256 issuedOn,
    address signer,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public isValidUser(issuer, account) {
    require(
      isValidAttestation(identifier, issuer, account, issuedOn, signer, v, r, s),
      "Signature is invalid"
    );
    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i = i.add(1)) {
      // This enforces only one attestation to be uploaded
      // for a given set of (identifier, issuer, account)
      // Editing/upgrading an attestation requires that it be deleted before a new one is registered
      require(
        identifierToAddresses[identifier][issuer][i].account != account,
        "Attestation for this account already exists"
      );
    }
    OwnershipAttestation memory attestation = OwnershipAttestation(account, issuedOn, signer);
    identifierToAddresses[identifier][issuer].push(attestation);
    addressToIdentifiers[account][issuer].push(identifier);
    emit AttestationRegistered(identifier, issuer, account, issuedOn, signer);
  }

  /**
   * @notice Deletes an attestation 
   * @param identifier Hash of the identifier to be deleted
   * @param issuer Address of the attestation issuer
   * @param account Address of the account mapped to the identifier
   * @dev Throws if sender is not the issuer, account, or an authorized AttestationSigner
   */
  function deleteAttestation(bytes32 identifier, address issuer, address account)
    public
    isValidUser(issuer, account)
  {
    OwnershipAttestation[] memory attestations = identifierToAddresses[identifier][issuer];
    for (uint256 i = 0; i < attestations.length; i = i.add(1)) {
      OwnershipAttestation memory attestation = attestations[i];
      if (attestation.account == account) {
        // This is meant to delete the attestation in the array
        // and then move the last element in the array to that empty spot,
        // to avoid having empty elements in the array
        // TODO reviewers: is there a better way of doing this?
        identifierToAddresses[identifier][issuer][i] = attestations[attestations.length - 1];
        identifierToAddresses[identifier][issuer].pop();

        bool deletedIdentifier = false;

        bytes32[] memory identifiers = addressToIdentifiers[account][issuer];
        for (uint256 j = 0; j < identifiers.length; j = j.add(1)) {
          if (identifiers[j] == identifier) {
            addressToIdentifiers[account][issuer][j] = identifiers[identifiers.length - 1];
            addressToIdentifiers[account][issuer].pop();
            deletedIdentifier = true;
            break;
          }
        }
        // Should never be false - both mappings should always be updated in unison
        assert(deletedIdentifier);

        emit AttestationDeleted(identifier, issuer, account);
        break;
      }
    }
  }

  function revokeSigner(address signer) public {
    // TODO ASv2 add constraints on who has permissions to revoke a signer
    // TODO ASv2 consider whether we want to check if the signer is an authorized signer
    // or to allow any address to be revoked
    revokedSigners[signer] = true;
  }
}
