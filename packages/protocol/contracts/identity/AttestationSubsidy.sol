pragma solidity ^0.5.3;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/utils/SafeCast.sol";

import "./interfaces/IAttestations.sol";
import "./interfaces/IRandom.sol";
import "../common/interfaces/IAccounts.sol";

import "../common/Initializable.sol";
import "../common/UsingRegistry.sol";
import "../common/Signatures.sol";
import "../common/UsingPrecompiles.sol";
import "../common/libraries/ReentrancyGuard.sol";
import "./interfaces/IAttestationSubsidy.sol";
import "../common/interfaces/IMetaTransactionWallet.sol";

/**
 * @title Contract that implements a meta-tx based cUSD subsidy for attestations
 */
contract AttestationSubsidy is
  IAttestationSubsidy,
  Ownable,
  Initializable,
  UsingRegistry,
  ReentrancyGuard,
  UsingPrecompiles
{
  using SafeMath for uint256;
  using SafeCast for uint256;

  // Limit the maximum number of subsidised attestations that can be requested
  uint256 public maxSubsidisedAttestations;

  event AttestationSubsidised(address indexed account, uint256 value);
  event MaxSubsidiesAttestationsSet(uint256 value);
  /**
    * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
    * @param registryAddress The address of the registry core smart contract.
    * @param maxSubsidiesAttestations Maximum number of attestations that can be subsidies in one request
    */
  function initialize(address registryAddress, uint256 maxSubsidisedAttestations)
    external
    initializer
  {
    _transferOwnership(msg.sender);
    setRegistry(registryAddress);
    setMaxSubsidisedAttestations(maxSubsidisedAttestations);
  }

  /**
   * @notice Updates 'maxSubsidiesAttestations'.
   * @param _maxSubsidiesAttestations Maximum number of attestations that can be subsidies in one request
   */
  function setMaxSubsidisedAttestations(uint256 _maxSubsidisedAttestations) public onlyOwner {
    require(_maxSubsidisedAttestations > 0, "maxSubsidisedAttestations has to be greater than 0");
    maxSubsidisedAttestations = _maxSubsidisedAttestations;
    emit MaxSubsidiesAttestationsSet(_maxSubsidisedAttestations);
  }

  /**
    * @notice Used to batch three operations:
    * - Approve cUSD transfer between the beneficiary meta-wallet and the attestations contract
    * - Transfer the cUSD subsidy to the meta-wallet
    * - Execute the attestation request to spend the cUSD subsidy
    * @param beneficiaryMetaWallet The address of the beneficiary meta-wallet
    * @param identifier The identifier to request attestations for (see Attestations.sol)
    * @param attestationsRequested The number of attestations requested (see Attestations.sol)
    * @param v Array of signature components `v` for the meta-txs
    * @param r Array of signature components `r` for the meta-txs
    * @param s Array of signature components `s` for the meta-txs
    * @dev The signature component arrays should have 2 items:
    *   (v,r,s)[0] = signature for cUSD.approve(Attestations.sol, attestationsRequested*fee)
    *   (v,r,s)[1] = signature for Attestations.request(identifier, attestationsRequested, cUSD)
    */
  function requestAttestationsWithSubsidy(
    address beneficiaryMetaWallet,
    bytes32 identifier,
    uint256 attestationsRequested,
    uint8[] calldata v,
    bytes32[] calldata r,
    bytes32[] calldata s
  ) external onlyOwner nonReentrant {
    require(v.length == 2, "two signatures are required (approve,request)");
    require(r.length == 2, "two signatures are required (approve,request)");
    require(s.length == 2, "two signatures are required (approve,request)");
    require(attestationsRequested < maxSubsidisedAttestations, "too many attestations requested");

    (, uint256 requestsBefore) = getAttestations().getAttestationStats(
      identifier,
      beneficiaryMetaWallet
    );
    uint256 totalFee = calculateTotalFee(attestationsRequested);

    IMetaTransactionWallet metaWallet = IMetaTransactionWallet(beneficiaryMetaWallet);
    IERC20 cUSD = IERC20(address(getStableToken()));

    metaApproveCUSD(metaWallet, totalFee, v[0], r[0], s[0]);
    cUSD.transfer(beneficiaryMetaWallet, totalFee);
    metaRequestAttestations(metaWallet, identifier, attestationsRequested, v[1], r[1], s[1]);

    (, uint256 requestsAfter) = getAttestations().getAttestationStats(
      identifier,
      beneficiaryMetaWallet
    );
    require(
      requestsBefore + attestationsRequested == requestsAfter,
      "meta-transaction didn't result in attestations being requested"
    );

    emit AttestationSubsidised(beneficiaryMetaWallet, totalFee);
  }

  /**
    * @notice executes the cUSD approval from the metaWallet to the Attestations contract
    * @param metaWallet The MetaTransactionWallet in question
    * @param totalFee The total amount of cUSD to be approved
    * @param v The signature component `v` for the meta-transaction
    * @param r The signature component `r` for the meta-transaction
    * @param s The signature component `s` for the meta-transaction
    */
  function metaApproveCUSD(
    IMetaTransactionWallet metaWallet,
    uint256 totalFee,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    bytes memory callData = abi.encodeWithSignature(
      "approve(address,value)",
      address(getAttestations()),
      totalFee
    );
    metaWallet.executeMetaTransaction(address(getStableToken()), uint256(0), callData, v, r, s);
  }

  /**
    * @notice executes the request attestations meta transaction on the metaWallet
    * @param metaWallet The wallet in question
    * @param identifier The identifier for the attestation (see Attestations.sol)
    * @param attestationsRequested The number of attestations requested (see Attestations.sol)
    * @param v The signature component `v` for the meta-transaction
    * @param r The signature component `r` for the meta-transaction
    * @param s The signature component `s` for the meta-transaction
    */
  function metaRequestAttestations(
    IMetaTransactionWallet metaWallet,
    bytes32 identifier,
    uint256 attestationsRequested,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) internal {
    bytes memory callData = abi.encodeWithSignature(
      "request(bytes32,uint256,address)",
      identifier,
      attestationsRequested,
      address(getStableToken())
    );
    metaWallet.executeMetaTransaction(address(getAttestations()), uint256(0), callData, v, r, s);
  }

  /**
    * @notice calculates the total fee of the attestation request that will be subsidized
    * @param attestationsRequested The number of attestations requested (see Attestations.sol)
    */
  function calculateTotalFee(uint256 attestationsRequested) internal view returns (uint256) {
    return
      getAttestations().getAttestationRequestFee(address(getStableToken())).mul(
        attestationsRequested
      );
  }
}
