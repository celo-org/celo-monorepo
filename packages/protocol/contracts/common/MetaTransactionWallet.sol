pragma solidity ^0.5.3;
import "openzeppelin-solidity/contracts/cryptography/ECDSA.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";

import "./interfaces/ICeloVersionedContract.sol";
import "./interfaces/IMetaTransactionWallet.sol";
import "./Initializable.sol";

contract MetaTransactionWallet is
  IMetaTransactionWallet,
  ICeloVersionedContract,
  Initializable,
  Ownable
{
  using SafeMath for uint256;

  bytes32 public EIP172_DOMAIN_SEPARATOR;
  // bytes32 public constant EIP172_EXECUTE_META_TRANSACTION_TYPEHASH = keccak256("ExecuteMetaTransaction(address destination,uint256 value,bytes data,uint256 nonce)");
  bytes32 public constant EIP172_EXECUTE_META_TRANSACTION_TYPEHASH = 0x509c6e92324b7214543573524d0bb493d654d3410fa4f4937b3d2f4a903edd33;
  uint256 public nonce;
  address public signer;

  event SignerSet(address signer);
  event EIP172DomainSeparatorSet(bytes32 eip172DomainSeparator);
  event TransactionExecution(address destination, uint256 value, bytes data, bytes returnData);
  event MetaTransactionExecution(address destination, uint256 value, bytes data, bytes returnData);

  /**
    * @dev Fallback function allows to deposit ether.
    */
  function() external payable {}

  /**
   * @notice Returns the storage, major, minor, and patch version of the contract.
   * @return The storage, major, minor, and patch version of the contract.
   */
  function getVersionNumber() public pure returns (uint256, uint256, uint256, uint256) {
    return (1, 1, 0, 0);
  }

  /**
   * @notice Used in place of the constructor to allow the contract to be upgradable via proxy.
   * @param _signer The address authorized to execute transactions via this wallet.
   */
  function initialize(address _signer, uint256 chainId) external initializer {
    setSigner(_signer);
    setEip172DomainSeparator(chainId);
    // MetaTransactionWallet owns itself, which necessitates that all onlyOwner functions
    // be called via executeTransaction or executeMetaTransaction.
    // If the signer was the owner, onlyOwner functions would not be callable via
    // meta-transactions.
    _transferOwnership(address(this));
  }

  /**
   * @notice Transfers control of the wallet to a new signer.
   * @param _signer The address authorized to execute transactions via this wallet.
   */
  function setSigner(address _signer) public onlyOwner {
    signer = _signer;
    emit SignerSet(signer);
  }

  /**
   * @notice Sets the EIP-172 domain separator.
   * @param chainId The chain ID on which the contract is running.
   * @dev Should be called every time the wallet is upgraded to a new version.
   */
  function setEip172DomainSeparator(uint256 chainId) public onlyOwner {
    // TODO: Use the actual version number
    // (uint256 a, uint256 b, uint256 c, uint256 d) = getVersionNumber();
    EIP172_DOMAIN_SEPARATOR = keccak256(
      abi.encode(
        keccak256(
          "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        ),
        keccak256(bytes("MetaTransactionWallet")),
        keccak256("1"),
        chainId,
        address(this)
      )
    );
    emit EIP172DomainSeparatorSet(EIP172_DOMAIN_SEPARATOR);
  }

  // for debugging, this doesn't seem to match the sign-typed-data-utils implementation
  function getMetaTransactionStructHash(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce
  ) public view returns (bytes32) {
    return
      keccak256(
        abi.encode(EIP172_EXECUTE_META_TRANSACTION_TYPEHASH, destination, value, data, _nonce)
      );
  }

  function getMetaTransactionDigest(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce
  ) public view returns (bytes32) {
    bytes32 structHash = keccak256(
      abi.encode(
        EIP172_EXECUTE_META_TRANSACTION_TYPEHASH,
        abi.encode(destination, value, data, _nonce)
      )
    );
    return keccak256(abi.encodePacked("\x19\x01", EIP172_DOMAIN_SEPARATOR, structHash));
  }

  /**
   * @notice Returns the address that signed the provided meta-transaction.
   * @return The address that signed the provided meta-transaction.
   */
  function getMetaTransactionSigner(
    address destination,
    uint256 value,
    bytes memory data,
    uint256 _nonce,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public view returns (address) {
    // TODO: Should use Signatures library given we expect to use the Ethereum Signed Message prefix
    bytes32 digest = getMetaTransactionDigest(destination, value, data, _nonce);
    bytes memory signature = new bytes(65);
    // Concatenate (r, s, v) into signature.
    assembly {
      mstore(add(signature, 32), r)
      mstore(add(signature, 64), s)
      mstore8(add(signature, 96), v)
    }
    return ECDSA.recover(digest, signature);
  }

  // TODO(asa): Should this take a nonce?
  /**
   * @notice Executes a meta-transaction on behalf of the signer.`
   * @return The return value of the meta-transaction execution.
   */
  function executeMetaTransaction(
    address destination,
    uint256 value,
    bytes calldata data,
    uint8 v,
    bytes32 r,
    bytes32 s
  ) external returns (bytes memory) {
    address _signer = getMetaTransactionSigner(destination, value, data, nonce, v, r, s);
    require(_signer == signer, "Invalid meta-transaction signer");
    bytes memory returnData = _executeTransaction(destination, value, data);
    emit MetaTransactionExecution(destination, value, data, returnData);
    return returnData;
  }

  // TODO(asa): Should this take a nonce?
  /**
   * @notice Executes a transaction on behalf of the signer.`
   * @return The return value of the transaction execution.
   */
  function executeTransaction(
    address destination,
    uint256 value,
    bytes calldata data,
    uint256 _nonce
  ) external returns (bytes memory) {
    require(msg.sender == signer, "Invalid transaction sender");
    require(_nonce == nonce, "Invalid transaction nonce");
    bytes memory returnData = _executeTransaction(destination, value, data);
    emit TransactionExecution(destination, value, data, returnData);
    return returnData;
  }

  /**
   * @notice Executes a transaction on behalf of the signer.`
   * @return The return value of the transaction execution.
   */
  function _executeTransaction(address destination, uint256 value, bytes memory data)
    private
    returns (bytes memory)
  {
    nonce = nonce.add(1);
    if (data.length > 0) require(Address.isContract(destination), "Invalid contract address");
    bool success;
    bytes memory returnData;
    (success, returnData) = destination.call.value(value)(data);
    require(success, "Transaction execution failed.");
    return returnData;
  }
}
