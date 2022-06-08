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
    address signer;
    uint64 issuedOn;
    uint64 publishedOn;
    // using uint64 to allow for extra space to add parameters
  }

  // TODO ASv2 revisit linting issues & all solhint-disable-next-line max-line-length

  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => OwnershipAttestation[])) public identifierToAttestations;
  // account -> issuer -> identifiers
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;
  // unique attestation hash -> isRevoked
  mapping(bytes32 => bool) public revokedAttestations;

  bytes32 public constant EIP712_VALIDATE_ATTESTATION_TYPEHASH = keccak256(
    "OwnershipAttestation(bytes32 identifier,address issuer,address account,uint64 issuedOn)"
  );
  bytes32 public eip712DomainSeparator;

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
   * @param registryAddress The address of the registry core smart contract.
   */
  function initialize(address registryAddress) external initializer {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setEip712DomainSeparator();
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
      numAttestationsForIssuer = identifierToAttestations[identifier][trustedIssuers[i]].length;
      totalAttestations = totalAttestations.add(numAttestationsForIssuer);
      countsPerIssuer[i] = numAttestationsForIssuer;
    }
    return (totalAttestations, countsPerIssuer);
  }

  /**
   * @notice Returns info about up to `maxAttestations` attestations for
   *   `identifier` produced by signers of `trustedIssuers`
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
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
  // TODO reviewers: is it preferable to return an array of `trustedIssuer` indices
  // (indicating issuer per attestation) instead of counts per attestation?
  // TODO: change issuedOn type, change the order of return values to match across the file,
  // add publishedOn to returned lookups
  function lookupAttestations(bytes32 identifier, address[] calldata trustedIssuers)
    external
    view
    returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory)
  {
    // TODO reviewers: this is to get around a stack too deep error;
    // are there better ways of dealing with this?
    return _lookupAttestations(identifier, trustedIssuers);
  }

  /**
   * @notice Helper function for lookupAttestations to get around stack too deep
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
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
  // TODO: change issuedOn type, change the order of return values to match across the file,
  // add publishedOn to returned lookups
  function _lookupAttestations(bytes32 identifier, address[] memory trustedIssuers)
    internal
    view
    returns (uint256[] memory, address[] memory, uint256[] memory, address[] memory)
  {
    uint256 totalAttestations;
    uint256[] memory countsPerIssuer;

    (totalAttestations, countsPerIssuer) = getNumAttestations(identifier, trustedIssuers);

    address[] memory accounts = new address[](totalAttestations);
    uint256[] memory issuedOns = new uint256[](totalAttestations);
    address[] memory signers = new address[](totalAttestations);

    OwnershipAttestation[] memory attestationsPerIssuer;
    // Reset this and use as current index to get around stack-too-deep
    // TODO reviewers: is it preferable to pack two uint256 counters into a struct
    // and use one for total (above) & one for currIndex (below)?
    totalAttestations = 0;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      attestationsPerIssuer = identifierToAttestations[identifier][trustedIssuers[i]];
      for (uint256 j = 0; j < attestationsPerIssuer.length; j = j.add(1)) {
        accounts[totalAttestations] = attestationsPerIssuer[j].account;
        issuedOns[totalAttestations] = attestationsPerIssuer[j].issuedOn;
        signers[totalAttestations] = attestationsPerIssuer[j].signer;
        totalAttestations = totalAttestations.add(1);
      }
    }
    return (countsPerIssuer, accounts, issuedOns, signers);
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
   *   by signers of `trustedIssuers`
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifier mappings will be used
   * @return [0] Array of number of identifiers returned per issuer
   * @return [1] Array (length == sum([0])) of identifiers
   * @dev Adds identifier info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */
  function lookupIdentifiers(address account, address[] calldata trustedIssuers)
    external
    view
    returns (uint256[] memory, bytes32[] memory)
  {
    uint256 totalIdentifiers;
    uint256[] memory countsPerIssuer;

    (totalIdentifiers, countsPerIssuer) = getNumIdentifiers(account, trustedIssuers);

    bytes32[] memory identifiers = new bytes32[](totalIdentifiers);
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
  function validateAttestation(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view {
    require(
      !revokedAttestations[getUniqueAttestationHash(identifier, issuer, account, signer, issuedOn)],
      "Attestation has been revoked"
    );
    require(
      getAccounts().attestationSignerToAccount(signer) == issuer,
      "Signer is not a currently authorized AttestationSigner for the issuer"
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
    require(guessedSigner == signer, "Signature is invalid");
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
    // TODO allow for updating existing attestation by only updating signer/publishedOn/issuedOn
    validateAttestation(identifier, issuer, account, signer, issuedOn, v, r, s);
    for (uint256 i = 0; i < identifierToAttestations[identifier][issuer].length; i = i.add(1)) {
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
   * @notice Revokes an attestation 
   * @param identifier Hash of the identifier to be revoked
   * @param issuer Address of the attestation issuer
   * @param account Address of the account mapped to the identifier
   * @dev Throws if sender is not the issuer, signer, or account
   */
  // TODO should we pass in the issuedOn/signer parameter? ie. only revoke if the sender knows
  // the issuedOn/signer for the unique attestation
  function revokeAttestation(bytes32 identifier, address issuer, address account) external {
    OwnershipAttestation[] memory attestations = identifierToAttestations[identifier][issuer];
    for (uint256 i = 0; i < attestations.length; i = i.add(1)) {
      OwnershipAttestation memory attestation = attestations[i];
      if (attestation.account == account) {
        address signer = attestation.signer;
        uint64 issuedOn = attestation.issuedOn;
        uint64 publishedOn = attestation.publishedOn;
        // TODO reviewers: is there a risk that compromised signers could revoke legitimate
        // attestations before they have been unauthorized?
        require(
          account == msg.sender || getAccounts().attestationSignerToAccount(msg.sender) == issuer,
          "Sender does not have permission to revoke this attestation"
        );
        // This is meant to delete the attestation in the array
        // and then move the last element in the array to that empty spot,
        // to avoid having empty elements in the array
        // TODO benchmark gas cost saving to check if array is of length 1
        identifierToAttestations[identifier][issuer][i] = attestations[attestations.length - 1];
        identifierToAttestations[identifier][issuer].pop();

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

        bytes32 attestationHash = getUniqueAttestationHash(
          identifier,
          issuer,
          account,
          signer,
          issuedOn
        );
        // Should never be able to re-revoke an attestation
        assert(!revokedAttestations[attestationHash]);
        revokedAttestations[attestationHash] = true;

        emit AttestationRevoked(identifier, issuer, account, signer, issuedOn, publishedOn);
        return;
      }
    }
    revert("Attestion to be revoked does not exist");
  }

  function getUniqueAttestationHash(
    bytes32 identifier,
    address issuer,
    address account,
    address signer,
    uint64 issuedOn
  ) public pure returns (bytes32) {
    return keccak256(abi.encode(identifier, issuer, account, signer, issuedOn));
  }
}
