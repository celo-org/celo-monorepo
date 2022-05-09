pragma solidity ^0.5.13;
// TODO ASv2 come back to this and possibly flatten structs as arg params
pragma experimental ABIEncoderV2;

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
import "../common/UsingPrecompiles.sol";
import "../common/libraries/ReentrancyGuard.sol";

/**
 * @title Contract mapping identifiers to accounts
 */
contract FederatedAttestations is
  IFederatedAttestations,
  ICeloVersionedContract,
  Ownable,
  Initializable,
  UsingRegistry,
  ReentrancyGuard,
  UsingPrecompiles
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  // TODO ASv2 fix all ++ -> SafeMath x = x.add(1)
  struct IdentifierOwnershipAttestation {
    address account;
    uint256 issuedOn;
    address signer;
  }
  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => IdentifierOwnershipAttestation[])) public identifierToAddresses;
  // account -> issuer -> identifiers
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;
  // signer => isRevoked
  mapping(address => bool) public revokedSigners;

  // TODO: should this be hardcoded here?
  bytes32 constant SIGNER_ROLE = keccak256(abi.encodePacked("celo.org/core/attestation"));
  bytes32 public constant EIP712_VALIDATE_ATTESTATION_TYPEHASH = keccak256(
    "IdentifierOwnershipAttestation(bytes32 identifier,address issuer,address account,uint256 issuedOn)"
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
   * @notice Returns info about attestations (with unrevoked signers)
   *   for an identifier produced by a list of issuers
   * @param identifier Hash of the identifier
   * @param trustedIssuers Array of n issuers whose attestations will be included
   * @param maxAttestations Limit the number of attestations that will be returned
   * @return for m found attestations, m <= maxAttestations:
   *         [
   *           Array of m accounts,
   *           Array of m issuedOns,
   *           Array of m signers
   *         ]; index corresponds to the same attestation
   * @dev Adds attestation info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */

  // TODO ASv2 consider also returning an array with counts of attestations per issuer
  function lookupAttestations(
    bytes32 identifier,
    address[] memory trustedIssuers,
    uint256 maxAttestations
  ) public view returns (address[] memory, uint256[] memory, address[] memory) {
    // Cannot dynamically allocate an in-memory array
    // For now require a max returned parameter to pre-allocate and then shrink
    // TODO ASv2 is it a risk to allocate an array of size maxAttestations?
    // Same index corresponds to same attestation
    address[] memory accounts = new address[](maxAttestations);
    uint256[] memory issuedOns = new uint256[](maxAttestations);
    address[] memory signers = new address[](maxAttestations);

    uint256 currIndex = 0;

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      uint256 numTrustedIssuers = identifierToAddresses[identifier][trustedIssuers[i]].length;
      for (uint256 j = 0; j < numTrustedIssuers; j = j.add(1)) {
        // Only create and push new attestation if we haven't hit max
        if (currIndex < maxAttestations) {
          IdentifierOwnershipAttestation memory attestation = identifierToAddresses[identifier][trustedIssuers[i]][j];
          if (!revokedSigners[attestation.signer]) {
            accounts[currIndex] = attestation.account;
            issuedOns[currIndex] = attestation.issuedOn;
            signers[currIndex] = attestation.signer;
            currIndex = currIndex.add(1);
          }
        } else {
          break;
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
      return (trimmedAccounts, trimmedIssuedOns, trimmedSigners);
    } else {
      return (accounts, issuedOns, signers);
    }
  }

  /**
   * @notice Returns identifiers mapped (by unrevoked signers) to a
   *   given account address by a list of trusted issuers
   * @param account Address of the account
   * @param trustedIssuers Array of n issuers whose identifier mappings will be used
   * @param maxIdentifiers Limit the number of identifiers that will be returned
   * @return Array (length <= maxIdentifiers) of identifiers
   * @dev Adds identifier info to the arrays in order of provided trustedIssuers
   * @dev Expectation that only one attestation exists per (identifier, issuer, account)
   */

  // TODO ASv2 consider also returning an array with counts of identifiers per issuer

  function lookupIdentifiersByAddress(
    address account,
    address[] memory trustedIssuers,
    uint256 maxIdentifiers
  ) public view returns (bytes32[] memory) {
    // Same as for the other lookup, preallocate and then trim for now
    uint256 currIndex = 0;
    bytes32[] memory identifiers = new bytes32[](maxIdentifiers);

    for (uint256 i = 0; i < trustedIssuers.length; i = i.add(1)) {
      address trustedIssuer = trustedIssuers[i];
      uint256 numIssuersForAddress = addressToIdentifiers[account][trustedIssuer].length;
      for (uint256 j = 0; j < numIssuersForAddress; j = j.add(1)) {
        // Iterate through the list of identifiers
        if (currIndex < maxIdentifiers) {
          bytes32 identifier = addressToIdentifiers[account][trustedIssuer][j];
          // Check if the mapping was produced by a revoked signer
          IdentifierOwnershipAttestation[] memory attestationsForIssuer = identifierToAddresses[identifier][trustedIssuer];
          for (uint256 k = 0; k < attestationsForIssuer.length; k = k.add(1)) {
            IdentifierOwnershipAttestation memory attestation = attestationsForIssuer[k];
            // (identifier, account, issuer) tuples should be unique
            if (attestation.account == account && !revokedSigners[attestation.signer]) {
              identifiers[currIndex] = identifier;
              currIndex = currIndex.add(1);
              break;
            }
          }
        } else {
          break;
        }
      }
    }
    if (currIndex < maxIdentifiers) {
      // Allocate and fill properly-sized array
      bytes32[] memory trimmedIdentifiers = new bytes32[](currIndex);
      for (uint256 i = 0; i < currIndex; i = i.add(1)) {
        trimmedIdentifiers[i] = identifiers[i];
      }
      return trimmedIdentifiers;
    } else {
      return identifiers;
    }
  }

  // TODO do we want to restrict permissions, or should anyone with a valid signature be able to register an attestation?
  modifier isValidUser(address issuer, address account) {
    require(
      msg.sender == account ||
        msg.sender == issuer ||
        getAccounts().attestationSignerToAccount(msg.sender) == issuer,
      "User does not have permission to perform this action"
    );
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
      getAccounts().isSigner(issuer, signer, SIGNER_ROLE),
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
   * @dev Throws if sender is not the issuer, account, or signer
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
      // This enforces only one attestation to be uploaded for a given set of (identifier, issuer, account)
      // Editing/upgrading an attestation requires that it be deleted before a new one is registered
      require(
        identifierToAddresses[identifier][issuer][i].account != account,
        "Attestation for this account already exists"
      );
    }
    IdentifierOwnershipAttestation memory attestation = IdentifierOwnershipAttestation(
      account,
      issuedOn,
      signer
    );
    identifierToAddresses[identifier][issuer].push(attestation);
    addressToIdentifiers[account][issuer].push(identifier);
    emit AttestationRegistered(identifier, issuer, account, issuedOn, signer);
  }

  function deleteAttestation(bytes32 identifier, address issuer, address account) public {
    // TODO ASv2 this should short-circuit, but double check (i.e. succeeds if msg.sender == account)
    require(
      msg.sender == account || getAccounts().attestationSignerToAccount(msg.sender) == issuer
    );

    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      IdentifierOwnershipAttestation memory attestation = identifierToAddresses[identifier][issuer][i];
      if (attestation.account == account) {
        // This is meant to delete the attestation in the array and then move the last element in the array to that empty spot, to avoid having empty elements in the array
        // Not sure if this is needed and if the added gas costs from the complexity is worth it
        identifierToAddresses[identifier][issuer][i] = identifierToAddresses[identifier][issuer][identifierToAddresses[identifier][issuer]
          .length -
          1];
        identifierToAddresses[identifier][issuer].pop();

        // TODO revisit if deletedIdentifier check is necessary - not sure if there would ever be a situation where the matching identifier is not present
        bool deletedIdentifier = false;
        for (uint256 j = 0; j < addressToIdentifiers[account][issuer].length; j++) {
          if (addressToIdentifiers[account][issuer][j] == identifier) {
            addressToIdentifiers[account][issuer][j] = addressToIdentifiers[account][issuer][addressToIdentifiers[account][issuer]
              .length -
              1];
            addressToIdentifiers[account][issuer].pop();
            deletedIdentifier = true;
            break;
          }
        }
        // Hard requirement to delete from both mappings in unison
        require(deletedIdentifier);
        break;
      }
    }
  }

  function revokeSigner(address signer) public {
    // TODO ASv2 add constraints on who has permissions to revoke a signer
    revokedSigners[signer] = true;
  }
}
