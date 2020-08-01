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

  event AttestationSubsidised(address indexed account, uint256 value);

  /**
     * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
     * @param registryAddress The address of the registry core smart contract.
     */
  function initialize(address registryAddress) external initializer {
    setRegistry(registryAddress);
    _transferOwnership(msg.sender);
  }

  /**
     * @notice Used to batch three operations:
     * - Approve cUSD transfer between the beneficiary meta-wallet and the attestations contract
     * - Transfer the cUSD subsidy to the meta-wallet
     * - Execute the attestation request to spend the cUSD subsidy
     * @param beneficiaryMetaWallet - the address of the beneficiary meta-wallet
     * @param identifier - the identifier to request attestations for (see Attestations.sol)
     * @param attestationsRequested - the number of attestations requested (see Attestations.sol)
     * @param v,r,s - array of signatures:
     *    -- [0] = signatures for cUSD.approve(Attestations.sol, attestationsRequested*fee)
     *    -- [1] = signatures for Attestations.request(identifier, attestationsRequested, cUSD)
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

    uint256 totalFee = _calculateTotalFee(attestationsRequested);
    IMetaTransactionWallet metaWallet = IMetaTransactionWallet(beneficiaryMetaWallet);
    IERC20 cUSD = IERC20(address(getStableToken()));

    _metaApproveCUSD(metaWallet, totalFee, v[0], r[0], s[0]);
    cUSD.transfer(beneficiaryMetaWallet, totalFee);
    _metaRequestAttestations(metaWallet, identifier, attestationsRequested, v[1], r[1], s[1]);

    emit AttestationSubsidised(beneficiaryMetaWallet, totalFee);
  }

  /**
     * @notice executes the cUSD approval from the metaWallet to the Attestations contract
     * @param metaWallet - the wallet in question
     * @param totalFee - the total amount of cUSD to be approved
     * @param v,r,s - the signature for the meta-transaction
     */
  function _metaApproveCUSD(
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
     * @param metaWallet - the wallet in question
     * @param identifier - the identifier for the attestation (see Attestations.sol)
     * @param attestationsRequested - the number of attestations requested (see Attestations.sol)
     * @param v,r,s - the signature for the meta-transaction
     */
  function _metaRequestAttestations(
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
     * @param attestationsRequested - the number of attestations requested (see Attestations.sol)
     */
  function _calculateTotalFee(uint256 attestationsRequested) internal view returns (uint256) {
    return
      getAttestations().getAttestationRequestFee(address(getStableToken())).mul(
        attestationsRequested
      );
  }
}
