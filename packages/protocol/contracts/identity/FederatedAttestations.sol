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

  struct Attestation {
    address account;
    uint256 issuedOn;
    address signer;
  }
  // identifier -> issuer -> attestations
  mapping(bytes32 => mapping(address => Attestation[])) public identifierToAddresses;
  // account -> issuer -> identifiers
  mapping(address => mapping(address => bytes32[])) public addressToIdentifiers;
  // signer => revocation time
  mapping(address => uint256) public revokedSigners;

  // TODO ASv2 Event declarations

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
    // TODO ASv2 initialize any other variables here
  }

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() external pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  function _isRevoked(address signer, uint256 time) internal returns (bool) {
    if (revokedSigners[signer] > 0 && revokedSigners[signer] >= time) {
      return true;
    }
    return false;
  }

  function lookupAttestations(string identifier, address[] trustedIssuers)
    public
    view
    returns (Attestation[])
  {
    Attestation[] memory attestations = new Attestation[];
    for (uint256 i = 0; i < trustedIssuers.length; i++) {
      address trustedIssuer = trustedIssuers[i];
      for (uint256 j = 0; j < identifierToAddresses[identifier][trustedIssuer].length; j++) {
        Attestation memory attestation = identifierToAddresses[identifier][trustedIssuer][j];
        if (!_isRevoked(attestation.signer, attestation.issuedOn)) {
          attestations.push(attestation);
        }
      }
    }
    return attestations;
  }

  function lookupIdentifiersbyAddress(address account, address[] trustedIssuers)
    public
    view
    returns (bytes32[])
  {
    bytes32[] memory identifiers = new bytes32[];
    for (uint256 i = 0; i < trustedIssuers.length; i++) {
      address trustedIssuer = trustedIssuers[i];
      for (uint256 j = 0; j < addressToIdentifiers[account][trustedIssuer].length; j++) {
        bytes32 memory identifier = addressToIdentifiers[account][trustedIssuer][j];
        Attestation memory attestation = identifierToAddresses[identifier][trustedIssuer];
        if (!_isRevoked(attestation.signer, attestation.issuedOn)) {
          identifiers.push(identifier);
        }
      }
    }
    return identifiers;
  }

  function registerAttestation(bytes32 identifier, address issuer, Attestation attestation) public {
    require(
      msg.sender == attestation.account || msg.sender == issuer || msg.sender == attestation.signer
    );
    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      require(identifierToAddresses[identifier][issuer][i] != attestation.account);
    }
    identifierToAddresses[identifier][issuer].push(attestation);
    addressToIdentifiers[attestation.account][issuer] = identifier;
  }

  function deleteAttestation(bytes32 identifier, address issuer, address account) public {
    require(msg.sender == attestation.account || msg.sender == issuer);
    for (uint256 i = 0; i < identifierToAddresses[identifier][issuer].length; i++) {
      if (identifierToAddresses[identifier][issuer][i].account == account) {
        identifierToAddresses[identifier][issuer][i] = identifierToAddresses[identifier][issuer][identifierToAddresses[identifier][issuer]
          .length -
          1];
        identifierToAddresses[identifier][issuer].pop();
        for (uint256 i = 0; i < addressToIdentifiers[account][issuer].length; i++) {
          if (addressToIdentifiers[account][issuer][i].account == account) {
            addressToIdentifiers[account][issuer][i] = addressToIdentifiers[account][issuer][addressToIdentifiers[account][issuer]
              .length -
              1];
            addressToIdentifiers[account][issuer].pop();
            break;
          }
        }
        break;
      }
    }
  }
}
